import { SingboxConfigBuilder } from './SingboxConfigBuilder.js';
import { generateHtml } from './htmlBuilder.js';
import { generateAdminHtml } from './adminHtmlBuilder.js';
import { ClashConfigBuilder } from './ClashConfigBuilder.js';
import { SurgeConfigBuilder } from './SurgeConfigBuilder.js';
import { encodeBase64, GenerateWebPath, tryDecodeSubscriptionLines } from './utils.js';
import { PREDEFINED_RULE_SETS, SING_BOX_CONFIG, CLASH_CONFIG, SURGE_CONFIG } from './config.js';
import { t, setLanguage } from './i18n/index.js';
import yaml from 'js-yaml';

const ADMIN_TOKEN = globalThis.ADMIN_TOKEN || globalThis.ADMIN_PASSWORD || '';
const ADMIN_USER = globalThis.ADMIN_USER || '';

const DEFAULT_CONFIG_TEMPLATES = {
  singbox: SING_BOX_CONFIG,
  clash: CLASH_CONFIG,
  surge: SURGE_CONFIG
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  try {
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang');
    setLanguage(lang || request.headers.get('accept-language')?.split(',')[0]);
    if (request.method === 'GET' && url.pathname === '/') {
      // Return the HTML form for GET requests
      return new Response(generateHtml('', '', '', '', url.origin), {
        headers: { 'Content-Type': 'text/html' }
      });
    } else if (url.pathname === '/admin') {
      return new Response(generateAdminHtml(DEFAULT_CONFIG_TEMPLATES, Boolean(ADMIN_TOKEN)), {
        headers: { 'Content-Type': 'text/html' }
      });
    } else if (url.pathname === '/admin/templates') {
      return handleAdminTemplates(request, url);
    } else if (url.pathname === '/config') {
      return handleConfigRequest(request, url);
    } else if (url.pathname.startsWith('/singbox') || url.pathname.startsWith('/clash') || url.pathname.startsWith('/surge')) {
      const inputString = url.searchParams.get('config');
      if (!inputString) {
        return new Response(t('missingConfig'), { status: 400 });
      }

      const configType = getConfigTypeFromPath(url.pathname);
      let selectedRules = url.searchParams.get('selectedRules');
      let customRules = url.searchParams.get('customRules');
      const groupByCountry = url.searchParams.get('group_by_country') === 'true';
      const enableClashUI = url.searchParams.get('enable_clash_ui') === 'true';
      const externalController = url.searchParams.get('external_controller');
      const externalUiDownloadUrl = url.searchParams.get('external_ui_download_url');
      const configId = url.searchParams.get('configId');
      const configName = url.searchParams.get('configName');
      const selectedLang = url.searchParams.get('lang') || 'zh-CN';
      const userAgent = url.searchParams.get('ua') || 'curl/7.74.0';

      if (!selectedRules) {
        selectedRules = PREDEFINED_RULE_SETS.minimal;
      } else if (PREDEFINED_RULE_SETS[selectedRules]) {
        selectedRules = PREDEFINED_RULE_SETS[selectedRules];
      } else {
        try {
          selectedRules = JSON.parse(decodeURIComponent(selectedRules));
        } catch (error) {
          console.error('Error parsing selectedRules:', error);
          selectedRules = PREDEFINED_RULE_SETS.minimal;
        }
      }

      // Deal with custom rules
      try {
        customRules = customRules ? JSON.parse(decodeURIComponent(customRules)) : [];
      } catch (error) {
        console.error('Error parsing customRules:', error);
        customRules = [];
      }

      let baseConfig;
      if (configId || configName) {
        try {
          const storedConfig = await loadConfigTemplate({ id: configId, name: configName, type: configType });
          if (storedConfig?.content) {
            baseConfig = storedConfig.content;
          }
        } catch (error) {
          return new Response(error.message, { status: 400 });
        }
      }

      let configBuilder;
      if (configType === 'singbox') {
        configBuilder = new SingboxConfigBuilder(inputString, selectedRules, customRules, baseConfig, selectedLang, userAgent, groupByCountry, enableClashUI, externalController, externalUiDownloadUrl);
      } else if (configType === 'clash') {
        configBuilder = new ClashConfigBuilder(inputString, selectedRules, customRules, baseConfig, selectedLang, userAgent, groupByCountry, enableClashUI, externalController, externalUiDownloadUrl);
      } else {
        configBuilder = new SurgeConfigBuilder(inputString, selectedRules, customRules, baseConfig, selectedLang, userAgent, groupByCountry)
          .setSubscriptionUrl(url.href);
      }

      const config = await configBuilder.build();

      // 设置正确的 Content-Type 和其他响应头
      const headers = {
        'content-type': configType === 'singbox'
          ? 'application/json; charset=utf-8'
          : configType === 'clash'
            ? 'text/yaml; charset=utf-8'
            : 'text/plain; charset=utf-8'
      };

      // 如果是 Surge 配置，添加 subscription-userinfo 头
      if (configType === 'surge') {
        headers['subscription-userinfo'] = 'upload=0; download=0; total=10737418240; expire=2546249531';
      }

      return new Response(
        configType === 'singbox' ? JSON.stringify(config, null, 2) : config,
        { headers }
      );

    } else if (url.pathname === '/shorten') {
      const originalUrl = url.searchParams.get('url');
      if (!originalUrl) {
        return new Response(t('missingUrl'), { status: 400 });
      }

      const shortCode = GenerateWebPath();
      await SUBLINK_KV.put(shortCode, originalUrl);

      const shortUrl = `${url.origin}/s/${shortCode}`;
      return new Response(JSON.stringify({ shortUrl }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (url.pathname === '/shorten-v2') {
      const originalUrl = url.searchParams.get('url');
      let shortCode = url.searchParams.get('shortCode');

      if (!originalUrl) {
        return new Response('Missing URL parameter', { status: 400 });
      }

      // Create a URL object to correctly parse the original URL
      const parsedUrl = new URL(originalUrl);
      const queryString = parsedUrl.search;

      if (!shortCode) {
        shortCode = GenerateWebPath();
      }

      await SUBLINK_KV.put(shortCode, queryString);

      return new Response(shortCode, {
        headers: { 'Content-Type': 'text/plain' }
      });

    } else if (url.pathname.startsWith('/b/') || url.pathname.startsWith('/c/') || url.pathname.startsWith('/x/') || url.pathname.startsWith('/s/')) {
      const shortCode = url.pathname.split('/')[2];
      const originalParam = await SUBLINK_KV.get(shortCode);
      let originalUrl;

      if (url.pathname.startsWith('/b/')) {
        originalUrl = `${url.origin}/singbox${originalParam}`;
      } else if (url.pathname.startsWith('/c/')) {
        originalUrl = `${url.origin}/clash${originalParam}`;
      } else if (url.pathname.startsWith('/x/')) {
        originalUrl = `${url.origin}/xray${originalParam}`;
      } else if (url.pathname.startsWith('/s/')) {
        originalUrl = `${url.origin}/surge${originalParam}`;
      }

      if (originalUrl === null) {
        return new Response(t('shortUrlNotFound'), { status: 404 });
      }

      return Response.redirect(originalUrl, 302);
    } else if (url.pathname.startsWith('/xray')) {
      // Handle Xray config requests
      const inputString = url.searchParams.get('config');
      if (!inputString) {
        return new Response('Missing config parameter', { status: 400 });
      }

      const proxylist = inputString.split('\n');
      const finalProxyList = [];
      // Use custom UserAgent (for Xray) Hmmm...
      let userAgent = url.searchParams.get('ua');
      if (!userAgent) {
        userAgent = 'curl/7.74.0';
      }
      const headers = new Headers({
        'User-Agent': userAgent
      });

      for (const proxy of proxylist) {
        const trimmedProxy = proxy.trim();
        if (!trimmedProxy) {
          continue;
        }

        if (trimmedProxy.startsWith('http://') || trimmedProxy.startsWith('https://')) {
          try {
            const response = await fetch(trimmedProxy, {
              method: 'GET',
              headers
            });
            const text = await response.text();
            let processed = tryDecodeSubscriptionLines(text, { decodeUriComponent: true });
            if (!Array.isArray(processed)) {
              processed = [processed];
            }
            finalProxyList.push(...processed.filter(item => typeof item === 'string' && item.trim() !== ''));
          } catch (e) {
            console.warn('Failed to fetch the proxy:', e);
          }
        } else {
          let processed = tryDecodeSubscriptionLines(trimmedProxy);
          if (!Array.isArray(processed)) {
            processed = [processed];
          }
          finalProxyList.push(...processed.filter(item => typeof item === 'string' && item.trim() !== ''));
        }
      }

      const finalString = finalProxyList.join('\n');

      if (!finalString) {
        return new Response('Missing config parameter', { status: 400 });
      }

      return new Response(encodeBase64(finalString), {
        headers: { 'content-type': 'application/json; charset=utf-8' }
      });
    } else if (url.pathname === '/favicon.ico') {
      return Response.redirect('https://cravatar.cn/avatar/9240d78bbea4cf05fb04f2b86f22b18d?s=160&d=retro&r=g', 301)
    } else if (url.pathname === '/resolve') {
      const shortUrl = url.searchParams.get('url');
      if (!shortUrl) {
        return new Response(t('missingUrl'), { status: 400 });
      }

      try {
        const urlObj = new URL(shortUrl);
        const pathParts = urlObj.pathname.split('/');
        
        if (pathParts.length < 3) {
          return new Response(t('invalidShortUrl'), { status: 400 });
        }

        const prefix = pathParts[1]; // b, c, x, s
        const shortCode = pathParts[2];

        if (!['b', 'c', 'x', 's'].includes(prefix)) {
          return new Response(t('invalidShortUrl'), { status: 400 });
        }

        const originalParam = await SUBLINK_KV.get(shortCode);
        if (originalParam === null) {
          return new Response(t('shortUrlNotFound'), { status: 404 });
        }

        let originalUrl;
        if (prefix === 'b') {
          originalUrl = `${url.origin}/singbox${originalParam}`;
        } else if (prefix === 'c') {
          originalUrl = `${url.origin}/clash${originalParam}`;
        } else if (prefix === 'x') {
          originalUrl = `${url.origin}/xray${originalParam}`;
        } else if (prefix === 's') {
          originalUrl = `${url.origin}/surge${originalParam}`;
        }

        return new Response(JSON.stringify({ originalUrl }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(t('invalidShortUrl'), { status: 400 });
      }
    }

    return new Response(t('notFound'), { status: 404 });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(t('internalError'), { status: 500 });
  }
}

function acceptsJson(request) {
  const accept = request.headers.get('accept') || '';
  return accept.includes('application/json');
}

function unauthorizedResponse() {
  const status = ADMIN_TOKEN ? 401 : 501;
  const message = ADMIN_TOKEN ? 'Unauthorized' : 'Admin token is not configured';
  return new Response(message, {
    status,
    headers: { 'WWW-Authenticate': 'Bearer' }
  });
}

function isAdminAuthorized(request) {
  if (!ADMIN_TOKEN) {
    return false;
  }

  const authorization = request.headers.get('authorization') || '';

  if (authorization.startsWith('Bearer ')) {
    return authorization.slice(7) === ADMIN_TOKEN;
  }

  if (authorization.startsWith('Basic ')) {
    try {
      const decoded = atob(authorization.slice(6));
      const [user, pass] = decoded.split(':');
      const userMatches = !ADMIN_USER || user === ADMIN_USER;
      return userMatches && pass === ADMIN_TOKEN;
    } catch (error) {
      console.warn('Failed to parse basic auth header', error);
      return false;
    }
  }

  return false;
}

function getConfigTypeFromPath(pathname) {
  if (pathname.startsWith('/clash')) {
    return 'clash';
  }
  if (pathname.startsWith('/surge')) {
    return 'surge';
  }
  return 'singbox';
}

function sanitizeTemplateName(name) {
  if (!name) {
    throw new Error('Template name is required');
  }
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 64) {
    throw new Error('Template name must be 1-64 characters');
  }
  if (!/^[A-Za-z0-9._-]+$/.test(trimmed)) {
    throw new Error('Template name supports letters, numbers, dot, underscore and hyphen only');
  }
  return trimmed;
}

function buildConfigKey(type, name) {
  if (name) {
    return `config:${type}:${name}`;
  }
  return `${type}_${GenerateWebPath(8)}`;
}

function formatConfigContent(content) {
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch (_) {
      return content;
    }
  }

  try {
    return JSON.stringify(content, null, 2);
  } catch (error) {
    console.warn('Failed to stringify config content', error);
    return String(content);
  }
}

function normalizeConfigContent(type, content) {
  if (!type) {
    throw new Error('Missing config type');
  }

  if (content === undefined || content === null || (typeof content === 'string' && !content.trim())) {
    throw new Error('Missing config content');
  }

  let configString;

  if (type === 'clash') {
    if (typeof content === 'string') {
      const trimmed = content.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        configString = trimmed;
      } else {
        const yamlConfig = yaml.load(trimmed);
        configString = JSON.stringify(yamlConfig);
      }
    } else {
      configString = JSON.stringify(content);
    }
  } else {
    configString = typeof content === 'string' ? content : JSON.stringify(content);
  }

  JSON.parse(configString);

  return configString;
}

function normalizeStoredContent(content, type) {
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch (_) {
      if (type === 'clash') {
        try {
          return yaml.load(content);
        } catch (_) {
          return content;
        }
      }
      return content;
    }
  }
  return content;
}

function inferTypeFromKey(key) {
  if (!key) {
    return null;
  }
  if (key.startsWith('config:')) {
    const [, type] = key.split(':');
    return type || null;
  }
  if (key.includes('_')) {
    return key.split('_')[0];
  }
  return null;
}

function extractNameFromKey(key) {
  if (!key || !key.startsWith('config:')) {
    return null;
  }
  const parts = key.split(':');
  return parts.slice(2).join(':') || null;
}

async function findConfigKeyByName(name) {
  const { keys } = await SUBLINK_KV.list({ prefix: 'config:' });
  const matched = keys.find(key => key.name.endsWith(`:${name}`));
  return matched?.name || null;
}

function parseStoredConfig(raw, key, fallbackType) {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const content = parsed.content ?? parsed;
    const resolvedType = parsed.type || inferTypeFromKey(key) || fallbackType;

    return {
      id: key,
      name: parsed.name || extractNameFromKey(key),
      type: resolvedType,
      updatedAt: parsed.updatedAt || null,
      content: normalizeStoredContent(content, resolvedType)
    };
  } catch (error) {
    console.warn('Failed to parse stored config', error);
    return null;
  }
}

