export function generateAdminHtml(defaultTemplates = {}, tokenConfigured = false) {
  const templateStrings = {
    singbox: JSON.stringify(defaultTemplates.singbox ?? {}, null, 2),
    clash: JSON.stringify(defaultTemplates.clash ?? {}, null, 2),
    surge: JSON.stringify(defaultTemplates.surge ?? {}, null, 2)
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sublink Admin</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js"></script>
        <style>
          body { background: #0d1117; color: #c9d1d9; }
          .card { background: #161b22; border: 1px solid #30363d; }
          .form-control, .form-select { background: #0d1117; color: #c9d1d9; border-color: #30363d; }
          .form-control:focus, .form-select:focus { box-shadow: none; border-color: #58a6ff; }
          textarea { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
          .btn-outline-secondary { color: #c9d1d9; border-color: #30363d; }
          .btn-outline-secondary:hover { background: #21262d; color: #fff; }
          .table > :not(caption) > * > * { background-color: transparent; }
          .badge { font-weight: 500; }
          .status-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 6px; }
          .config-form { display: none; }
          .config-form.active { display: block; }
          .form-text { color: #8b949e; }
        </style>
      </head>
      <body>
        <div class="container py-4">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 class="h3 mb-1">Admin Configuration</h1>
              <p class="text-secondary mb-0">Manage and persist base configuration templates.</p>
            </div>
            <span class="badge ${tokenConfigured ? 'bg-success' : 'bg-warning text-dark'}">
              ${tokenConfigured ? 'Token configured' : 'Token missing'}
            </span>
          </div>

          <div class="alert alert-info" role="alert">
            Use your admin token to authenticate API calls. The token is stored locally in your browser.
          </div>

          <div id="messageContainer"></div>

          <div class="card mb-4">
            <div class="card-body">
              <div class="row g-3 mb-3">
                <div class="col-md-4">
                  <label class="form-label">Admin Token</label>
                  <input type="password" class="form-control" id="adminToken" placeholder="Bearer token">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Config Type</label>
                  <select class="form-select" id="templateType">
                    <option value="singbox">SingBox</option>
                    <option value="clash">Clash</option>
                    <option value="surge">Surge</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Template Name</label>
                  <input type="text" class="form-control" id="templateName" maxlength="64" placeholder="production-default">
                </div>
              </div>

              <div class="d-flex gap-2 mb-3">
                <button class="btn btn-outline-secondary" id="loadDefault"><i class="fa fa-rotate-left me-1"></i>Load default</button>
                <button class="btn btn-outline-secondary" id="clearEditor"><i class="fa fa-eraser me-1"></i>Clear</button>
                <button class="btn btn-primary ms-auto" id="saveTemplate"><i class="fa fa-save me-1"></i>Save template</button>
              </div>

              <div class="card bg-transparent border-secondary mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <span class="fw-semibold">Visual editor</span>
                  <span class="text-secondary small">Configure common options without hand-editing JSON/YAML</span>
                </div>
                <div class="card-body">
                  <div id="singboxForm" class="config-form" data-type="singbox">
                    <div class="row g-3">
                      <div class="col-md-6">
                        <label class="form-label">DNS Proxy Server</label>
                        <input type="text" class="form-control" data-field="dnsProxyServer" placeholder="1.1.1.1">
                        <div class="form-text">Used for international domain queries.</div>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">DNS Direct Server</label>
                        <input type="text" class="form-control" data-field="dnsDirectServer" placeholder="dns.alidns.com">
                        <div class="form-text">Used for mainland domain queries.</div>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">FakeIP IPv4 Range</label>
                        <input type="text" class="form-control" data-field="fakeIpRange" placeholder="198.18.0.0/15">
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">FakeIP IPv6 Range</label>
                        <input type="text" class="form-control" data-field="fakeIpv6Range" placeholder="fc00::/18">
                      </div>
                      <div class="col-md-4">
                        <label class="form-label">HTTP Port</label>
                        <input type="number" class="form-control" data-field="httpPort" min="1" max="65535">
                      </div>
                      <div class="col-md-4">
                        <label class="form-label">SOCKS Port</label>
                        <input type="number" class="form-control" data-field="socksPort" min="1" max="65535">
                      </div>
                      <div class="col-md-4">
                        <label class="form-label">Redirect Port</label>
                        <input type="number" class="form-control" data-field="redirectPort" min="1" max="65535">
                      </div>
                      <div class="col-md-4">
                        <label class="form-label">TProxy Port</label>
                        <input type="number" class="form-control" data-field="tproxyPort" min="1" max="65535">
                      </div>
                      <div class="col-md-4">
                        <label class="form-label">Tun Interface</label>
                        <input type="text" class="form-control" data-field="tunInterface" placeholder="momo">
                      </div>
                      <div class="col-md-4 d-flex align-items-end">
                        <div class="form-check">
                          <input class="form-check-input" type="checkbox" data-field="tunAutoRoute" id="tunAutoRoute">
                          <label class="form-check-label" for="tunAutoRoute">Enable auto route</label>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">NTP Server</label>
                        <input type="text" class="form-control" data-field="ntpServer" placeholder="time.apple.com">
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">NTP Interval</label>
                        <input type="text" class="form-control" data-field="ntpInterval" placeholder="30m">
                      </div>
                    </div>
                  </div>

                  <div id="clashForm" class="config-form" data-type="clash">
                    <div class="row g-3">
                      <div class="col-md-4">
                        <label class="form-label">HTTP Port</label>
                        <input type="number" class="form-control" data-field="port" min="1" max="65535">
                      </div>
                      <div class="col-md-4">
                        <label class="form-label">SOCKS Port</label>
                        <input type="number" class="form-control" data-field="socks-port" min="1" max="65535">
                      </div>
                      <div class="col-md-4 d-flex align-items-end">
                        <div class="form-check">
                          <input class="form-check-input" type="checkbox" data-field="allow-lan" id="clashAllowLan">
                          <label class="form-check-label" for="clashAllowLan">Allow LAN</label>
                        </div>
                      </div>
                      <div class="col-md-4">
                        <label class="form-label">Mode</label>
                        <select class="form-select" data-field="mode">
                          <option value="rule">rule</option>
                          <option value="global">global</option>
                          <option value="direct">direct</option>
                        </select>
                      </div>
                      <div class="col-md-4">
                        <label class="form-label">Log level</label>
                        <select class="form-select" data-field="log-level">
                          <option value="info">info</option>
                          <option value="warning">warning</option>
                          <option value="error">error</option>
                          <option value="debug">debug</option>
                        </select>
                      </div>
                      <div class="col-md-4 d-flex align-items-end">
                        <div class="form-check">
                          <input class="form-check-input" type="checkbox" data-field="geodata-mode" id="clashGeodata">
                          <label class="form-check-label" for="clashGeodata">Geo data mode</label>
                        </div>
                      </div>
                      <div class="col-md-4 d-flex align-items-end">
                        <div class="form-check">
                          <input class="form-check-input" type="checkbox" data-field="geo-auto-update" id="clashAutoUpdate">
                          <label class="form-check-label" for="clashAutoUpdate">Auto update geo</label>
                        </div>
                      </div>
                      <div class="col-md-4">
                        <label class="form-label">Geo update interval (h)</label>
                        <input type="number" class="form-control" data-field="geo-update-interval" min="1">
                      </div>
                      <div class="col-md-4 d-flex align-items-end">
                        <div class="form-check">
                          <input class="form-check-input" type="checkbox" data-field="dns.enable" id="clashDnsEnable">
                          <label class="form-check-label" for="clashDnsEnable">Enable DNS</label>
                        </div>
                      </div>
                      <div class="col-md-4 d-flex align-items-end">
                        <div class="form-check">
                          <input class="form-check-input" type="checkbox" data-field="dns.ipv6" id="clashIpv6">
                          <label class="form-check-label" for="clashIpv6">IPv6</label>
                        </div>
                      </div>
                      <div class="col-md-4">
                        <label class="form-label">DNS mode</label>
                        <select class="form-select" data-field="dns.enhanced-mode">
                          <option value="fake-ip">fake-ip</option>
                          <option value="redir-host">redir-host</option>
                          <option value="normal">normal</option>
                        </select>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">DNS Nameservers</label>
                        <input type="text" class="form-control" data-field="dns.nameserver" placeholder="https://223.5.5.5/dns-query, https://120.53.53.53/dns-query">
                        <div class="form-text">Comma separated.</div>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">Proxy DNS nameservers</label>
                        <input type="text" class="form-control" data-field="dns.proxy-server-nameserver" placeholder="https://223.5.5.5/dns-query">
                        <div class="form-text">Comma separated.</div>
                      </div>
                    </div>
                  </div>

                  <div id="surgeForm" class="config-form" data-type="surge">
                    <div class="row g-3">
                      <div class="col-md-6 d-flex align-items-end">
                        <div class="form-check">
                          <input class="form-check-input" type="checkbox" data-field="general.allow-wifi-access" id="surgeWifi">
                          <label class="form-check-label" for="surgeWifi">Allow Wi-Fi access</label>
                        </div>
                      </div>
                      <div class="col-md-6 d-flex align-items-end">
                        <div class="form-check">
                          <input class="form-check-input" type="checkbox" data-field="general.allow-hotspot-access" id="surgeHotspot">
                          <label class="form-check-label" for="surgeHotspot">Allow hotspot</label>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">HTTP port</label>
                        <input type="number" class="form-control" data-field="general.wifi-access-http-port" min="1" max="65535">
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">SOCKS port</label>
                        <input type="number" class="form-control" data-field="general.wifi-access-socks5-port" min="1" max="65535">
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">HTTP listen</label>
                        <input type="text" class="form-control" data-field="general.http-listen" placeholder="127.0.0.1:6152">
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">SOCKS5 listen</label>
                        <input type="text" class="form-control" data-field="general.socks5-listen" placeholder="127.0.0.1:6153">
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">DNS servers</label>
                        <input type="text" class="form-control" data-field="general.dns-server" placeholder="119.29.29.29, 223.5.5.5">
                        <div class="form-text">Comma separated list.</div>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">Encrypted DNS server</label>
                        <input type="text" class="form-control" data-field="general.encrypted-dns-server" placeholder="https://223.5.5.5/dns-query">
                      </div>
                      <div class="col-md-6 d-flex align-items-end">
                        <div class="form-check">
                          <input class="form-check-input" type="checkbox" data-field="general.ipv6" id="surgeIpv6">
                          <label class="form-check-label" for="surgeIpv6">Enable IPv6</label>
                        </div>
                      </div>
                      <div class="col-md-6 d-flex align-items-end">
                        <div class="form-check">
                          <input class="form-check-input" type="checkbox" data-field="general.hide-vpn-icon" id="surgeHideVpn">
                          <label class="form-check-label" for="surgeHideVpn">Hide VPN icon</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <label class="form-label">Raw template preview</label>
              <textarea class="form-control" id="templateContent" rows="14" placeholder="Paste or edit the base configuration template"></textarea>
            </div>
          </div>

          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span class="fw-semibold">Saved templates</span>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary" id="refreshList"><i class="fa fa-rotate me-1"></i>Refresh</button>
              </div>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-borderless align-middle mb-0" id="templateTable">
                  <thead>
                    <tr class="text-secondary">
                      <th scope="col">Name</th>
                      <th scope="col">Type</th>
                      <th scope="col">Updated</th>
                      <th scope="col" class="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
              <div class="text-center text-secondary py-3" id="emptyState">
                No templates yet. Save one to get started.
              </div>
            </div>
          </div>
        </div>
        <script>
          const DEFAULT_TEMPLATES = ${JSON.stringify(templateStrings)};
          const DEFAULT_TEMPLATE_OBJECTS = ${JSON.stringify(defaultTemplates)};

          function deepClone(input) {
            return JSON.parse(JSON.stringify(input || {}));
          }

          const state = {
            currentType: 'singbox',
            templates: {
              singbox: deepClone(DEFAULT_TEMPLATE_OBJECTS.singbox) || {},
              clash: deepClone(DEFAULT_TEMPLATE_OBJECTS.clash) || {},
              surge: deepClone(DEFAULT_TEMPLATE_OBJECTS.surge) || {}
            }
          };

          function getToken() {
            return document.getElementById('adminToken').value.trim() || localStorage.getItem('adminToken') || '';
          }

          function persistToken() {
            const token = document.getElementById('adminToken').value.trim();
            if (token) {
              localStorage.setItem('adminToken', token);
            }
          }

          function showMessage(text, type = 'info') {
            const container = document.getElementById('messageContainer');
            container.innerHTML = '<div class="alert alert-' + type + '" role="alert">' + text + '</div>';
            if (text) {
              setTimeout(() => container.innerHTML = '', 3500);
            }
          }

          async function authorizedFetch(url, options = {}) {
            const token = getToken();
            if (!token) {
              throw new Error('Please enter admin token first.');
            }

            const headers = options.headers || {};
            headers['Authorization'] = 'Bearer ' + token;
            if (!headers['Accept']) {
              headers['Accept'] = 'application/json';
            }
            if (options.body && !headers['Content-Type']) {
              headers['Content-Type'] = 'application/json';
            }

            return fetch(url, { ...options, headers });
          }

          function loadDefaultTemplate() {
            const type = document.getElementById('templateType').value;
            const defaultConfig = getDefaultConfig(type);
            state.templates[type] = defaultConfig;
            syncFormWithState(type);
            syncEditorFromState(type);
            showMessage('Loaded default ' + type + ' template', 'success');
          }

          function clearEditor() {
            const type = document.getElementById('templateType').value;
            state.templates[type] = {};
            syncFormWithState(type);
            syncEditorFromState(type);
          }

          async function fetchTemplates() {
            try {
              const response = await authorizedFetch('/admin/templates');
              if (!response.ok) {
                throw new Error('Unable to load templates');
              }
              const data = await response.json();
              renderTemplateTable(data);
            } catch (error) {
              showMessage(error.message, 'danger');
            }
          }

          function renderTemplateTable(templates) {
            const tbody = document.querySelector('#templateTable tbody');
            const emptyState = document.getElementById('emptyState');
            tbody.innerHTML = '';

            if (!templates || templates.length === 0) {
              emptyState.style.display = 'block';
              return;
            }

            emptyState.style.display = 'none';

            templates.forEach(template => {
              const tr = document.createElement('tr');
              const safeName = template.name || '';
              const safeType = template.type || '';
              tr.innerHTML =
                '<td class="fw-semibold">' + (safeName || '-') + '</td>' +
                '<td><span class="badge bg-secondary">' + (safeType || '-') + '</span></td>' +
                '<td class="text-secondary">' + (template.updatedAt || '-') + '</td>' +
                '<td class="text-end">' +
                  '<button class="btn btn-sm btn-outline-primary me-2" data-action="load" data-name="' + safeName + '" data-type="' + safeType + '">' +
                    '<i class="fa fa-folder-open me-1"></i>Load' +
                  '</button>' +
                  '<button class="btn btn-sm btn-outline-danger" data-action="delete" data-name="' + safeName + '" data-type="' + safeType + '">' +
                    '<i class="fa fa-trash me-1"></i>Delete' +
                  '</button>' +
                '</td>';
              tbody.appendChild(tr);
            });
          }

          async function loadTemplate(name, type) {
            try {
              const url = '/admin/templates?name=' + encodeURIComponent(name) + '&type=' + encodeURIComponent(type);
              const response = await authorizedFetch(url);
              if (!response.ok) {
                throw new Error('Template not found');
              }
              const data = await response.json();
              document.getElementById('templateName').value = data.name || '';
              const resolvedType = data.type || 'singbox';
              document.getElementById('templateType').value = resolvedType;
              applyContentToState(resolvedType, data.content || '');
              switchVisibleForm(resolvedType);
              showMessage('Template loaded', 'success');
            } catch (error) {
              showMessage(error.message, 'danger');
            }
          }

          async function saveTemplate() {
            persistToken();
            const type = document.getElementById('templateType').value;
            const name = document.getElementById('templateName').value.trim();
            const content = document.getElementById('templateContent').value;

            if (!name) {
              showMessage('Template name is required', 'danger');
              return;
            }

            try {
              const response = await authorizedFetch('/admin/templates', {
                method: 'POST',
                body: JSON.stringify({ type, name, content })
              });

              if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Failed to save template');
              }

              showMessage('Template saved successfully', 'success');
              fetchTemplates();
            } catch (error) {
              showMessage(error.message, 'danger');
            }
          }

          async function deleteTemplate(name, type) {
            if (!confirm('Delete template ' + name + '?')) {
              return;
            }
            try {
              const url = '/admin/templates?name=' + encodeURIComponent(name) + '&type=' + encodeURIComponent(type);
              const response = await authorizedFetch(url, {
                method: 'DELETE'
              });

              if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Failed to delete template');
              }

              showMessage('Template removed', 'success');
              fetchTemplates();
            } catch (error) {
              showMessage(error.message, 'danger');
            }
          }

          function getDefaultConfig(type) {
            const fromObject = DEFAULT_TEMPLATE_OBJECTS[type];
            if (fromObject) {
              return deepClone(fromObject);
            }

            const fallback = DEFAULT_TEMPLATES[type];
            if (!fallback) return {};
            try {
              return JSON.parse(fallback);
            } catch (error) {
              console.warn('Failed to parse default template', error);
              return {};
            }
          }

          function switchVisibleForm(type) {
            document.querySelectorAll('.config-form').forEach(form => {
              form.classList.toggle('active', form.dataset.type === type);
            });
            state.currentType = type;
            syncFormWithState(type);
            syncEditorFromState(type);
          }

          function stringifyConfig(type, config) {
            if (type === 'clash' && window.jsyaml) {
              try {
                return window.jsyaml.dump(config);
              } catch (error) {
                console.warn('Failed to convert Clash config to YAML, falling back to JSON', error);
              }
            }
            try {
              return JSON.stringify(config, null, 2);
            } catch (_) {
              return DEFAULT_TEMPLATES[type] || '';
            }
          }

          function parseConfigFromText(type, text) {
            if (!text || !text.trim()) {
              return {};
            }
            try {
              return JSON.parse(text);
            } catch (_) {
              if (type === 'clash' && window.jsyaml) {
                try {
                  return window.jsyaml.load(text);
                } catch (yamlError) {
                  throw new Error('Invalid Clash YAML/JSON: ' + yamlError.message);
                }
              }
              throw new Error('Invalid JSON content');
            }
          }

          function ensureSingboxInbound(config, tag) {
            const inbounds = config.inbounds || [];
            let item = inbounds.find(entry => entry.tag === tag);
            if (!item) {
              const defaults = {
                'http-in': { tag: 'http-in', type: 'http', listen: '::', listen_port: 7080 },
                'socks-in': { tag: 'socks-in', type: 'socks', listen: '::', listen_port: 1080 },
                'redirect-in': { tag: 'redirect-in', type: 'redirect', listen: '::', listen_port: 7890 },
                'tproxy-in': { tag: 'tproxy-in', type: 'tproxy', listen: '::', listen_port: 7891 },
                'tun-in': { tag: 'tun-in', type: 'tun', interface_name: 'momo', auto_route: false, auto_redirect: false }
              };
              item = defaults[tag] ? deepClone(defaults[tag]) : { tag };
              inbounds.push(item);
            }
            config.inbounds = inbounds;
            return item;
          }

          function ensureSingboxDnsServer(config, tag) {
            const dns = config.dns || {};
            const servers = dns.servers || [];
            let server = servers.find(entry => entry.tag === tag);
            if (!server) {
              server = { tag, type: 'https', server: '' };
              servers.push(server);
            }
            dns.servers = servers;
            config.dns = dns;
            return server;
          }

          function syncSingboxForm(config) {
            const dnsProxy = ensureSingboxDnsServer(config, 'dns_proxy');
            const dnsDirect = ensureSingboxDnsServer(config, 'dns_direct');
            const dnsFakeip = ensureSingboxDnsServer(config, 'dns_fakeip');
            const httpInbound = ensureSingboxInbound(config, 'http-in');
            const socksInbound = ensureSingboxInbound(config, 'socks-in');
            const redirectInbound = ensureSingboxInbound(config, 'redirect-in');
            const tproxyInbound = ensureSingboxInbound(config, 'tproxy-in');
            const tunInbound = ensureSingboxInbound(config, 'tun-in');

            document.querySelector('[data-field="dnsProxyServer"]').value = dnsProxy.server || '';
            document.querySelector('[data-field="dnsDirectServer"]').value = dnsDirect.server || '';
            document.querySelector('[data-field="fakeIpRange"]').value = dnsFakeip.inet4_range || '';
            document.querySelector('[data-field="fakeIpv6Range"]').value = dnsFakeip.inet6_range || '';
            document.querySelector('[data-field="httpPort"]').value = httpInbound.listen_port || '';
            document.querySelector('[data-field="socksPort"]').value = socksInbound.listen_port || '';
            document.querySelector('[data-field="redirectPort"]').value = redirectInbound.listen_port || '';
            document.querySelector('[data-field="tproxyPort"]').value = tproxyInbound.listen_port || '';
            document.querySelector('[data-field="tunInterface"]').value = tunInbound.interface_name || '';
            document.querySelector('[data-field="tunAutoRoute"]').checked = Boolean(tunInbound.auto_route);
            document.querySelector('[data-field="ntpServer"]').value = config.ntp?.server || '';
            document.querySelector('[data-field="ntpInterval"]').value = config.ntp?.interval || '';
          }

          function updateSingboxState(field, value) {
            const config = state.templates.singbox || {};
            switch (field) {
              case 'dnsProxyServer':
                ensureSingboxDnsServer(config, 'dns_proxy').server = value;
                break;
              case 'dnsDirectServer':
                ensureSingboxDnsServer(config, 'dns_direct').server = value;
                break;
              case 'fakeIpRange':
                ensureSingboxDnsServer(config, 'dns_fakeip').inet4_range = value;
                break;
              case 'fakeIpv6Range':
                ensureSingboxDnsServer(config, 'dns_fakeip').inet6_range = value;
                break;
              case 'httpPort':
                ensureSingboxInbound(config, 'http-in').listen_port = Number(value) || 0;
                break;
              case 'socksPort':
                ensureSingboxInbound(config, 'socks-in').listen_port = Number(value) || 0;
                break;
              case 'redirectPort':
                ensureSingboxInbound(config, 'redirect-in').listen_port = Number(value) || 0;
                break;
              case 'tproxyPort':
                ensureSingboxInbound(config, 'tproxy-in').listen_port = Number(value) || 0;
                break;
              case 'tunInterface':
                ensureSingboxInbound(config, 'tun-in').interface_name = value;
                break;
              case 'tunAutoRoute':
                ensureSingboxInbound(config, 'tun-in').auto_route = Boolean(value);
                break;
              case 'ntpServer':
                config.ntp = config.ntp || {};
                config.ntp.server = value;
                break;
              case 'ntpInterval':
                config.ntp = config.ntp || {};
                config.ntp.interval = value;
                break;
              default:
                break;
            }
            state.templates.singbox = config;
          }

          function getPath(obj, path) {
            return path.split('.').reduce((acc, key) => acc && acc[key] !== undefined ? acc[key] : undefined, obj);
          }

          function setPath(obj, path, value) {
            const parts = path.split('.');
            let current = obj;
            for (let i = 0; i < parts.length - 1; i++) {
              const key = parts[i];
              if (current[key] === undefined) {
                current[key] = {};
              }
              current = current[key];
            }
            current[parts[parts.length - 1]] = value;
          }

          function syncClashForm(config) {
            const bindings = {
              'port': getPath(config, 'port') || '',
              'socks-port': getPath(config, 'socks-port') || '',
              'allow-lan': Boolean(getPath(config, 'allow-lan')),
              'mode': getPath(config, 'mode') || 'rule',
              'log-level': getPath(config, 'log-level') || 'info',
              'geodata-mode': Boolean(getPath(config, 'geodata-mode')),
              'geo-auto-update': Boolean(getPath(config, 'geo-auto-update')),
              'geo-update-interval': getPath(config, 'geo-update-interval') || '',
              'dns.enable': Boolean(getPath(config, 'dns.enable')),
              'dns.ipv6': Boolean(getPath(config, 'dns.ipv6')),
              'dns.enhanced-mode': getPath(config, 'dns.enhanced-mode') || 'fake-ip',
              'dns.nameserver': (getPath(config, 'dns.nameserver') || []).join(', '),
              'dns.proxy-server-nameserver': (getPath(config, 'dns.proxy-server-nameserver') || []).join(', ')
            };

            Object.entries(bindings).forEach(([field, val]) => {
              const input = document.querySelector(`[data-field="${field}"]`);
              if (!input) return;
              if (input.type === 'checkbox') {
                input.checked = Boolean(val);
              } else {
                input.value = val;
              }
            });
          }

          function updateClashState(field, value, checked) {
            const config = state.templates.clash || {};
            const normalizedValue = (() => {
              if (field.startsWith('dns.') && typeof value === 'string' && !field.endsWith('enhanced-mode')) {
                return value.split(',').map(entry => entry.trim()).filter(Boolean);
              }
              if (typeof checked === 'boolean') {
                return checked;
              }
              if (field === 'geo-update-interval' || field === 'port' || field === 'socks-port') {
                const num = Number(value);
                return Number.isFinite(num) ? num : 0;
              }
              return value;
            })();

            setPath(config, field, normalizedValue);
            state.templates.clash = config;
          }

          function syncSurgeForm(config) {
            const bindings = {
              'general.allow-wifi-access': Boolean(getPath(config, 'general.allow-wifi-access')),
              'general.allow-hotspot-access': Boolean(getPath(config, 'general.allow-hotspot-access')),
              'general.wifi-access-http-port': getPath(config, 'general.wifi-access-http-port') || '',
              'general.wifi-access-socks5-port': getPath(config, 'general.wifi-access-socks5-port') || '',
              'general.http-listen': getPath(config, 'general.http-listen') || '',
              'general.socks5-listen': getPath(config, 'general.socks5-listen') || '',
              'general.dns-server': getPath(config, 'general.dns-server') || '',
              'general.encrypted-dns-server': getPath(config, 'general.encrypted-dns-server') || '',
              'general.ipv6': Boolean(getPath(config, 'general.ipv6')),
              'general.hide-vpn-icon': Boolean(getPath(config, 'general.hide-vpn-icon'))
            };

            Object.entries(bindings).forEach(([field, val]) => {
              const input = document.querySelector(`[data-field="${field}"]`);
              if (!input) return;
              if (input.type === 'checkbox') {
                input.checked = Boolean(val);
              } else {
                input.value = val;
              }
            });
          }

          function updateSurgeState(field, value, checked) {
            const config = state.templates.surge || {};
            const finalValue = typeof checked === 'boolean' ? checked : value;
            setPath(config, field, finalValue);
            state.templates.surge = config;
          }

          function syncFormWithState(type) {
            if (type === 'singbox') {
              syncSingboxForm(state.templates.singbox || {});
            } else if (type === 'clash') {
              syncClashForm(state.templates.clash || {});
            } else {
              syncSurgeForm(state.templates.surge || {});
            }
          }

          function syncEditorFromState(type) {
            const content = stringifyConfig(type, state.templates[type] || {});
            document.getElementById('templateContent').value = content;
          }

          function applyContentToState(type, text) {
            try {
              state.templates[type] = parseConfigFromText(type, text);
              syncFormWithState(type);
              syncEditorFromState(type);
            } catch (error) {
              showMessage(error.message, 'danger');
            }
          }

          function handleFormChange(event) {
            const input = event.target;
            const field = input.dataset.field;
            if (!field) return;
            const type = input.closest('.config-form')?.dataset.type;
            if (!type) return;

            if (type === 'singbox') {
              updateSingboxState(field, input.type === 'checkbox' ? input.checked : input.value);
            } else if (type === 'clash') {
              updateClashState(field, input.value, input.type === 'checkbox' ? input.checked : undefined);
            } else {
              updateSurgeState(field, input.value, input.type === 'checkbox' ? input.checked : undefined);
            }

            syncEditorFromState(type);
          }

          function registerTypeSwitcher() {
            const templateType = document.getElementById('templateType');
            templateType.addEventListener('change', () => {
              const type = templateType.value;
              switchVisibleForm(type);
            });
          }

          function registerFormListeners() {
            document.querySelectorAll('.config-form input, .config-form select').forEach(input => {
              input.addEventListener('input', handleFormChange);
              input.addEventListener('change', handleFormChange);
            });
          }

          function registerEditorListener() {
            const textarea = document.getElementById('templateContent');
            textarea.addEventListener('blur', () => {
              const type = document.getElementById('templateType').value;
              applyContentToState(type, textarea.value);
            });
          }

          function registerEvents() {
            document.getElementById('loadDefault').addEventListener('click', loadDefaultTemplate);
            document.getElementById('clearEditor').addEventListener('click', clearEditor);
            document.getElementById('saveTemplate').addEventListener('click', saveTemplate);
            document.getElementById('refreshList').addEventListener('click', fetchTemplates);
            registerTypeSwitcher();
            registerFormListeners();
            registerEditorListener();

            const storedToken = localStorage.getItem('adminToken');
            if (storedToken) {
              document.getElementById('adminToken').value = storedToken;
            }

            document.querySelector('#templateTable tbody').addEventListener('click', (event) => {
              const target = event.target.closest('button[data-action]');
              if (!target) return;
              const { action, name, type } = target.dataset;
              if (action === 'load') {
                loadTemplate(name, type);
              } else if (action === 'delete') {
                deleteTemplate(name, type);
              }
            });
          }

          document.addEventListener('DOMContentLoaded', () => {
            registerEvents();
            switchVisibleForm(document.getElementById('templateType').value);
            fetchTemplates();
          });
        </script>
      </body>
    </html>
  `;
}
