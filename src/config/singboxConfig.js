/**
 * Sing-box Configuration
 * Base configuration template for Sing-box client
 */

export const SING_BOX_CONFIG = JSON.parse(JSON.stringify({
	dns: {
		servers: [
			{
				type: "tcp",
				tag: "dns_proxy",
				server: "1.1.1.1",
				detour: "🚀 节点选择",
				domain_resolver: "dns_resolver"
			},
			{
				type: "https",
				tag: "dns_direct",
				server: "dns.alidns.com",
				domain_resolver: "dns_resolver"
			},
			{
				type: "udp",
				tag: "dns_resolver",
				server: "223.5.5.5"
			},
			{
				type: "fakeip",
				tag: "dns_fakeip",
				inet4_range: "198.18.0.0/15",
				inet6_range: "fc00::/18"
			}
		],
		rules: [
			{
				rule_set: "geolocation-!cn",
				query_type: [
					"A",
					"AAAA"
				],
				server: "dns_fakeip"
			},
			{
				rule_set: "geolocation-!cn",
				query_type: "CNAME",
				server: "dns_proxy"
			},
			{
				query_type: [
					"A",
					"AAAA",
					"CNAME",
					"HTTPS"
				],
				invert: true,
				action: "predefined",
				rcode: "REFUSED"
			}
		],
		final: "dns_direct"
	},
	ntp: {
		enabled: true,
		server: 'time.apple.com',
		server_port: 123,
		interval: '30m'
	},
	inbounds: [
		{ tag: 'dns-in', type: 'direct', listen: '::', listen_port: 1053 },
		{ tag: 'http-in', type: 'http', listen: '::', listen_port: 7080 },
		{ tag: 'socks-in', type: 'socks', listen: '::', listen_port: 1080 },
		{ tag: 'redirect-in', type: 'redirect', listen: '::', listen_port: 7890 },
		{ tag: 'tproxy-in', type: 'tproxy', listen: '::', listen_port: 7891 },
		{
			tag: 'tun-in',
			type: 'tun',
			interface_name: 'momo',
			address: [
				'172.31.0.1/30',
				'fdfe:dcba:9876::1/126'
			],
			auto_route: false,
			auto_redirect: false
		}
	],
	outbounds: [
		{ type: "direct", tag: 'DIRECT' }
	],
	route: {
		default_domain_resolver: "dns_resolver",
		"rule_set": [
			{
				"tag": "geosite-geolocation-!cn",
				"type": "local",
				"format": "binary",
				"path": "geosite-geolocation-!cn.srs"
			}
		],
		rules: []
	},
	experimental: {
		cache_file: {
			enabled: true,
			store_fakeip: true
		}
	}
}));
