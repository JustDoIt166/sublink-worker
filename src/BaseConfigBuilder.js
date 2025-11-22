import { ProxyParser, convertYamlProxyToObject } from './ProxyParsers.js';
import { DeepCopy, tryDecodeSubscriptionLines, decodeBase64, parseCountryFromNodeName } from './utils.js';
import yaml from 'js-yaml';
import { t, setLanguage } from './i18n/index.js';
import { generateRules, getOutbounds, PREDEFINED_RULE_SETS } from './config.js';

export class BaseConfigBuilder {
    constructor(inputString, baseConfig, lang, userAgent, groupByCountry = false) {
        this.inputString = inputString;
        this.config = DeepCopy(baseConfig);
        this.customRules = [];
        this.selectedRules = [];
        setLanguage(lang);
        this.userAgent = userAgent;
        this.appliedOverrideKeys = new Set();
        this.groupByCountry = groupByCountry;
    }

    async build() {
        const customItems = await this.parseCustomItems();
        this.addCustomItems(customItems);
        this.addSelectors();
        return this.formatConfig();
    }

    async parseCustomItems() {
        const input = this.inputString || '';
        const parsedItems = [];

        // Quick heuristic: if looks like plain YAML text (and not URLs), try YAML first without decoding
        const looksLikeYaml = /\bproxies\s*:/i.test(input) && /\btype\s*:/i.test(input);
        if (looksLikeYaml) {
            try {
                const obj = yaml.load(input.trim());
                if (obj && typeof obj === 'object' && Array.isArray(obj.proxies)) {
                    const overrides = DeepCopy(obj);
                    delete overrides.proxies;
                    if (Object.keys(overrides).length > 0) {
                        try {
                            this.applyConfigOverrides(overrides);
                        } catch (e) {
                            console.warn('Failed to apply YAML overrides (heuristic path):', e?.message || e);
                        }
                    }

                    for (const p of obj.proxies) {
                        try {
                            const proxy = convertYamlProxyToObject(p);
                            if (proxy) parsedItems.push(proxy);
                        } catch (e) {
                            console.warn('Skipping invalid YAML proxy (heuristic path):', e?.message || e);
                            continue; // 单个节点坏了，不影响后续
                        }
                    }

                    if (parsedItems.length > 0) return parsedItems;
                }
            } catch (e) {
                console.warn('YAML parse failed in builder (heuristic path):', e?.message || e);
            }
        }

        // If not clear YAML, only try whole-document decode if input looks base64-like
        const isBase64Like =
            /^[A-Za-z0-9+/=\r\n]+$/.test(input) &&
            input.replace(/[\r\n]/g, '').length % 4 === 0;

        if (!looksLikeYaml && isBase64Like) {
            try {
                const sanitized = input.replace(/\s+/g, '');
                const decodedWhole = decodeBase64(sanitized);
                if (typeof decodedWhole === 'string') {
                    const maybeYaml = decodedWhole.trim();
                    try {
                        const obj = yaml.load(maybeYaml);
                        if (obj && typeof obj === 'object' && Array.isArray(obj.proxies)) {
                            const overrides = DeepCopy(obj);
                            delete overrides.proxies;
                            if (Object.keys(overrides).length > 0) {
                                try {
                                    this.applyConfigOverrides(overrides);
                                } catch (e) {
                                    console.warn('Failed to apply overrides from decoded YAML:', e?.message || e);
                                }
                            }

                            for (const p of obj.proxies) {
                                try {
                                    const proxy = convertYamlProxyToObject(p);
                                    if (proxy) parsedItems.push(proxy);
                                } catch (e) {
                                    console.warn('Skipping invalid proxy from decoded YAML:', e?.message || e);
                                    continue;
                                }
                            }

                            if (parsedItems.length > 0) return parsedItems;
                        }
                    } catch (e) {
                        // not YAML; fall through
                    }
                }
            } catch (_) {
                // base64 解码失败，忽略整段，继续走下面的逐行逻辑
            }
        }

        // Otherwise, line-by-line processing (URLs, subscription content, remote lists, etc.)
        const urls = input
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '');