async function loadConfigTemplate({ id, name, type }) {
  let key = id;
  let stored;

  if (key) {
    stored = await SUBLINK_KV.get(key);
  }

  if (!stored && name) {
    const sanitized = sanitizeTemplateName(name);
    key = buildConfigKey(type || 'singbox', sanitized);
    stored = await SUBLINK_KV.get(key);

    if (!stored && !type) {
      const fallbackKey = await findConfigKeyByName(sanitized);
      if (fallbackKey) {
        key = fallbackKey;
        stored = await SUBLINK_KV.get(fallbackKey);
      }
    }
  }

  if (!stored) {
    return null;
  }

  return parseStoredConfig(stored, key, type);
}

async function listConfigTemplates() {
  const { keys } = await SUBLINK_KV.list({ prefix: 'config:' });
  const results = [];

  for (const key of keys) {
    const raw = await SUBLINK_KV.get(key.name);
    const parsed = parseStoredConfig(raw, key.name);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

async function handleConfigRequest(request, url) {
  if (request.method === 'GET') {
    try {
      const record = await loadConfigTemplate({
        id: url.searchParams.get('id'),
        name: url.searchParams.get('name'),
        type: url.searchParams.get('type')
      });

      if (!record) {
        return new Response(t('notFound'), { status: 404 });
      }

      return new Response(JSON.stringify({
        id: record.id,
        name: record.name,
        type: record.type || url.searchParams.get('type'),
        updatedAt: record.updatedAt,
        content: formatConfigContent(record.content)
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(error.message, { status: 400 });
    }
  }

  if (request.method === 'POST') {
    try {
      const { type, content, name } = await request.json();
      const sanitizedName = name ? sanitizeTemplateName(name) : null;
      const normalizedContent = normalizeConfigContent(type, content);
      const configId = buildConfigKey(type, sanitizedName);
      const updatedAt = new Date().toISOString();

      await SUBLINK_KV.put(configId, JSON.stringify({
        type,
        name: sanitizedName,
        content: normalizedContent,
        updatedAt
      }));

      const responseBody = { id: configId, name: sanitizedName, type };

      if (acceptsJson(request)) {
        return new Response(JSON.stringify(responseBody), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(configId, {
        headers: { 'Content-Type': 'text/plain' }
      });
    } catch (error) {
      return new Response(t('invalidFormat') + error.message, {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
}

async function handleAdminTemplates(request, url) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedResponse();
  }

  if (request.method === 'GET') {
    const name = url.searchParams.get('name');
    const type = url.searchParams.get('type');

    if (name) {
      try {
        const record = await loadConfigTemplate({ name, type });
        if (!record) {
          return new Response(t('notFound'), { status: 404 });
        }

        return new Response(JSON.stringify({
          ...record,
          content: formatConfigContent(record.content)
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(error.message, { status: 400 });
      }
    }

    const templates = await listConfigTemplates();
    const payload = templates.map(template => ({
      id: template.id,
      name: template.name,
      type: template.type,
      updatedAt: template.updatedAt
    }));

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const type = body.type || 'singbox';
      const name = sanitizeTemplateName(body.name);
      const normalizedContent = normalizeConfigContent(type, body.content ?? DEFAULT_CONFIG_TEMPLATES[type]);
      const updatedAt = new Date().toISOString();
      const key = buildConfigKey(type, name);

      await SUBLINK_KV.put(key, JSON.stringify({
        type,
        name,
        content: normalizedContent,
        updatedAt
      }));

      return new Response(JSON.stringify({ id: key, name, type, updatedAt }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(error.message, { status: 400 });
    }
  }

  if (request.method === 'DELETE') {
    const name = url.searchParams.get('name');
    const type = url.searchParams.get('type');

    if (!name || !type) {
      return new Response('Missing name or type', { status: 400 });
    }

    try {
      const sanitized = sanitizeTemplateName(name);
      const key = buildConfigKey(type, sanitized);
      await SUBLINK_KV.delete(key);
      return new Response('', { status: 204 });
    } catch (error) {
      return new Response(error.message, { status: 400 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
}
