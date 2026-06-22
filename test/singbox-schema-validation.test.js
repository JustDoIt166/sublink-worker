import { describe, it, expect } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';
import { SING_BOX_CONFIG_V1_13 } from '../src/config/singboxConfig.js';

const REAL_SUBSCRIPTION = `
vless://351c9981-04b6-4103-aa4b-864aa9c91469@cf.hellotime.de5.net:443?encryption=none&security=tls&sni=cf.hellotime.de5.net&host=cf.hellotime.de5.net&type=ws&path=%2F351c9981-04b6-4103-aa4b-864aa9c91469%3Fed%3D2048&fp=chrome&alpn=h3,h2,http/1.1&ech=cloudflare-ech.com%2Bhttps%3A%2F%2Fdns.joeyblog.eu.org%2Fjoeyblog#%E5%8E%9F%E7%94%9F%E5%9C%B0%E5%9D%80-VLESS
trojan://351c9981-04b6-4103-aa4b-864aa9c91469@cf.hellotime.de5.net:443?security=tls&sni=cf.hellotime.de5.net&host=cf.hellotime.de5.net&type=ws&path=%2F351c9981-04b6-4103-aa4b-864aa9c91469%3Fed%3D2048&fp=chrome&alpn=h3,h2,http/1.1&ech=cloudflare-ech.com%2Bhttps%3A%2F%2Fdns.joeyblog.eu.org%2Fjoeyblog#%E5%8E%9F%E7%94%9F%E5%9C%B0%E5%9D%80-Trojan
vless://351c9981-04b6-4103-aa4b-864aa9c91469@cf.hellotime.de5.net:443?encryption=none&security=tls&sni=cf.hellotime.de5.net&fp=chrome&type=xhttp&host=cf.hellotime.de5.net&path=%2F351c9981-04b6-4103-aa4b-864aa9c91469%2Fxhttp&mode=stream-one&alpn=h3,h2,http/1.1&ech=cloudflare-ech.com%2Bhttps%3A%2F%2Fdns.joeyblog.eu.org%2Fjoeyblog#%E5%8E%9F%E7%94%9F%E5%9C%B0%E5%9D%80-xhttp
vless://351c9981-04b6-4103-aa4b-864aa9c91469@104.29.111.45:443?encryption=none&security=tls&sni=cf.hellotime.de5.net&host=cf.hellotime.de5.net&type=ws&path=%2F351c9981-04b6-4103-aa4b-864aa9c91469%3Fed%3D2048&fp=chrome&alpn=h3,h2,http/1.1&ech=cloudflare-ech.com%2Bhttps%3A%2F%2Fdns.joeyblog.eu.org%2Fjoeyblog#API%E4%BC%98%E9%80%89-104.29.111.45%3A443-VLESS
trojan://351c9981-04b6-4103-aa4b-864aa9c91469@104.29.111.45:443?security=tls&sni=cf.hellotime.de5.net&host=cf.hellotime.de5.net&type=ws&path=%2F351c9981-04b6-4103-aa4b-864aa9c91469%3Fed%3D2048&fp=chrome&alpn=h3,h2,http/1.1&ech=cloudflare-ech.com%2Bhttps%3A%2F%2Fdns.joeyblog.eu.org%2Fjoeyblog#API%E4%BC%98%E9%80%89-104.29.111.45%3A443-Trojan
vless://351c9981-04b6-4103-aa4b-864aa9c91469@104.29.111.45:443?encryption=none&security=tls&sni=cf.hellotime.de5.net&fp=chrome&type=xhttp&host=cf.hellotime.de5.net&path=%2F351c9981-04b6-4103-aa4b-864aa9c91469%2Fxhttp&mode=stream-one&alpn=h3,h2,http/1.1&ech=cloudflare-ech.com%2Bhttps%3A%2F%2Fdns.joeyblog.eu.org%2Fjoeyblog#API%E4%BC%98%E9%80%89-104.29.111.45%3A443-xhttp
vless://351c9981-04b6-4103-aa4b-864aa9c91469@[2606:4700:a8:b92c:8b:1910:1cee:12d2:443]:443?encryption=none&security=tls&sni=cf.hellotime.de5.net&host=cf.hellotime.de5.net&type=ws&path=%2F351c9981-04b6-4103-aa4b-864aa9c91469%3Fed%3D2048&fp=chrome&alpn=h3,h2,http/1.1&ech=cloudflare-ech.com%2Bhttps%3A%2F%2Fdns.joeyblog.eu.org%2Fjoeyblog#API%E4%BC%98%E9%80%89-2606%3A4700%3Aa8%3Ab92c%3A8b%3A1910%3A1cee%3A12d2%3A443-VLESS
trojan://351c9981-04b6-4103-aa4b-864aa9c91469@[2606:4700:a8:b92c:8b:1910:1cee:12d2:443]:443?security=tls&sni=cf.hellotime.de5.net&host=cf.hellotime.de5.net&type=ws&path=%2F351c9981-04b6-4103-aa4b-864aa9c91469%3Fed%3D2048&fp=chrome&alpn=h3,h2,http/1.1&ech=cloudflare-ech.com%2Bhttps%3A%2F%2Fdns.joeyblog.eu.org%2Fjoeyblog#API%E4%BC%98%E9%80%89-2606%3A4700%3Aa8%3Ab92c%3A8b%3A1910%3A1cee%3A12d2%3A443-Trojan
vless://351c9981-04b6-4103-aa4b-864aa9c91469@[2606:4700:a8:b92c:8b:1910:1cee:12d2:443]:443?encryption=none&security=tls&sni=cf.hellotime.de5.net&fp=chrome&type=xhttp&host=cf.hellotime.de5.net&path=%2F351c9981-04b6-4103-aa4b-864aa9c91469%2Fxhttp&mode=stream-one&alpn=h3,h2,http/1.1&ech=cloudflare-ech.com%2Bhttps%3A%2F%2Fdns.joeyblog.eu.org%2Fjoeyblog#API%E4%BC%98%E9%80%89-2606%3A4700%3Aa8%3Ab92c%3A8b%3A1910%3A1cee%3A12d2%3A443-xhttp
`.trim();

