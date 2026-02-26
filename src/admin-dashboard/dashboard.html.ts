export function getDashboardHtml(): string {
  const base = '/api/admin-dashboard';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin Dashboard</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; background: #0f0f12; color: #e4e4e7; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 1rem; }
    h1 { font-size: 1.5rem; margin: 0 0 1rem; }
    h2 { font-size: 1.1rem; margin: 0 0 0.5rem; color: #a1a1aa; }
    input, button, textarea, select { font: inherit; }
    input, textarea, select { padding: 0.5rem 0.75rem; border: 1px solid #3f3f46; border-radius: 6px; background: #18181b; color: #e4e4e7; width: 100%; }
    button { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; background: #3b82f6; color: white; }
    button:hover { background: #2563eb; }
    button.danger { background: #dc2626; }
    button.danger:hover { background: #b91c1c; }
    button.secondary { background: #3f3f46; }
    button.secondary:hover { background: #52525b; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .tabs button { border-radius: 6px; }
    .tabs button.active { background: #52525b; }
    .flex { display: flex; gap: 1rem; flex-wrap: wrap; }
    .grid { display: grid; gap: 0.5rem; }
    .hidden { display: none !important; }
    #loginForm { max-width: 320px; }
    #loginForm input { margin-bottom: 0.75rem; }
    #loginForm button { width: 100%; }
    .error { color: #f87171; font-size: 0.875rem; margin-top: 0.25rem; }
    .messages { max-height: 400px; overflow-y: auto; }
    .msg { padding: 0.5rem 0.75rem; margin: 0.25rem 0; border-radius: 6px; max-width: 85%; }
    .msg.user { background: #27272a; margin-left: 0; margin-right: auto; }
    .msg.support { background: #1e3a5f; margin-left: auto; margin-right: 0; }
    .msg time { font-size: 0.7rem; color: #71717a; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #27272a; }
    th { color: #a1a1aa; }
    .actions { display: flex; gap: 0.25rem; }
    .conversation-list .item { padding: 0.75rem; border-bottom: 1px solid #27272a; cursor: pointer; }
    .conversation-list .item:hover { background: #27272a; }
    .send-row { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
    .send-row input { flex: 1; }
    #tableList .item { padding: 0.5rem; cursor: pointer; border-radius: 4px; }
    #tableList .item:hover { background: #27272a; }
    .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10; }
    .modal .card { max-width: 500px; width: 100%; max-height: 90vh; overflow: auto; }
    .modal h3 { margin: 0 0 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <div id="loginScreen" class="card">
      <h1>Admin Dashboard</h1>
      <form id="loginForm">
        <input type="password" id="loginPassword" placeholder="Admin password" autocomplete="current-password" required>
        <div id="loginError" class="error hidden"></div>
        <button type="submit">Log in</button>
      </form>
    </div>

    <div id="mainScreen" class="hidden">
      <div class="flex" style="justify-content: space-between; align-items: center;">
        <h1>Admin Dashboard</h1>
        <button type="button" class="secondary" id="logoutBtn">Log out</button>
      </div>
      <div class="tabs">
        <button type="button" id="tabHelp">Help Center</button>
        <button type="button" id="tabTables">Tables</button>
      </div>

      <div id="panelHelp" class="hidden">
        <div class="flex" style="gap: 1rem;">
          <div class="card" style="flex: 0 0 280px;">
            <h2>Conversations</h2>
            <div id="conversationList" class="conversation-list"></div>
          </div>
          <div class="card" style="flex: 1;">
            <h2 id="chatTitle">Select a conversation</h2>
            <div id="messagesBox" class="hidden">
              <div class="send-row" style="margin-bottom: 0.5rem;">
                <button type="button" class="secondary" id="messagesRefresh">Refresh</button>
              </div>
              <div id="messages" class="messages"></div>
              <div class="send-row">
                <input type="text" id="supportInput" placeholder="Type support message...">
                <button type="button" id="supportSend">Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="panelTables" class="hidden">
        <div class="card">
          <h2>Tables</h2>
          <div id="tableList" class="grid" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));"></div>
        </div>
        <div id="tableDataCard" class="card hidden">
          <h2 id="tableDataTitle">Table data</h2>
          <div class="flex" style="margin-bottom: 0.5rem;">
            <button type="button" class="secondary" id="tableRefresh">Refresh</button>
            <button type="button" id="tableAdd">Add row</button>
          </div>
          <div style="overflow-x: auto;">
            <table id="dataTable"><thead id="dataTableHead"></thead><tbody id="dataTableBody"></tbody></table>
          </div>
          <div id="tablePagination" style="margin-top: 0.5rem;"></div>
        </div>
        <div id="rowModal" class="modal hidden">
          <div class="card">
            <h3 id="rowModalTitle">Edit row</h3>
            <div id="rowModalForm"></div>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
              <button type="button" id="rowModalSave">Save</button>
              <button type="button" class="secondary" id="rowModalCancel">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const BASE = '${base}';
    const API_BASE = window.location.origin + BASE.replace('/admin-dashboard', '');
    const TOKEN_KEY = 'adminToken';

    function getToken() { return localStorage.getItem(TOKEN_KEY); }
    function setToken(t) { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); }

    function api(url, opts = {}) {
      const token = getToken();
      const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
      if (token) headers['Authorization'] = 'Bearer ' + token;
      const fullUrl = url.startsWith('http') ? url : (url.startsWith('/') ? window.location.origin + url : window.location.origin + '/api' + (url.startsWith('/api') ? url.slice(4) : url));
      return fetch(fullUrl, {
        ...opts,
        headers: { ...headers, ...opts.headers },
        body: opts.body !== undefined ? (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)) : undefined,
      });
    }

    function show(el) { el.classList.remove('hidden'); }
    function hide(el) { el.classList.add('hidden'); }

    // Login
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('loginPassword').value;
      const errEl = document.getElementById('loginError');
      try {
        const res = await api(BASE + '/login', { method: 'POST', body: { password } });
        const data = await res.json();
        if (!res.ok) { errEl.textContent = data.message || 'Login failed'; show(errEl); return; }
        setToken(data.accessToken);
        hide(document.getElementById('loginScreen'));
        show(document.getElementById('mainScreen'));
        show(document.getElementById('panelHelp'));
        document.getElementById('tabHelp').classList.add('active');
        loadConversations();
      } catch (err) { errEl.textContent = err.message || 'Network error'; show(errEl); }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => { setToken(null); location.reload(); });

    if (getToken()) {
      hide(document.getElementById('loginScreen'));
      show(document.getElementById('mainScreen'));
      show(document.getElementById('panelHelp'));
      document.getElementById('tabHelp').classList.add('active');
      loadConversations().catch(() => { setToken(null); location.reload(); });
    }

    // Tabs
    document.getElementById('tabHelp').addEventListener('click', () => {
      document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
      document.getElementById('tabHelp').classList.add('active');
      hide(document.getElementById('panelTables'));
      show(document.getElementById('panelHelp'));
      loadConversations();
    });
    document.getElementById('tabTables').addEventListener('click', () => {
      document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
      document.getElementById('tabTables').classList.add('active');
      hide(document.getElementById('panelHelp'));
      show(document.getElementById('panelTables'));
      loadTableList();
    });

    // Help Center
    let selectedConversation = null;

    async function loadConversations() {
      const token = getToken();
      if (!token) return;
      const res = await api(BASE + '/help-center/conversations', { headers: { Authorization: 'Bearer ' + token } });
      if (res.status === 401) { setToken(null); location.reload(); throw new Error('Unauthorized'); }
      const list = await res.json();
      const el = document.getElementById('conversationList');
      el.innerHTML = '';
      (Array.isArray(list) ? list : []).forEach(c => {
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = '<strong>' + (c.user?.email || c.userId) + '</strong><br><small>' + (c.lastMessage?.text?.slice(0, 40) || 'No messages') + '</small>';
        div.onclick = () => selectConversation(c);
        el.appendChild(div);
      });
    }

    function selectConversation(c) {
      selectedConversation = c;
      document.getElementById('chatTitle').textContent = c.user?.email || c.userId;
      show(document.getElementById('messagesBox'));
      loadMessages(c.id);
    }

    async function loadMessages(conversationId) {
      const res = await api(BASE + '/help-center/conversations/' + conversationId + '/messages');
      const data = await res.json();
      const list = data.messages || [];
      const el = document.getElementById('messages');
      el.innerHTML = '';
      list.forEach(m => appendMessage(m));
    }

    function appendMessage(m) {
      const el = document.getElementById('messages');
      const div = document.createElement('div');
      div.className = 'msg ' + m.sender;
      div.innerHTML = '<span>' + escapeHtml(m.text) + '</span><br><time>' + (m.createdAt || '').replace('T', ' ').slice(0, 19) + '</time>';
      el.appendChild(div);
      el.scrollTop = el.scrollHeight;
    }

    document.getElementById('messagesRefresh').addEventListener('click', () => {
      if (selectedConversation) loadMessages(selectedConversation.id);
    });

    document.getElementById('supportSend').addEventListener('click', sendSupportMessage);
    document.getElementById('supportInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendSupportMessage(); });

    async function sendSupportMessage() {
      if (!selectedConversation) return;
      const input = document.getElementById('supportInput');
      const text = input.value.trim();
      if (!text) return;
      try {
        const res = await api(BASE + '/help-center/conversations/' + selectedConversation.userId + '/messages', { method: 'POST', body: { text } });
        if (!res.ok) { const err = await res.json().catch(() => ({})); console.error(err.message || err.error || 'Send failed'); return; }
        const msg = await res.json();
        if (msg.id) appendMessage(msg);
        input.value = '';
      } catch (err) { console.error(err); }
    }

    // Tables
    let currentTable = null;
    let currentSkip = 0;
    const take = 20;

    async function loadTableList() {
      const res = await api(BASE + '/tables');
      const data = await res.json();
      const tables = data.tables || [];
      const el = document.getElementById('tableList');
      el.innerHTML = '';
      tables.forEach(t => {
        const div = document.createElement('div');
        div.className = 'item';
        div.textContent = t;
        div.onclick = () => selectTable(t);
        el.appendChild(div);
      });
    }

    function selectTable(table) {
      currentTable = table;
      currentSkip = 0;
      show(document.getElementById('tableDataCard'));
      document.getElementById('tableDataTitle').textContent = 'Table: ' + table;
      loadTableData();
    }

    async function loadTableData() {
      if (!currentTable) return;
      const res = await api(BASE + '/tables/' + currentTable + '?skip=' + currentSkip + '&take=' + take);
      const data = await res.json();
      const rows = data.data || [];
      const total = data.total || 0;
      const thead = document.getElementById('dataTableHead');
      const tbody = document.getElementById('dataTableBody');
      if (rows.length) {
        const keys = Object.keys(rows[0]);
        thead.innerHTML = '<tr><th>' + keys.map(k => escapeHtml(k)).join('</th><th>') + '</th><th>Actions</th></tr>';
        tbody.innerHTML = rows.map(row => {
          const id = row.id ?? (row.outfitId != null && row.wardrobeItemId != null ? row.outfitId + '|' + row.wardrobeItemId : null);
          const idStr = id != null ? escapeHtml(String(id)) : '';
          return '<tr><td>' + keys.map(k => escapeHtml(String(row[k] ?? ''))).join('</td><td>') + '</td><td class="actions"><button type="button" class="secondary" data-action="edit" data-id="' + idStr + '">Edit</button><button type="button" class="danger" data-action="delete" data-id="' + idStr + '">Delete</button></td></tr>';
        }).join('');
      } else {
        thead.innerHTML = '';
        tbody.innerHTML = '<tr><td colspan="3">No rows</td></tr>';
      }
      tbody.querySelectorAll('[data-action=edit]').forEach(btn => btn.addEventListener('click', () => openEditModal(btn.dataset.id)));
      tbody.querySelectorAll('[data-action=delete]').forEach(btn => btn.addEventListener('click', () => deleteRow(btn.dataset.id)));
      const pagination = document.getElementById('tablePagination');
      pagination.innerHTML = '';
      if (total > take) {
        const prev = document.createElement('button');
        prev.className = 'secondary';
        prev.textContent = 'Previous';
        prev.disabled = currentSkip === 0;
        prev.onclick = () => { currentSkip = Math.max(0, currentSkip - take); loadTableData(); };
        const next = document.createElement('button');
        next.className = 'secondary';
        next.textContent = 'Next';
        next.style.marginLeft = '0.5rem';
        next.disabled = currentSkip + take >= total;
        next.onclick = () => { currentSkip += take; loadTableData(); };
        pagination.appendChild(prev);
        pagination.appendChild(next);
        pagination.appendChild(document.createTextNode(' ' + (currentSkip + 1) + '-' + Math.min(currentSkip + take, total) + ' of ' + total));
      }
    }

    document.getElementById('tableRefresh').addEventListener('click', loadTableData);
    document.getElementById('tableAdd').addEventListener('click', () => openEditModal(null));

    function openEditModal(id) {
      const modal = document.getElementById('rowModal');
      const formEl = document.getElementById('rowModalForm');
      document.getElementById('rowModalTitle').textContent = id ? 'Edit row' : 'New row';
      if (id) {
        api(BASE + '/tables/' + currentTable + '/' + encodeURIComponent(id)).then(r => r.json()).then(row => {
          formEl.innerHTML = Object.keys(row).filter(k => k !== 'id' && k !== 'createdAt').map(k => '<label>' + k + '</label><input name="' + k + '" value="' + escapeHtml(String(row[k] ?? '')) + '">').join('');
          show(modal);
        });
      } else {
        formEl.innerHTML = '';
        show(modal);
      }
      window._rowModalId = id;
    }

    document.getElementById('rowModalCancel').addEventListener('click', () => hide(document.getElementById('rowModal')));
    document.getElementById('rowModalSave').addEventListener('click', async () => {
      const formEl = document.getElementById('rowModalForm');
      const id = window._rowModalId;
      const inputs = formEl.querySelectorAll('input');
      const body = {};
      inputs.forEach(inp => { body[inp.name] = inp.value; });
      if (id) {
        await api(BASE + '/tables/' + currentTable + '/' + encodeURIComponent(id), { method: 'PATCH', body });
      } else {
        await api(BASE + '/tables/' + currentTable, { method: 'POST', body });
      }
      hide(document.getElementById('rowModal'));
      loadTableData();
    });

    async function deleteRow(id) {
      if (!confirm('Delete this row?')) return;
      await api(BASE + '/tables/' + currentTable + '/' + encodeURIComponent(id), { method: 'DELETE' });
      loadTableData();
    }

    function escapeHtml(s) {
      const div = document.createElement('div');
      div.textContent = s;
      return div.innerHTML;
    }
  </script>
</body>
</html>`;
}
