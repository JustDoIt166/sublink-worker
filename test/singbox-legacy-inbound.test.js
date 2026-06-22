import { describe, it, expect } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { SING_BOX_CONFIG } from '../src/config/singboxConfig.js';

const sampleInput = JSON.stringify({
    outbounds: [
        {
            type: 'vless',
            tag: 'test-proxy',
            server: 'example.com',
            server_port: 443,
            uuid: '00000000-0000-0000-0000-000000000000',
            tls: { enabled: true, server_name: 'example.com' }
        }
    ]
});

const LEGACY_INBOUND_FIELDS = ['sniff', 'sniff_timeout', 'sniff_override_destination', 'domain_strategy', 'udp_disable_domain_unmapping'];

describe('sing-box 1.13+ compatibility: no legacy inbound fields', () => {
    it('SING_BOX_CONFIG inbounds should not contain legacy fields', () => {
        for (const inbound of SING_BOX_CONFIG.inbounds) {
            for (const field of LEGACY_INBOUND_FIELDS) {
                expect(inbound).not.toHaveProperty(field);
            }
        }
    });

    it('SING_BOX_CONFIG should use new DNS server format (type/server)', () => {
        expect(SING_BOX_CONFIG.dns.servers[0]).toHaveProperty('type');
        expect(SING_BOX_CONFIG.dns.servers[0]).toHaveProperty('server');
        expect(SING_BOX_CONFIG.dns.servers[0]).not.toHaveProperty('address');
        expect(SING_BOX_CONFIG.route).toHaveProperty('default_domain_resolver', 'dns_resolver');
    });

    it('SING_BOX_CONFIG should have complete template structure', () => {
        expect(SING_BOX_CONFIG).toHaveProperty('dns');
        expect(SING_BOX_CONFIG).toHaveProperty('ntp');
        expect(SING_BOX_CONFIG).toHaveProperty('inbounds');
        expect(SING_BOX_CONFIG).toHaveProperty('outbounds');
        expect(SING_BOX_CONFIG).toHaveProperty('route');
        expect(SING_BOX_CONFIG).toHaveProperty('experimental');
        expect(SING_BOX_CONFIG.inbounds.length).toBe(6);
        expect(SING_BOX_CONFIG.outbounds.length).toBe(1);
    });

    it('base config should not contain legacy special outbounds', () => {
        const outboundTypes = SING_BOX_CONFIG.outbounds.map(outbound => outbound.type);
        expect(outboundTypes).not.toContain('block');
        expect(outboundTypes).not.toContain('dns');
    });

    it('should hijack DNS by dns-in inbound without relying on sniffed protocol', async () => {
        expect(SING_BOX_CONFIG.inbounds.some(inbound => inbound.tag === 'dns-in')).toBe(true);

        const builder = new SingboxConfigBuilder(
            sampleInput, [], [], null, 'zh-CN', null, false
        );
        const result = await builder.build();

        expect(result.route.rules[0]).toEqual({ inbound: 'dns-in', action: 'hijack-dns' });
        expect(result.route.rules).not.toContainEqual({ protocol: 'dns', action: 'hijack-dns' });
    });

    it('built config should have sniff as route rule action, not on inbounds', async () => {
        const builder = new SingboxConfigBuilder(
            sampleInput, [], [], null, 'zh-CN', null, false
        );
        const result = await builder.build();

        for (const inbound of result.inbounds) {
            for (const field of LEGACY_INBOUND_FIELDS) {
                expect(inbound, `inbound "${inbound.tag}" should not have "${field}"`).not.toHaveProperty(field);
            }
        }

        const sniffRule = result.route.rules.find(r => r.action === 'sniff');
        expect(sniffRule).toBeDefined();
    });

    it('should not reintroduce legacy fields or special outbounds from custom base config', async () => {
        const customBaseConfig = {
            inbounds: [
                { type: 'mixed', tag: 'mixed-in', listen: '0.0.0.0', listen_port: 2080 },
                { type: 'tun', tag: 'tun-in', address: '172.19.0.1/30', auto_route: true, strict_route: true, stack: 'mixed', sniff: true }
            ],
            outbounds: [
                { type: 'block', tag: 'REJECT' },
                { type: 'direct', tag: 'DIRECT' }
            ],
            route: { rule_set: [], rules: [] }
        };

        const builder = new SingboxConfigBuilder(
            sampleInput, [], [], customBaseConfig, 'zh-CN', null, false
        );
        const result = await builder.build();

        const sniffRule = result.route.rules.find(r => r.action === 'sniff');
        expect(sniffRule).toBeDefined();

        const legacyOutbounds = result.outbounds.filter(outbound => ['block', 'dns'].includes(outbound.type));
        expect(legacyOutbounds).toEqual([]);
        expect(result.outbounds.flatMap(outbound => outbound.outbounds || [])).not.toContain('REJECT');
    });

    it('should emit reject action for ad blocking rules instead of REJECT outbound', async () => {
        const builder = new SingboxConfigBuilder(
            sampleInput, ['Ad Block'], [], null, 'zh-CN', null, false
        );
        const result = await builder.build();

        const rejectRule = result.route.rules.find(rule => rule.rule_set?.includes('category-ads-all'));
        expect(rejectRule).toMatchObject({ action: 'reject' });
        expect(rejectRule).not.toHaveProperty('outbound');
        expect(result.outbounds.some(outbound => outbound.tag === '🛑 广告拦截')).toBe(false);
    });

    it('built config should have correct DNS format', async () => {
        const builder = new SingboxConfigBuilder(
            sampleInput, [], [], null, 'zh-CN', null, false
        );
        const result = await builder.build();

        expect(result.dns.servers[0]).toHaveProperty('type');
        expect(result.dns.servers[0]).toHaveProperty('server');
        expect(result.dns.servers[0]).not.toHaveProperty('address');
        expect(result.route).toHaveProperty('default_domain_resolver', 'dns_resolver');
    });

    it('built config should have correct route structure', async () => {
        const builder = new SingboxConfigBuilder(
            sampleInput, [], [], null, 'zh-CN', null, false
        );
        const result = await builder.build();

        expect(result.route).toHaveProperty('auto_detect_interface', true);
        expect(result.route).toHaveProperty('final');
        expect(result.route.rules[0]).toMatchObject({ inbound: 'dns-in', action: 'hijack-dns' });
        expect(result.route.rules.some(r => r.action === 'sniff')).toBe(true);
    });

    it('built config should have ntp configured', async () => {
        const builder = new SingboxConfigBuilder(
            sampleInput, [], [], null, 'zh-CN', null, false
        );
        const result = await builder.build();

        expect(result.ntp).toMatchObject({ enabled: true, server: 'time.apple.com' });
    });

    it('built config should have experimental.cache_file', async () => {
        const builder = new SingboxConfigBuilder(
            sampleInput, [], [], null, 'zh-CN', null, false
        );
        const result = await builder.build();

        expect(result.experimental).toHaveProperty('cache_file');
        expect(result.experimental.cache_file).toMatchObject({ enabled: true, store_fakeip: true });
    });

    it('built config inbound should not contain legacy fields', async () => {
        const builder = new SingboxConfigBuilder(
            sampleInput, [], [], null, 'zh-CN', null, false
        );
        const result = await builder.build();

        for (const inbound of result.inbounds) {
            for (const field of LEGACY_INBOUND_FIELDS) {
                expect(inbound, `inbound "${inbound.tag}" should not have "${field}"`).not.toHaveProperty(field);
            }
        }
    });

    it('built config should have 6 inbounds with correct tags', async () => {
        const builder = new SingboxConfigBuilder(
            sampleInput, [], [], null, 'zh-CN', null, false
        );
        const result = await builder.build();

        const inboundTags = result.inbounds.map(i => i.tag).sort();
        expect(inboundTags).toEqual(['dns-in', 'http-in', 'redirect-in', 'socks-in', 'tproxy-in', 'tun-in']);
    });
});
