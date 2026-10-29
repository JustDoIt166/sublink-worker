import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { createTransportConfig } from '../src/utils.js';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { SurgeConfigBuilder } from '../src/builders/SurgeConfigBuilder.js';
import { parseClashYaml } from '../src/parsers/subscription/subscriptionContentParser.js';

/**
 * xhttp is Xray's splithttp transport, not the legacy "HTTP obfuscation" that
 * `network: http` means in Clash and sing-box. Mapping it to `http` dropped
 * path/host/mode and produced a node that could never connect, which is why
 * every `-xhttp` node in a converted subscription failed in mihomo.
 */
const XHTTP_LINK =
    'vless://11111111-1111-1111-1111-111111111111@edge.example.com:443' +
    '?encryption=none&security=tls&sni=edge.example.com&fp=chrome' +
    '&type=xhttp&host=edge.example.com&path=%2Fuuid%2Fxhttp&mode=stream-one#xhttp-node';

const XHTTP_LINK_WITH_QUERY =
    'vless://11111111-1111-1111-1111-111111111111@edge.example.com:443' +
    '?encryption=none&security=tls&sni=edge.example.com&fp=chrome' +
    '&type=xhttp&host=edge.example.com&path=%2Fuuid%2Fxhttp%3Fwk%3DJP&mode=stream-one#xhttp-wk';

describe('createTransportConfig: xhttp', () => {
    it('keeps xhttp as its own transport instead of folding it into http', () => {
        const transport = createTransportConfig({
            type: 'xhttp',
            path: '/uuid/xhttp',
            host: 'edge.example.com',
            mode: 'stream-one'
        });

        expect(transport).toEqual({
            type: 'xhttp',
            path: '/uuid/xhttp',
            host: 'edge.example.com',
            mode: 'stream-one'
        });
    });

    it('defaults a missing mode to auto (Xray own default)', () => {
        expect(createTransportConfig({ type: 'xhttp', path: '/x' }).mode).toBe('auto');
    });

    it('drops modes mihomo does not implement instead of emitting garbage', () => {
        expect(createTransportConfig({ type: 'xhttp', path: '/x', mode: 'nope' }).mode).toBe('auto');
    });

    it('leaves the legacy http obfuscation transport untouched', () => {
        expect(createTransportConfig({ type: 'http', path: '/', host: 'h' })).toEqual({
            type: 'http',
            path: '/',
            host: ['h'],
            method: 'PUT'
        });
    });
});

describe('Clash output: xhttp', () => {
    const build = async (input) =>
        yaml.load(await new ClashConfigBuilder(input, 'minimal', [], null, 'zh-CN', 'clash-verge').build());

    it('emits network: xhttp with xhttp-opts carrying path/host/mode', async () => {
        const config = await build(XHTTP_LINK);
        const proxy = config.proxies.find(p => p.name === 'xhttp-node');

        expect(proxy.network).toBe('xhttp');
        expect(proxy['xhttp-opts']).toEqual({
            path: '/uuid/xhttp',
            mode: 'stream-one',
            host: 'edge.example.com'
        });
        expect(proxy['http-opts']).toBeUndefined();
    });

    it('keeps a query suffix in the path verbatim', async () => {
        const config = await build(XHTTP_LINK_WITH_QUERY);
        const proxy = config.proxies.find(p => p.name === 'xhttp-wk');

        expect(proxy['xhttp-opts'].path).toBe('/uuid/xhttp?wk=JP');
    });
});

describe('sing-box output: xhttp', () => {
    it('drops the node, because sing-box has no xhttp transport', async () => {
        const result = await new SingboxConfigBuilder(XHTTP_LINK, 'minimal', [], null, 'zh-CN', 'sing-box').build();

        expect(result.outbounds.some(o => o.tag === 'xhttp-node')).toBe(false);
        expect(result.outbounds.filter(o => o.server != null)).toHaveLength(0);
    });
});

describe('Surge output: xhttp', () => {
    // Surge has no VLESS support at all, so the interesting case is a protocol it
    // does support (trojan) carrying a transport it does not.
    const TROJAN_XHTTP_LINK =
        'trojan://secret@edge.example.com:443' +
        '?security=tls&sni=edge.example.com&type=xhttp&host=edge.example.com' +
        '&path=%2Fuuid%2Fxhttp&mode=stream-one#trojan-xhttp-node';

    it('comments the node out instead of emitting an unsupported proxy line', async () => {
        const text = await new SurgeConfigBuilder(TROJAN_XHTTP_LINK, 'minimal', [], null, 'zh-CN', 'surge').build();
        const proxySection = text.split('[Proxy Group]')[0];

        expect(proxySection).toContain('# trojan-xhttp-node - Unsupported transport for trojan: xhttp');
        expect(proxySection).not.toContain('trojan-xhttp-node = trojan');
    });
});

describe('Clash input: xhttp', () => {
    // A converted subscription can be fed back in as Clash YAML; without the
    // parser branch the transport fell back to `tcp` and the node quietly broke.
    const CLASH_XHTTP_INPUT = `proxies:
  - name: hk-xhttp
    type: vless
    server: edge.example.com
    port: 443
    uuid: 11111111-1111-1111-1111-111111111111
    tls: true
    servername: edge.example.com
    network: xhttp
    xhttp-opts:
      path: /uuid/xhttp?wk=HK
      mode: stream-one
      host: edge.example.com
`;

    it('round-trips network/xhttp-opts back into an xhttp transport', () => {
        const result = parseClashYaml(CLASH_XHTTP_INPUT);
        const proxy = result.proxies[0];

        expect(proxy.network).toBe('xhttp');
        expect(proxy.transport).toEqual({
            type: 'xhttp',
            path: '/uuid/xhttp?wk=HK',
            host: 'edge.example.com',
            mode: 'stream-one'
        });
    });

    it('keeps the node working after a Clash -> Clash conversion', async () => {
        const config = yaml.load(
            await new ClashConfigBuilder(CLASH_XHTTP_INPUT, 'minimal', [], null, 'zh-CN', 'clash-verge').build()
        );
        const proxy = config.proxies.find(p => p.name === 'hk-xhttp');

        expect(proxy.network).toBe('xhttp');
        expect(proxy['xhttp-opts']).toEqual({
            path: '/uuid/xhttp?wk=HK',
            mode: 'stream-one',
            host: 'edge.example.com'
        });
    });
});