const LEGACY_INBOUND_FIELDS = ['sniff', 'sniff_timeout', 'sniff_override_destination', 'domain_strategy', 'udp_disable_domain_unmapping'];

function getProxies(config) {
    return config.outbounds.filter(o => o?.server != null);
}

function getGroupOutbounds(config) {
    return config.outbounds.filter(o => o?.type === 'selector' || o?.type === 'urltest');
}

describe('Sing-Box schema validation with real subscription data', () => {
    describe('Top-level configuration structure', () => {
        it('should have all required top-level keys from the official sing-box structure', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            expect(result).toHaveProperty('dns');
            expect(result).toHaveProperty('ntp');
            expect(result).toHaveProperty('inbounds');
            expect(result).toHaveProperty('outbounds');
            expect(result).toHaveProperty('route');
            expect(result).toHaveProperty('experimental');

            expect(Array.isArray(result.inbounds)).toBe(true);
            expect(Array.isArray(result.outbounds)).toBe(true);
        });

        it('should not contain deprecated geoip/geosite in route rules (migrated to rule_set)', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            for (const rule of result.route.rules) {
                expect(rule).not.toHaveProperty('geoip');
                expect(rule).not.toHaveProperty('geosite');
                expect(rule).not.toHaveProperty('source_geoip');
            }
        });
    });

    describe('DNS section', () => {
        it('should use new DNS server format (type/server, not address)', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            for (const server of result.dns.servers) {
                expect(server).not.toHaveProperty('address');
                expect(server).toHaveProperty('tag');
                expect(server).toHaveProperty('type');
                if (server.type !== 'fakeip') {
                    expect(server).toHaveProperty('server');
                }
            }

            expect(result.dns).toHaveProperty('final', 'dns_direct');
        });

        it('should have DNS servers with correct types', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            const serverTypes = result.dns.servers.map(s => s.type);
            expect(serverTypes).toContain('tcp');
            expect(serverTypes).toContain('https');
            expect(serverTypes).toContain('udp');
            expect(serverTypes).toContain('fakeip');
        });

        it('should have DNS routing rules', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            expect(Array.isArray(result.dns.rules)).toBe(true);
            expect(result.dns.rules.length).toBeGreaterThan(0);
            for (const rule of result.dns.rules) {
                if (rule.action === 'predefined') {
                    expect(rule).toHaveProperty('rcode');
                } else {
                    expect(rule).toHaveProperty('server');
                }
            }
        });
    });

    describe('NTP section', () => {
        it('should have NTP configured', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            expect(result.ntp).toMatchObject({
                enabled: true,
                server: 'time.apple.com',
                server_port: 123,
                interval: '30m'
            });
        });
    });

    describe('Inbound section', () => {
        it('should have 6 inbounds with no legacy fields', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            expect(result.inbounds.length).toBe(6);
            const tags = result.inbounds.map(i => i.tag).sort();
            expect(tags).toEqual(['dns-in', 'http-in', 'redirect-in', 'socks-in', 'tproxy-in', 'tun-in']);

            for (const inbound of result.inbounds) {
                for (const field of LEGACY_INBOUND_FIELDS) {
                    expect(inbound).not.toHaveProperty(field);
                }
                expect(inbound).toHaveProperty('type');
                expect(inbound).toHaveProperty('tag');
                if (inbound.type === 'tun') {
                    expect(inbound).toHaveProperty('address');
                } else {
                    expect(inbound).toHaveProperty('listen');
                    expect(inbound).toHaveProperty('listen_port');
                }
            }
        });
    });

    describe('Outbound section - official sing-box structure', () => {
        it('every outbound must have a tag (official requirement)', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            for (const outbound of result.outbounds) {
                expect(outbound).toHaveProperty('tag');
                expect(typeof outbound.tag).toBe('string');
                expect(outbound.tag.length).toBeGreaterThan(0);
            }
        });

        it('every outbound must have a valid type (official: selector/urltest/direct/vless/trojan/...)', async () => {
            const validTypes = ['direct', 'selector', 'urltest', 'vless', 'trojan', 'vmess', 'shadowsocks', 'hysteria2', 'tuic', 'block', 'dns', 'http', 'socks', 'wireguard', 'hysteria', 'shadowtls', 'anytls', 'tor', 'ssh', 'naive'];
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            for (const outbound of result.outbounds) {
                expect(validTypes).toContain(outbound.type);
            }
        });

        it('should not contain block/dns type outbounds (migrated to rule actions in 1.13)', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            const types = result.outbounds.map(o => o.type);
            expect(types).not.toContain('block');
            expect(types).not.toContain('dns');
        });

        it('should not contain REJECT in any outbound references', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            for (const outbound of result.outbounds) {
                if (Array.isArray(outbound.outbounds)) {
                    expect(outbound.outbounds).not.toContain('REJECT');
                }
            }
        });

        it('should have DIRECT outbound', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            const direct = result.outbounds.find(o => o.tag === 'DIRECT');
            expect(direct).toBeDefined();
            expect(direct.type).toBe('direct');
        });
    });

    describe('Proxy outbound fields (official sing-box format)', () => {
        it('proxy outbounds should not have Clash-only udp field (sing-box default allows both TCP/UDP)', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            for (const proxy of getProxies(result)) {
                expect(proxy).not.toHaveProperty('udp');
            }
        });

        it('proxy outbounds should not have top-level network field', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            for (const proxy of getProxies(result)) {
                expect(proxy).not.toHaveProperty('network');
            }
        });

        it('alpn should be inside tls object when present', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            for (const proxy of getProxies(result)) {
                if (proxy.tls?.enabled) {
                    expect(proxy.tls).toHaveProperty('alpn');
                    expect(Array.isArray(proxy.tls.alpn)).toBe(true);
                    expect(proxy.tls.alpn.length).toBeGreaterThan(0);
                }
            }
        });

        it('should have utls fingerprint when fp is provided', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            for (const proxy of getProxies(result)) {
                if (proxy.tls?.enabled) {
                    expect(proxy.tls).toHaveProperty('utls');
                    expect(proxy.tls.utls).toHaveProperty('enabled', true);
                    expect(proxy.tls.utls).toHaveProperty('fingerprint');
                }
            }
        });

        it('proxy outbounds should have server, server_port, and type-specific fields', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            for (const proxy of getProxies(result)) {
                expect(proxy).toHaveProperty('server');
                expect(proxy).toHaveProperty('server_port');
                expect(typeof proxy.server).toBe('string');
                expect(typeof proxy.server_port).toBe('number');

                if (proxy.type === 'vless') {
                    expect(proxy).toHaveProperty('uuid');
                    if (proxy.encryption) {
                        expect(proxy.encryption).toBe('none');
                    }
                }
                if (proxy.type === 'trojan') {
                    expect(proxy).toHaveProperty('password');
                }
                if (proxy.tls?.enabled) {
                    expect(proxy.tls).toHaveProperty('server_name');
                }
            }
        });

        it('should preserve transport configuration', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            for (const proxy of getProxies(result)) {
                if (proxy.transport) {
                    expect(['ws', 'http', 'grpc', 'httpupgrade']).toContain(proxy.transport.type);
                    if (proxy.transport.type === 'ws') {
                        expect(proxy.transport).toHaveProperty('path');
                    }
                    if (proxy.transport.type === 'http') {
                        expect(proxy.transport).toHaveProperty('path');
                        expect(proxy.transport).toHaveProperty('host');
                        expect(proxy.transport).toHaveProperty('method', 'PUT');
                    }
                }
            }
        });
    });

    describe('Group outbound (selector/urltest) structure', () => {
        it('selector outbounds should have type, tag, and outbounds array', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            for (const group of getGroupOutbounds(result)) {
                expect(group).toHaveProperty('type');
                expect(group).toHaveProperty('tag');
                expect(group).toHaveProperty('outbounds');
                expect(Array.isArray(group.outbounds)).toBe(true);
                expect(group.outbounds.length).toBeGreaterThan(0);
            }
        });

        it('urltest groups should have valid outbound references', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            const allTags = new Set(result.outbounds.map(o => o.tag));
            allTags.add('DIRECT');
            allTags.add('REJECT');

            for (const group of result.outbounds.filter(o => o.type === 'urltest')) {
                for (const ref of (group.outbounds || [])) {
                    expect(allTags.has(ref) || ref.startsWith('🇺') || ref.startsWith('🇭') || ref.startsWith('🇯') || ref.startsWith('🇸') || ref.startsWith('🇬') || ref.startsWith('🇰') || ref.startsWith('🇧') || ref.startsWith('🇫') || ref.startsWith('🇷') || ref.startsWith('🇨') || ref.startsWith('🇦') || ref.startsWith('🇮') || ref.startsWith('🇳') || ref.startsWith('🇿') || ref.startsWith('🇹') || ref.startsWith('🇪') || ref.startsWith('🇲') || ref.startsWith('🇵') || ref.startsWith('🇹') || ref.startsWith('🇻') || ref.startsWith('🇩') || ref.startsWith('🇮') || ref.startsWith('🇳')).toBe(true);
                }
            }
        });
    });

    describe('Route section', () => {
        it('should have route.rules with correct action types', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            expect(Array.isArray(result.route.rules)).toBe(true);
            expect(result.route.rules.length).toBeGreaterThan(0);

            const validActions = ['route', 'reject', 'hijack-dns', 'sniff', 'bypass', 'route-options', 'resolve'];
            for (const rule of result.route.rules) {
                if (rule.action) {
                    expect(validActions).toContain(rule.action);
                }
            }
        });

        it('should have hijack-dns as first rule with dns-in inbound', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            expect(result.route.rules[0]).toMatchObject({
                inbound: 'dns-in',
                action: 'hijack-dns'
            });
        });

        it('should have sniff action in route rules', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            const sniffRule = result.route.rules.find(r => r.action === 'sniff');
            expect(sniffRule).toBeDefined();
        });

        it('should have clash_mode rules', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            const clashModeRules = result.route.rules.filter(r => r.clash_mode);
            expect(clashModeRules.length).toBe(2);
            expect(clashModeRules.find(r => r.clash_mode === 'direct')).toMatchObject({ outbound: 'DIRECT' });
            expect(clashModeRules.find(r => r.clash_mode === 'global')).toBeDefined();
        });

        it('should have default_domain_resolver and auto_detect_interface', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            expect(result.route).toHaveProperty('default_domain_resolver', 'dns_resolver');
            expect(result.route).toHaveProperty('auto_detect_interface', true);
            expect(result.route).toHaveProperty('final');
        });

        it('should have rule_set array with geosite entry', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            expect(Array.isArray(result.route.rule_set)).toBe(true);
            expect(result.route.rule_set.length).toBeGreaterThan(0);
            for (const rs of result.route.rule_set) {
                expect(rs).toHaveProperty('tag');
                expect(['local', 'remote']).toContain(rs.type);
                expect(rs).toHaveProperty('format', 'binary');
                if (rs.type === 'local') {
                    expect(rs).toHaveProperty('path');
                } else {
                    expect(rs).toHaveProperty('url');
                }
            }
        });
    });

    describe('Experimental section', () => {
        it('should have cache_file enabled', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            expect(result.experimental).toHaveProperty('cache_file');
            expect(result.experimental.cache_file).toMatchObject({
                enabled: true,
                store_fakeip: true
            });
        });

        it('should not have legacy cache_file inside clash_api', async () => {
            const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false);
            const result = await builder.build();

            if (result.experimental.clash_api) {
                expect(result.experimental.clash_api).not.toHaveProperty('cache_file');
                expect(result.experimental.clash_api).not.toHaveProperty('store_mode');
                expect(result.experimental.clash_api).not.toHaveProperty('store_selected');
                expect(result.experimental.clash_api).not.toHaveProperty('store_fakeip');
            }
        });
    });

    describe('End-to-end HTTP endpoint', () => {
        it('GET /singbox with real subscription should return valid sing-box config via HTTP', async () => {
            const app = createApp({ kv: new MemoryKVAdapter(), logger: console, config: { configTtlSeconds: 60, shortLinkTtlSeconds: null } });
            const res = await app.request(`http://localhost/singbox?config=${encodeURIComponent(REAL_SUBSCRIPTION)}`);

            expect(res.status).toBe(200);
            expect(res.headers.get('content-type')).toContain('application/json');

            const json = await res.json();
            expect(json).toHaveProperty('outbounds');
            expect(json).toHaveProperty('dns');
            expect(json).toHaveProperty('route');
            expect(json).toHaveProperty('inbounds');

            expect(json.outbounds.length).toBeGreaterThan(1);
            expect(getProxies(json).length).toBe(9);
        });

        it('GET /singbox with real subscription and v1.13 should produce correct DNS format', async () => {
            const app = createApp({ kv: new MemoryKVAdapter(), logger: console, config: { configTtlSeconds: 60, shortLinkTtlSeconds: null } });
            const res = await app.request(`http://localhost/singbox?config=${encodeURIComponent(REAL_SUBSCRIPTION)}&sb_version=1.13`);

            expect(res.status).toBe(200);
            const json = await res.json();

            expect(json.dns.servers[0]).toHaveProperty('type');
            expect(json.dns.servers[0]).not.toHaveProperty('address');
            expect(json.route).toHaveProperty('default_domain_resolver', 'dns_resolver');
            expect(json.route).toHaveProperty('auto_detect_interface', true);
        });
    });

    describe('Version detection', () => {
        it('sb_version=1.12 should produce same format as default', async () => {
            const app = createApp({ kv: new MemoryKVAdapter(), logger: console, config: { configTtlSeconds: 60, shortLinkTtlSeconds: null } });
            const [resDefault, res12] = await Promise.all([
                app.request(`http://localhost/singbox?config=${encodeURIComponent(REAL_SUBSCRIPTION)}`),
                app.request(`http://localhost/singbox?config=${encodeURIComponent(REAL_SUBSCRIPTION)}&sb_version=1.12`)
            ]);

            const jsonDefault = await resDefault.json();
            const json12 = await res12.json();

            expect(json12.dns.servers[0]).toHaveProperty('type');
            expect(json12.route).toHaveProperty('default_domain_resolver', 'dns_resolver');
        });

        it('sb_version=legacy should produce 1.11 format', async () => {
            const app = createApp({ kv: new MemoryKVAdapter(), logger: console, config: { configTtlSeconds: 60, shortLinkTtlSeconds: null } });
            const res = await app.request(`http://localhost/singbox?config=${encodeURIComponent(REAL_SUBSCRIPTION)}&sb_version=legacy`);

            expect(res.status).toBe(200);
            const json = await res.json();

            expect(json.dns.servers[0]).not.toHaveProperty('type');
            expect(json.dns.servers[0]).toHaveProperty('address');
            expect(json.route).not.toHaveProperty('default_domain_resolver');
        });

        it('UA with sing-box 1.14 should resolve to 1.13 config (same format)', async () => {
            const app = createApp({ kv: new MemoryKVAdapter(), logger: console, config: { configTtlSeconds: 60, shortLinkTtlSeconds: null } });
            const res = await app.request(`http://localhost/singbox?config=${encodeURIComponent(REAL_SUBSCRIPTION)}`, {
                headers: { 'User-Agent': 'sing-box 1.14.0' }
            });

            expect(res.status).toBe(200);
            const json = await res.json();

            expect(json.dns.servers[0]).toHaveProperty('type');
            expect(json.route).toHaveProperty('default_domain_resolver');
        });
    });

    describe('Selected rules integration', () => {
        it('should generate reject action for Ad Block instead of REJECT outbound', async () => {
            const builder = new SingboxConfigBuilder(
                REAL_SUBSCRIPTION, ['Ad Block'], [], null, 'zh-CN', null, false
            );
            const result = await builder.build();

            const rejectRule = result.route.rules.find(r => r.action === 'reject');
            expect(rejectRule).toBeDefined();
            expect(rejectRule).toHaveProperty('rule_set');

            const blockOutbound = result.outbounds.find(o => o.type === 'block');
            expect(blockOutbound).toBeUndefined();

            expect(result.outbounds.some(o => o.tag?.includes('广告拦截'))).toBe(false);
        });

        it('should generate proper rule_set entries when selectedRules are provided', async () => {
            const builder = new SingboxConfigBuilder(
                REAL_SUBSCRIPTION, ['balanced'], [], null, 'zh-CN', null, false
            );
            const result = await builder.build();

            expect(Array.isArray(result.route.rule_set)).toBe(true);
            expect(result.route.rule_set.length).toBeGreaterThan(0);

            for (const rs of result.route.rule_set) {
                expect(rs).toHaveProperty('tag');
                expect(['local', 'remote']).toContain(rs.type);
                expect(rs).toHaveProperty('format', 'binary');
                if (rs.type === 'local') {
                    expect(rs).toHaveProperty('path');
                } else {
                    expect(rs).toHaveProperty('url');
                    expect(rs.url).toMatch(/\.srs$/);
                }
            }
        });
    });
});
