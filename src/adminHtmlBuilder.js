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

              <div class="d-flex gap-2 mb-2">
                <button class="btn btn-outline-secondary" id="loadDefault"><i class="fa fa-rotate-left me-1"></i>Load default</button>
                <button class="btn btn-outline-secondary" id="clearEditor"><i class="fa fa-eraser me-1"></i>Clear</button>
                <button class="btn btn-primary ms-auto" id="saveTemplate"><i class="fa fa-save me-1"></i>Save template</button>
              </div>

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
            document.getElementById('templateContent').value = DEFAULT_TEMPLATES[type] || '';
            showMessage('Loaded default ' + type + ' template', 'success');
          }

          function clearEditor() {
            document.getElementById('templateContent').value = '';
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
              document.getElementById('templateType').value = data.type || 'singbox';
              document.getElementById('templateContent').value = data.content || '';
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

          function registerEvents() {
            document.getElementById('loadDefault').addEventListener('click', loadDefaultTemplate);
            document.getElementById('clearEditor').addEventListener('click', clearEditor);
            document.getElementById('saveTemplate').addEventListener('click', saveTemplate);
            document.getElementById('refreshList').addEventListener('click', fetchTemplates);

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
            fetchTemplates();
          });
        </script>
      </body>
    </html>
  `;
}
