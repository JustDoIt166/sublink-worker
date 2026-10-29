import { describe, it, expect } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';

/**
 * Issues #401/#408: remote rule-sets must not rely on sing-box's implicit
 * default HTTP client — fetching goes through the default route, which fails
 * at startup when the proxy is not up yet. download_detour: DIRECT works on
 * every tier this fork ships, so the pin is unconditional.
 */
describe('sing-box rule-set download detour', () => {
    const vlessUrl = 'vless://12345678-1234-1234-1234-123456789abc@example.com:443?security=tls&sni=example.com#TestVless';

    const build = async (baseConfig = null) => {
        const builder = new SingboxConfigBuilder(vlessUrl, [], [], baseConfig, 'zh-CN', null, false, false, undefined, undefined, true);
        return builder.build();
    };

    it('adds download_detour DIRECT to every remote rule-set', async () => {
        const result = await build();
        const remote = result.route.rule_set.filter(rs => rs.type === 'remote');
        expect(remote.length).toBeGreaterThan(0);
        remote.forEach(rs => {
            expect(rs.download_detour).toBe('DIRECT');
            expect(rs).not.toHaveProperty('http_client');
        });
    });

    it('leaves local rule-sets untouched', async () => {
        const result = await build();
        result.route.rule_set
            .filter(rs => rs.type === 'local')
            .forEach(rs => expect(rs).not.toHaveProperty('download_detour'));
    });

    it('keeps the modern http_clients shape out of the output', async () => {
        const result = await build();
        expect(result).not.toHaveProperty('http_clients');
        expect(result.route).not.toHaveProperty('default_http_client');
    });
});