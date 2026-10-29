import { describe, it, expect } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { SING_BOX_CONFIG } from '../src/config/index.js';

/**
 * Issue #432: DNS must not fall back to a direct resolver for proxied domains,
 * and node bootstrap must never recurse through the proxy DNS that depends on
 * the node itself. The DNS rules also reference rule sets that have to exist
 * in route.rule_set regardless of the user's routing-rule selection.
 */
describe('sing-box DNS rules', () => {
    const vlessUrl = 'vless://12345678-1234-1234-1234-123456789abc@example.com:443?security=tls&sni=example.com#TestVless';

    const build = async (baseConfig = null) => {
        const builder = new SingboxConfigBuilder(vlessUrl, [], [], baseConfig, 'zh-CN', null, false, false, undefined, undefined, true);
        return builder.build();
    };

    it('routes direct mode and CN domains to the direct resolver', async () => {
        const result = await build();
        const rules = result.dns.rules;
        expect(rules).toContainEqual(expect.objectContaining({ clash_mode: 'direct', server: 'dns_direct' }));
        expect(rules).toContainEqual(expect.objectContaining({
            rule_set: ['geolocation-cn', 'cn'],
            server: 'dns_direct'
        }));
    });

    it('keeps the proxied DNS rule free of a rule_set filter', async () => {
        const result = await build();
        const proxied = result.dns.rules.find(rule => rule.server === 'dns_proxy');
        expect(proxied).toBeDefined();
        // A proxied domain that is unclassified must still resolve via the proxy.
        expect(proxied).not.toHaveProperty('rule_set');
        expect(proxied.query_type).toEqual(['A', 'AAAA', 'CNAME']);
    });

    it('declares every rule set the DNS rules reference', async () => {
        const result = await build();
        const tags = new Set(result.route.rule_set.map(rs => rs.tag));
        ['geolocation-cn', 'cn', 'geolocation-!cn'].forEach(tag => expect(tags.has(tag)).toBe(true));
    });

    it('restores the bootstrap resolver after a route override drops it', async () => {
        const baseConfig = {
            ...SING_BOX_CONFIG,
            route: { rule_set: [], rules: [] }
        };
        const result = await build(baseConfig);
        expect(result.route.default_domain_resolver).toBe('dns_resolver');
    });

    it('keeps an explicit bootstrap resolver from the subscription', async () => {
        const baseConfig = {
            ...SING_BOX_CONFIG,
            dns: {
                ...SING_BOX_CONFIG.dns,
                servers: [
                    ...SING_BOX_CONFIG.dns.servers,
                    { type: 'udp', tag: 'my_bootstrap', server: '9.9.9.9' }
                ]
            },
            route: { ...SING_BOX_CONFIG.route, default_domain_resolver: 'my_bootstrap', rule_set: [], rules: [] }
        };
        const result = await build(baseConfig);
        expect(result.route.default_domain_resolver).toBe('my_bootstrap');
    });

    it('does not pick a proxied resolver as bootstrap', async () => {
        const baseConfig = {
            ...SING_BOX_CONFIG,
            dns: {
                servers: SING_BOX_CONFIG.dns.servers.map(server =>
                    server.tag === 'dns_resolver' ? { ...server, detour: '🚀 节点选择' } : server
                )
            },
            route: { rule_set: [], rules: [] }
        };
        const result = await build(baseConfig);
        expect(result.route).not.toHaveProperty('default_domain_resolver');
    });
});