        for (const url of urls) {
            let processedUrls;
            try {
                processedUrls = tryDecodeSubscriptionLines(url);
            } catch (e) {
                console.warn(`Skipping invalid subscription line: ${url}`, e);
                continue; // 当前整行有问题，继续下一行
            }

            if (!Array.isArray(processedUrls)) {
                processedUrls = [processedUrls];
            }

            for (const processedUrl of processedUrls) {
                if (!processedUrl) continue;

                try {
                    const result = await ProxyParser.parse(processedUrl, this.userAgent);

                    // 解析结果为一个 YAML 配置（含 proxies）
                    if (result && typeof result === 'object' && result.type === 'yamlConfig') {
                        if (result.config) {
                            try {
                                this.applyConfigOverrides(result.config);
                            } catch (e) {
                                console.warn('Failed to apply overrides from yamlConfig result:', e?.message || e);
                            }
                        }
                        if (Array.isArray(result.proxies)) {
                            for (const proxy of result.proxies) {
                                try {
                                    if (proxy && typeof proxy === 'object' && proxy.tag) {
                                        parsedItems.push(proxy);
                                    }
                                } catch (e) {
                                    console.warn('Skipping invalid proxy in yamlConfig result:', e?.message || e);
                                    continue;
                                }
                            }
                        }
                        continue; // 这一条 processedUrl 已经处理完
                    }

                    // 解析结果是一个数组
                    if (Array.isArray(result)) {
                        for (const item of result) {
                            if (item && typeof item === 'object' && item.tag) {
                                parsedItems.push(item);
                            } else if (typeof item === 'string') {
                                // 某些订阅会返回一组字符串节点，再次解析时单独保护
                                try {
                                    const subResult = await ProxyParser.parse(item, this.userAgent);
                                    if (subResult) {
                                        parsedItems.push(subResult);
                                    }
                                } catch (e) {
                                    console.warn(`Skipping invalid nested proxy: ${item}`, e);
                                    continue;
                                }
                            }
                        }
                    } else if (result) {
                        parsedItems.push(result);
                    }
                } catch (e) {
                    console.warn(`Skipping invalid proxy: ${processedUrl}`, e);
                    continue; // 跳过错误节点，继续解析下一个
                }
            }
        }

        return parsedItems;
    }

    applyConfigOverrides(overrides) {
        if (!overrides || typeof overrides !== 'object') {
            return;
        }

        // Allow incoming Clash YAML to override most fields, including 'proxy-groups'.
        // Still block 'proxies' (handled by dedicated parser), and keep ignoring
        // 'rules' and 'rule-providers' which are generated by our own logic.
        const blacklistedKeys = new Set(['proxies', 'rules', 'rule-providers']);

        Object.entries(overrides).forEach(([key, value]) => {
            if (blacklistedKeys.has(key)) {
                return;
            }

            try {
                if (value === undefined) {
                    delete this.config[key];
                    this.appliedOverrideKeys.add(key);
                } else {
                    this.config[key] = DeepCopy(value);
                    this.appliedOverrideKeys.add(key);
                }
            } catch (e) {
                console.warn(`Failed to apply config override for key "${key}"`, e);
            }
        });
    }

    hasConfigOverride(key) {
        return this.appliedOverrideKeys?.has(key);
    }

    getOutboundsList() {
        let outbounds;
        if (typeof this.selectedRules === 'string' && PREDEFINED_RULE_SETS[this.selectedRules]) {
            outbounds = getOutbounds(PREDEFINED_RULE_SETS[this.selectedRules]);
        } else if (this.selectedRules && Object.keys(this.selectedRules).length > 0) {
            outbounds = getOutbounds(this.selectedRules);
        } else {
            outbounds = getOutbounds(PREDEFINED_RULE_SETS.minimal);
        }
        return outbounds;
    }

    getProxyList() {
        return this.getProxies().map(proxy => this.getProxyName(proxy));
    }

    getProxies() {
        throw new Error('getProxies must be implemented in child class');
    }

    getProxyName(proxy) {
        throw new Error('getProxyName must be implemented in child class');
    }

    convertProxy(proxy) {
        throw new Error('convertProxy must be implemented in child class');
    }

    addProxyToConfig(proxy) {
        throw new Error('addProxyToConfig must be implemented in child class');
    }

    addAutoSelectGroup(proxyList) {
        throw new Error('addAutoSelectGroup must be implemented in child class');
    }

    addNodeSelectGroup(proxyList) {
        throw new Error('addNodeSelectGroup must be implemented in child class');
    }

    addOutboundGroups(outbounds, proxyList) {
        throw new Error('addOutboundGroups must be implemented in child class');
    }

    addCustomRuleGroups(proxyList) {
        throw new Error('addCustomRuleGroups must be implemented in child class');
    }

    addFallBackGroup(proxyList) {
        throw new Error('addFallBackGroup must be implemented in child class');
    }

    addCountryGroups() {
        throw new Error('addCountryGroups must be implemented in child class');
    }

    addCustomItems(customItems) {
        if (!Array.isArray(customItems) || customItems.length === 0) return;

        const validItems = customItems.filter(item => item != null);
        for (const item of validItems) {
            if (item?.tag) {
                try {
                    const convertedProxy = this.convertProxy(item);
                    if (convertedProxy) {
                        this.addProxyToConfig(convertedProxy);
                    }
                } catch (e) {
                    console.warn(`Skipping invalid custom item: ${item?.tag || '[no tag]'}`, e);
                    continue;
                }
            }
        }
    }

    addSelectors() {
        const outbounds = this.getOutboundsList();
        const proxyList = this.getProxyList();

        // 这些 group 构建属于整体结构问题，也可以在这里再做一层 try/catch。
        this.addAutoSelectGroup(proxyList);
        this.addNodeSelectGroup(proxyList);
        if (this.groupByCountry) {
            this.addCountryGroups();
        }
        this.addOutboundGroups(outbounds, proxyList);
        this.addCustomRuleGroups(proxyList);
        this.addFallBackGroup(proxyList);
    }

    generateRules() {
        return generateRules(this.selectedRules, this.customRules);
    }

    formatConfig() {
        throw new Error('formatConfig must be implemented in child class');
    }
}
