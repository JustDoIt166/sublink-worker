import { describe, it, expect, beforeAll } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { execSync } from 'child_process';
import { writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const SING_BOX_BIN = 'C:\\Users\\hellotime\\Downloads\\sing-box-1.13.13-windows-amd64\\sing-box-1.13.13-windows-amd64\\sing-box.exe';

const REAL_SUBSCRIPTION = [
    'vless://351c9981-04b6-4103-aa4b-864aa9c91469@cf.hellotime.de5.net:443?encryption=none&security=tls&sni=cf.hellotime.de5.net&fp=chrome&type=ws&host=cf.hellotime.de5.net&path=%2F351c9981-04b6-4103-aa4b-864aa9c91469%2Fws&alpn=h3,h2,http/1.1&ech=cloudflare-ech.com%2Bhttps%3A%2F%2Fdns.joeyblog.eu.org%2Fjoeyblog#%E5%8E%9F%E7%94%9F%E5%9C%B0%E5%9D%80-ws',
    'vless://351c9981-04b6-4103-aa4b-864aa9c91469@104.29.111.45:443?encryption=none&security=tls&sni=cf.hellotime.de5.net&fp=chrome&type=ws&host=cf.hellotime.de5.net&path=%2F351c9981-04b6-4103-aa4b-864aa9c91469%2Fws&alpn=h3,h2,http/1.1&ech=cloudflare-ech.com%2Bhttps%3A%2F%2Fdns.joeyblog.eu.org%2Fjoeyblog#API%E4%BC%98%E9%80%89-104.29.111.45%3A443-ws',
    'vless://351c9981-04b6-4103-aa4b-864aa9c91469@[2606:4700:a8:b92c:8b:1910:1cee:12d2]:443?encryption=none&security=tls&sni=cf.hellotime.de5.net&fp=chrome&type=ws&host=cf.hellotime.de5.net&path=%2F351c9981-04b6-4103-aa4b-864aa9c91469%2Fws&alpn=h3,h2,http/1.1&ech=cloudflare-ech.com%2Bhttps%3A%2F%2Fdns.joeyblog.eu.org%2Fjoeyblog#API%E4%BC%98%E9%80%89-2606%3A4700%3Aa8%3Ab92c%3A8b%3A1910%3A1cee%3A12d2%3A443-ws',
    'trojan://6f8e0e5b-10c9-42a2-96f7-cb1b4e5f0a3d@cf.hellotime.de5.net:443?security=tls&sni=cf.hellotime.de5.net&fp=chrome&type=ws&host=cf.hellotime.de5.net&path=%2F6f8e0e5b-10c9-42a2-96f7-cb1b4e5f0a3d%2Fws&alpn=h3,h2,http/1.1#%E5%8E%9F%E7%94%9F%E5%9C%B0%E5%9D%80-ws',
    'trojan://6f8e0e5b-10c9-42a2-96f7-cb1b4e5f0a3d@104.29.111.45:443?security=tls&sni=cf.hellotime.de5.net&fp=chrome&type=ws&host=cf.hellotime.de5.net&path=%2F6f8e0e5b-10c9-42a2-96f7-cb1b4e5f0a3d%2Fws&alpn=h3,h2,http/1.1#API%E4%BC%98%E9%80%89-104.29.111.45%3A443-ws',
    'trojan://6f8e0e5b-10c9-42a2-96f7-cb1b4e5f0a3d@[2606:4700:a8:b92c:8b:1910:1cee:12d2]:443?security=tls&sni=cf.hellotime.de5.net&fp=chrome&type=ws&host=cf.hellotime.de5.net&path=%2F6f8e0e5b-10c9-42a2-96f7-cb1b4e5f0a3d%2Fws&alpn=h3,h2,http/1.1#API%E4%BC%98%E9%80%89-2606%3A4700%3Aa8%3Ab92c%3A8b%3A1910%3A1cee%3A12d2%3A443-ws',
    'vless://351c9981-04b6-4103-aa4b-864aa9c91469@cf.hellotime.de5.net:443?encryption=none&security=tls&sni=cf.hellotime.de5.net&fp=chrome&type=xhttp&host=cf.hellotime.de5.net&path=%2F351c9981-04b6-4103-aa4b-864aa9c91469%2Fxhttp&mode=stream-one&alpn=h3,h2,http/1.1&ech=cloudflare-ech.com%2Bhttps%3A%2F%2Fdns.joeyblog.eu.org%2Fjoeyblog#%E5%8E%9F%E7%94%9F%E5%9C%B0%E5%9D%80-xhttp',
    'vless://351c9981-04b6-4103-aa4b-864aa9c91469@104.29.111.45:443?encryption=none&security=tls&sni=cf.hellotime.de5.net&fp=chrome&type=xhttp&host=cf.hellotime.de5.net&path=%2F351c9981-04b6-4103-aa4b-864aa9c91469%2Fxhttp&mode=stream-one&alpn=h3,h2,http/1.1&ech=cloudflare-ech.com%2Bhttps%3A%2F%2Fdns.joeyblog.eu.org%2Fjoeyblog#API%E4%BC%98%E9%80%89-104.29.111.45%3A443-xhttp',
    'vless://351c9981-04b6-4103-aa4b-864aa9c91469@[2606:4700:a8:b92c:8b:1910:1cee:12d2]:443?encryption=none&security=tls&sni=cf.hellotime.de5.net&fp=chrome&type=xhttp&host=cf.hellotime.de5.net&path=%2F351c9981-04b6-4103-aa4b-864aa9c91469%2Fxhttp&mode=stream-one&alpn=h3,h2,http/1.1&ech=cloudflare-ech.com%2Bhttps%3A%2F%2Fdns.joeyblog.eu.org%2Fjoeyblog#API%E4%BC%98%E9%80%89-2606%3A4700%3Aa8%3Ab92c%3A8b%3A1910%3A1cee%3A12d2%3A443-xhttp',
].join('\n');

function singBoxCheck(config) {
    const tmpDir = mkdtempSync(join(tmpdir(), 'singbox-test-'));
    const configPath = join(tmpDir, 'config.json');
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    try {
        const output = execSync(`"${SING_BOX_BIN}" check -c "${configPath}"`, {
            encoding: 'utf-8',
            timeout: 15000,
            cwd: tmpDir,
        });
        return { ok: true, stdout: output.trim() };
    } catch (e) {
        return { ok: false, stderr: e.stderr?.trim() || e.message };
    } finally {
        try { execSync(`rmdir /s /q "${tmpDir}"`, { stdio: 'ignore' }); } catch {}
    }
}

describe('sing-box real kernel validation', () => {
    let config;

    beforeAll(async () => {
        const builder = new SingboxConfigBuilder(REAL_SUBSCRIPTION, [], [], null, 'zh-CN', null, false, false);
        config = await builder.build();
    });

    it('should pass sing-box check', () => {
        const result = singBoxCheck(config);
        if (!result.ok) {
            console.error('Config validation failed:', result.stderr);
        }
        expect(result.ok).toBe(true);
    });

    it('every proxy outbound should have valid sing-box recognized fields', () => {
        const proxyOutbounds = config.outbounds.filter(o => o.server);
        for (const p of proxyOutbounds) {
            // Check no unrecognized fields
            const singBoxTopFields = ['type', 'tag', 'server', 'server_port', 'tcp_fast_open', 'tls', 'transport', 'flow', 'uuid', 'password', 'packet_encoding'];
            for (const key of Object.keys(p)) {
                expect(singBoxTopFields, `Unrecognized field "${key}" on ${p.tag}`).toContain(key);
            }
        }
    });

    it('no proxy outbound should carry unrecognized transport fields', () => {
        const proxyOutbounds = config.outbounds.filter(o => o.server);
        for (const p of proxyOutbounds) {
            if (p.transport) {
                const singBoxTransportFields = ['type', 'path', 'host', 'headers', 'method', 'service_name', 'idle_timeout', 'ping_timeout', 'max_early_data', 'early_data_header_name', 'permit_without_stream'];
                for (const key of Object.keys(p.transport)) {
                    expect(singBoxTransportFields, `Unrecognized transport field "${key}" on ${p.tag}`).toContain(key);
                }
            }
        }
    });
});
