/* TMG TMS - giao diện quản trị */
(function () {
  'use strict';
  const M = window.TMG_MODULES, MENU = window.TMG_MENU;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = U.esc;

  /* ---------- Icons ---------- */
  const P = {
    home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
    doc: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8',
    truck: 'M1 5h14v11H1zM15 9h4l4 4v3h-8zM5.5 19a2 2 0 1 0 0-.1M18.5 19a2 2 0 1 0 0-.1',
    money: 'M2 6h20v12H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 9v.01M18 15v.01',
    chart: 'M3 3v18h18M7 15l4-4 3 3 6-7',
    user: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM3 22a9 9 0 0 1 18 0',
    car: 'M5 11l2-5h10l2 5M3 11h18v6H3zM7 17v2M17 17v2M7 14h.01M17 14h.01',
    id: 'M2 5h20v14H2zM8 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM4.5 17a3.5 3.5 0 0 1 7 0M14 9h5M14 13h5',
    cash: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h5',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM1 21a8 8 0 0 1 16 0M17 3a4 4 0 0 1 0 8M23 21a8 8 0 0 0-5-7.4',
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    plus: 'M12 5v14M5 12h14', edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4', copy: 'M8 8h12v12H8zM16 8V4H4v12h4',
    trash: 'M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15', check: 'M5 12l5 5L20 7', x: 'M6 6l12 12M18 6L6 18',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    menu: 'M3 6h18M3 12h18M3 18h18', bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
    dl: 'M12 3v12M7 10l5 5 5-5M4 21h16', refresh: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5', phone: 'M7 2h10v20H7zM11 18h2',
    print: 'M6 9V2h12v7M6 18H4v-7h16v7h-2M8 14h8v8H8z', dollar: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'
  };
  const ic = (n, extra = '') => `<svg class="i" ${extra} viewBox="0 0 24 24"><path d="${P[n] || P.list}"/></svg>`;

  /* ---------- Helpers ---------- */
  const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200); };
  const session = () => Store.session();
  // Phải có vai trò được cấp quyền duyệt (trước đây: không có vai trò cũng duyệt được)
  const canApprove = () => { const s = session(); if (!s) return false; const u = Store.get('admin', s.id); const r = u && Store.get('role', u.role_id); return !!r && r.approve_cost === 'Có'; };
  const BADGE = {
    ok: ['Hoàn thành', 'Đã xác nhận', 'Đã duyệt', 'Đã chi', 'Đã thanh toán', 'Đã phê duyệt', 'Có', 'Đã thu tiền', 'Đã xử lý', 'Xe trống', 'Hoạt động', 'Đã tạo đơn'],
    warn: ['Chờ duyệt', 'Chờ xác nhận', 'Chờ tài xế xác nhận', 'Chờ nhận hàng', 'Chưa phê duyệt', 'Thanh toán chưa đủ', 'Đang xử lý', 'Chưa thanh toán', 'Gửi tài xế', 'Mới', 'Chưa xử lý'],
    bad: ['Hủy', 'Từ chối', 'Đã hủy', 'Xe hỏng', 'Xe công an giữ', 'Không'],
    info: ['Đang vận chuyển', 'Đang chạy', 'Xe đang vận chuyển', 'Sẵn sàng', 'Đã cấp số hóa đơn', 'Đã tiếp nhận']
  };
  const chip = v => { if (!v) return ''; const k = Object.keys(BADGE).find(k => BADGE[k].includes(v)); return `<span class="chip ${k || ''}">${esc(v)}</span>`; };
  const refLabel = (fd, id) => { if (!id) return ''; const r = Store.get(fd.ref, id); return r ? (r[fd.show || 'name'] ?? r.name ?? r.plate ?? r.code ?? '') : ''; };
  function rawValue(fd, r) {
    if (fd.virtual) return fd.virtual(r);
    const v = r[fd.k];
    if (fd.type === 'ref') return refLabel(fd, v);
    if (fd.type === 'refs') return (v || []).map(x => refLabel(fd, x)).join(', ');
    return v ?? '';
  }
  function cell(fd, r) {
    const v = rawValue(fd, r);
    switch (fd.type) {
      case 'money': return U.money(v);
      case 'num': return v === '' ? '' : Number(v).toLocaleString('vi-VN');
      case 'date': case 'datetime': return U.date(v);
      case 'image': return Store.img(v, 'class="thumb" data-zoom');
      case 'password': return '••••';
      case 'select': return fd.badge ? chip(v) : esc(v);
      default: return esc(v);
    }
  }
  const defVal = fd => { const d = fd.def; if (d === 'today') return U.today(); if (d === 'now') return U.now(); return typeof d === 'function' ? d() : (d ?? (fd.type === 'refs' ? [] : '')); };
  const applyCalc = (mod, rec) => { mod.fields.forEach(fd => { if (fd.calc) rec[fd.k] = fd.calc(rec); }); return rec; };

  /* ---------- Routing ---------- */
  const state = {}; // trạng thái list theo module
  function route() {
    const s = session();
    if (!s) return renderLogin();
    if (!$('.layout')) renderShell();
    const h = location.hash.replace(/^#\/?/, '') || 'p/dashboard';
    const [kind, key, arg] = h.split('/');
    closeFly();
    $$('.side .nav-btn').forEach(b => b.classList.remove('active'));
    const content = $('.content'); content.scrollTop = 0;
    if (kind === 'm' && M[key]) { markActive(key); renderList(M[key]); }
    else if (kind === 'p' && PAGES[key]) { markActive(key); PAGES[key](content, arg); }
    else { location.hash = '#/p/dashboard'; }
    document.title = ($('.ph h1') ? $('.ph h1').textContent + ' | ' : '') + 'TMG TMS';
  }
  function markActive(key) {
    MENU.forEach((g, i) => { const ids = g.items ? g.items.map(x => typeof x === 'string' ? x : x.id) : [g.id]; if (ids.includes(key)) { const b = $$('.side .nav-btn')[i]; b && b.classList.add('active'); } });
  }
  window.addEventListener('hashchange', () => Store.ready().then(route));

  /* ---------- Login ---------- */
  function renderLogin() {
    const set = Store.settings();
    $('#app').innerHTML = `
    <div class="login-wrap"><div class="login-card">
      <div class="login-left">
        <div><h2>Hệ thống quản lý vận tải</h2><p>${esc(set.company || 'TMG Logistics')}</p></div>
        <ul><li>Quản lý đơn hàng, chuyến xe, điều vận</li><li>Nhập doanh thu, đề nghị &amp; duyệt chi phí</li><li>Chi phí vận hành, lãi lỗ theo đầu xe</li><li>App tài xế theo từng xe</li></ul>
        <a href="driver.html" style="color:#fff;font-weight:600">${ic('phone')} Mở App tài xế →</a>
      </div>
      <form class="login-right" id="lf">
        <div class="brand"><div class="logo">${ic('truck')}</div>TMG TMS</div>
        <div class="field"><label>Tên đăng nhập</label><input name="u" autocomplete="username" required autofocus></div>
        <div class="field"><label>Mật khẩu</label><input name="p" type="password" autocomplete="current-password" required></div>
        <label style="display:flex;gap:6px;align-items:center;margin-bottom:10px"><input type="checkbox" name="r" checked> Ghi nhớ đăng nhập</label>
        <div class="err" id="lerr"></div>
        <button class="btn primary block">Đăng nhập</button>
        <div class="hint">Tài khoản mặc định lần đầu: <b>admin</b> / <b>admin123</b> — hãy đổi mật khẩu trong mục Quản trị → Người dùng.<br>Dữ liệu được lưu trên trình duyệt của máy này.</div>
      </form></div></div>`;
    $('#lf').onsubmit = e => {
      e.preventDefault(); const fd = new FormData(e.target);
      const u = Store.all('admin').find(a => a.username === fd.get('u').trim() && a.password === fd.get('p') && a.active !== 'Không');
      if (!u) { $('#lerr').textContent = 'Sai tên đăng nhập hoặc mật khẩu'; return; }
      Store.setSession({ id: u.id, name: u.name, username: u.username }, !!fd.get('r'));
      route();
    };
  }

  /* ---------- Shell ---------- */
  function renderShell() {
    const s = session(); const set = Store.settings();
    $('#app').innerHTML = `
    <div class="layout">
      <aside class="side">
        <div class="logo">${ic('truck', 'style="width:26px;height:26px"')}</div>
        <div class="nav">${MENU.map((g, i) => `<button class="nav-btn" data-i="${i}" title="${esc(g.title)}">${ic(g.icon)}</button>`).join('')}</div>
      </aside>
      <div class="flyout" id="fly"></div>
      <div class="main">
        <header class="top">
          <button class="menu-toggle" id="mt">${ic('menu')}</button>
          <div class="quick"><a href="#/m/order">Đơn hàng</a><a href="#/m/route">Chuyến xe</a><a href="#/m/cost_request">Duyệt chi phí</a><a href="#/p/rpt_vehicle">Lãi lỗ đầu xe</a><a href="driver.html" target="_blank">App tài xế</a></div>
          <div class="grow"></div>
          <span class="co">${esc(set.company || '')}</span>
          <span class="bell" id="bell">${ic('bell')}<span class="badge-n" id="bn"></span></span>
          <div class="avatar" id="av">${esc((s.name || 'A')[0])}</div>
        </header>
        <div class="content"></div>
      </div>
    </div>`;
    $$('.side .nav-btn').forEach(b => {
      b.onclick = e => {
        e.stopPropagation(); const g = MENU[b.dataset.i];
        if (g.page) { location.hash = '#/p/' + g.id; $('.side').classList.remove('open'); return; }
        const fly = $('#fly'); const was = fly.classList.contains('show') && fly.dataset.i === b.dataset.i;
        closeFly(); if (was) return;
        fly.dataset.i = b.dataset.i;
        fly.innerHTML = `<h4>${esc(g.title)}</h4>` + g.items.map(it => typeof it === 'string' ? `<a href="#/m/${it}">${esc(M[it].title)}</a>` : `<a href="#/p/${it.id}">${esc(it.title)}</a>`).join('');
        fly.classList.add('show'); b.classList.add('on');
      };
    });
    document.addEventListener('click', e => { if (!e.target.closest('#fly') && !e.target.closest('.side')) closeFly(); if (!e.target.closest('.dropdown') && !e.target.closest('#av') && !e.target.closest('#bell')) $$('.dropdown').forEach(d => d.remove()); });
    $('#mt').onclick = e => { e.stopPropagation(); $('.side').classList.toggle('open'); };
    $('#av').onclick = () => dropdown($('#av'), `<div class="item"><b>${esc(s.name)}</b><br><small>${esc(s.username)}</small></div><a href="#/m/admin">Người dùng</a><a href="#/p/settings">Thiết lập công ty</a><a href="#/p/backup">Sao lưu / Khôi phục</a><a id="lo">Đăng xuất</a>`, () => { $('#lo').onclick = () => { Store.clearSession(); location.hash = ''; location.reload(); }; });
    $('#bell').onclick = () => {
      const n = notifications();
      dropdown($('#bell'), n.length ? n.map(x => `<a href="${x.href}">${x.text}</a>`).join('') : '<div class="item">Không có thông báo</div>');
    };
    refreshBell();
  }
  function dropdown(anchor, html, after) {
    $$('.dropdown').forEach(d => d.remove());
    const d = document.createElement('div'); d.className = 'dropdown'; d.innerHTML = html; anchor.appendChild(d); after && after();
  }
  function closeFly() { const f = $('#fly'); if (f) f.classList.remove('show'); $$('.side .nav-btn').forEach(b => b.classList.remove('on')); }
  function notifications() {
    const n = [];
    const pc = Store.all('cost_request').filter(r => r.status === 'Chờ duyệt').length;
    const pr = Store.all('revenue').filter(r => r.status === 'Chờ xác nhận').length;
    const ex = expiries().filter(x => x.days <= 30).length;
    const inc = Store.all('incident').filter(r => r.status === 'Chưa xử lý').length;
    if (pc) n.push({ text: `<b>${pc}</b> đề nghị chi phí chờ duyệt`, href: '#/m/cost_request' });
    if (pr) n.push({ text: `<b>${pr}</b> doanh thu chờ xác nhận`, href: '#/m/revenue' });
    if (ex) n.push({ text: `<b>${ex}</b> giấy tờ sắp/đã hết hạn`, href: '#/p/rpt_expiry' });
    if (inc) n.push({ text: `<b>${inc}</b> sự cố chưa xử lý`, href: '#/m/incident' });
    return n;
  }
  function refreshBell() { const b = $('#bn'); if (!b) return; const c = notifications().length; b.textContent = c || ''; b.style.display = c ? '' : 'none'; }

  /* ---------- List (CRUD) ---------- */
  function listState(key) { return (state[key] = state[key] || { f: {}, sort: null, dir: 1, page: 1, size: 50, sel: new Set() }); }
  function filtered(mod, st) {
    const cols = mod.fields.filter(fd => fd.list !== false);
    let rows = Store.all(mod.key).slice();
    Object.entries(st.f).forEach(([k, q]) => {
      if (!q) return; const fd = cols.find(c => c.k === k); if (!fd) return;
      const ql = q.toLowerCase();
      rows = rows.filter(r => {
        const v = rawValue(fd, r);
        if (fd.type === 'select') return v === q;
        if (fd.type === 'money' || fd.type === 'num') { const m = q.match(/^(>=|<=|>|<|=)?\s*([\d.,]+)$/); if (!m) return true; const n = U.num(m[2]); const x = U.num(v); return ({ '>': x > n, '<': x < n, '>=': x >= n, '<=': x <= n }[m[1]] ?? x === n); }
        if (fd.type === 'date' || fd.type === 'datetime') return String(v).startsWith(q) || U.date(v).includes(q);
        return String(v).toLowerCase().includes(ql);
      });
    });
    if (st.sort) { const fd = mod.fields.find(c => c.k === st.sort); rows.sort((a, b) => { const x = rawValue(fd, a), y = rawValue(fd, b); return (typeof x === 'number' || fd.type === 'money' || fd.type === 'num' ? U.num(x) - U.num(y) : String(x).localeCompare(String(y), 'vi')) * st.dir; }); }
    return { rows, cols };
  }
  function renderList(mod) {
    const st = listState(mod.key); const content = $('.content');
    const ro = mod.readonlyModule;
    content.innerHTML = `
      <div class="ph"><h1>${esc(mod.title)}</h1><a class="icon-btn" id="rf" title="Làm mới" style="width:30px;border:0;background:none">${ic('refresh')}</a><div class="grow"></div>
        ${(mod.headerActions || []).map(a => HEADER_ACTIONS[a].btn).join('')}
        <button class="icon-btn" id="bdel" title="Xoá các dòng đã chọn" style="display:none;color:var(--red)">${ic('trash')}</button>
        ${ro ? '' : `<button class="icon-btn" id="add" title="Thêm mới">${ic('plus')}</button>`}
        <button class="icon-btn" id="csv" title="Xuất Excel (CSV)">${ic('dl')}</button>
        <button class="icon-btn" id="prt" title="In">${ic('print')}</button>
        ${mod.note ? `<div class="note">${esc(mod.note)}</div>` : ''}
      </div>
      <div class="tbl-wrap"><table class="grid" id="g"></table></div>
      <div class="foot"><span>Tổng kết quả <b id="cnt"></b></span><div class="grow"></div>Số bản ghi
        <select class="input" id="ps" style="width:auto">${[20, 50, 100, 500].map(n => `<option ${n === st.size ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <span class="pager" id="pg"></span></div>`;
    const draw = () => {
      const { rows, cols } = filtered(mod, st);
      const pages = Math.max(1, Math.ceil(rows.length / st.size)); if (st.page > pages) st.page = pages;
      const view = rows.slice((st.page - 1) * st.size, st.page * st.size);
      const sums = cols.filter(c => c.sum);
      const allSel = view.length && view.every(r => st.sel.has(r.id));
      $('#g').innerHTML = `
        <thead><tr><th style="width:30px"><input type="checkbox" id="sa" ${allSel ? 'checked' : ''}></th><th>Hành động</th>
          ${cols.map(c => `<th data-s="${c.k}" class="${c.type === 'money' || c.type === 'num' ? 'num' : ''}">${esc(c.label)}<span class="sort">${st.sort === c.k ? (st.dir > 0 ? '▲' : '▼') : '⇅'}</span></th>`).join('')}
          <th data-s="created_by">Người tạo</th><th data-s="created_at">Ngày tạo</th></tr>
        <tr class="filters"><th></th><th></th>${cols.map(c => `<th>${filterInput(c, st.f[c.k])}</th>`).join('')}<th></th><th></th></tr></thead>
        <tbody>${view.length ? view.map(r => `<tr data-id="${r.id}" class="${st.sel.has(r.id) ? 'sel' : ''}"><td><input type="checkbox" class="cs" ${st.sel.has(r.id) ? 'checked' : ''}></td>
          <td><div class="acts">${ro ? '' : `<a data-a="edit" title="Sửa">${ic('edit')}</a><a data-a="dup" title="Sao chép">${ic('copy')}</a><a data-a="del" class="del" title="Xoá">${ic('trash')}</a>`}${(mod.rowActions || []).map(a => ROW_ACTIONS[a].btn(r)).join('')}</div></td>
          ${cols.map(c => `<td class="${c.type === 'money' || c.type === 'num' ? 'num' : ''}" title="${esc(String(rawValue(c, r)).slice(0, 200))}">${cell(c, r)}</td>`).join('')}
          <td>${esc(r.created_by)}</td><td>${U.date(r.created_at)}</td></tr>`).join('') : `<tr><td colspan="${cols.length + 4}"><div class="empty">Không có dữ liệu</div></td></tr>`}</tbody>
        ${sums.length && rows.length ? `<tfoot><tr><td></td><td>Tổng</td>${cols.map(c => `<td class="num">${c.sum ? U.money(rows.reduce((s, r) => s + U.num(rawValue(c, r)), 0)) : ''}</td>`).join('')}<td></td><td></td></tr></tfoot>` : ''}`;
      $('#cnt').textContent = rows.length;
      $('#pg').innerHTML = `<a data-p="${Math.max(1, st.page - 1)}">«</a><b>${(st.page - 1) * st.size + (view.length ? 1 : 0)} - ${(st.page - 1) * st.size + view.length}</b><a data-p="${Math.min(pages, st.page + 1)}">»</a>`;
      $('#bdel').style.display = st.sel.size && !ro ? '' : 'none';
      // events
      $$('#g thead th[data-s]').forEach(th => th.onclick = () => { const k = th.dataset.s; if (st.sort === k) st.dir *= -1; else { st.sort = k; st.dir = 1; } if (!mod.fields.find(c => c.k === k)) { st.sort = null; } draw(); });
      $$('#g .filters [data-f]').forEach(inp => {
        const ev = inp.tagName === 'SELECT' ? 'change' : 'input';
        inp.addEventListener(ev, () => { st.f[inp.dataset.f] = inp.value; st.page = 1; clearTimeout(inp._t); inp._t = setTimeout(() => { const pos = inp.selectionStart; const k = inp.dataset.f; draw(); const ni = $(`#g [data-f="${k}"]`); if (ni && ni.tagName === 'INPUT') { ni.focus(); try { ni.setSelectionRange(pos, pos); } catch (e) {} } }, ev === 'input' ? 250 : 0); });
      });
      $('#sa').onchange = e => { view.forEach(r => e.target.checked ? st.sel.add(r.id) : st.sel.delete(r.id)); draw(); };
      $$('#g .cs').forEach(cb => cb.onchange = () => { const id = cb.closest('tr').dataset.id; cb.checked ? st.sel.add(id) : st.sel.delete(id); draw(); });
      $$('#g tbody [data-a]').forEach(a => a.onclick = () => {
        const id = a.closest('tr').dataset.id; const r = Store.get(mod.key, id); const act = a.dataset.a;
        if (act === 'edit') openForm(mod, r, draw);
        else if (act === 'dup') { const c = Object.assign({}, r); delete c.id; const cf = mod.fields.find(x => x.type === 'code'); if (cf) c[cf.k] = ''; openForm(mod, c, draw, true); }
        else if (act === 'del') { if (confirm('Chuyển bản ghi này vào thùng rác? (Có thể khôi phục trong Quản trị → Thùng rác)')) { Store.remove(mod.key, id); st.sel.delete(id); toast('Đã chuyển vào thùng rác'); draw(); refreshBell(); } }
        else if (ROW_ACTIONS[act]) ROW_ACTIONS[act].run(r, draw);
      });
      $$('#g tbody tr[data-id]').forEach(tr => tr.ondblclick = () => !ro && openForm(mod, Store.get(mod.key, tr.dataset.id), draw));
      $$('#pg [data-p]').forEach(a => a.onclick = () => { st.page = +a.dataset.p; draw(); });
    };
    $('#ps').onchange = e => { st.size = +e.target.value; st.page = 1; draw(); };
    $('#rf').onclick = () => { st.f = {}; st.sel.clear(); draw(); };
    if ($('#add')) $('#add').onclick = () => openForm(mod, null, draw);
    $('#csv').onclick = () => exportCSV(mod, filtered(mod, st));
    $('#prt').onclick = () => window.print();
    $('#bdel').onclick = () => { if (confirm(`Chuyển ${st.sel.size} bản ghi đã chọn vào thùng rác?`)) { st.sel.forEach(id => Store.remove(mod.key, id)); st.sel.clear(); toast('Đã chuyển vào thùng rác'); draw(); refreshBell(); } };
    (mod.headerActions || []).forEach(a => { const b = $('#ha_' + a); if (b) b.onclick = () => HEADER_ACTIONS[a].run(draw); });
    content.onclick = e => { const img = e.target.closest('[data-zoom]'); if (img) showImage(img.src); };
    draw();
  }
  function filterInput(c, v) {
    v = v || '';
    if (c.type === 'select') return `<select data-f="${c.k}"><option value="">Chọn</option>${c.options.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    if (c.type === 'image') return '';
    const ph = c.type === 'money' || c.type === 'num' ? '>=, <, =' : c.type === 'date' ? 'yyyy-mm' : '';
    return `<input data-f="${c.k}" value="${esc(v)}" placeholder="${ph}">`;
  }
  function exportCSV(mod, { rows, cols }) {
    const head = cols.filter(c => c.type !== 'image').concat([{ k: 'created_by', label: 'Người tạo' }, { k: 'created_at', label: 'Ngày tạo' }]);
    const q = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
    const lines = [head.map(c => q(c.label)).join(',')].concat(rows.map(r => head.map(c => q(c.type ? rawValue(c, r) : r[c.k])).join(',')));
    download(mod.key + '_' + U.today() + '.csv', '﻿' + lines.join('\r\n'), 'text/csv');
  }
  function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
  function showImage(src) { modal(`<div class="modal"><div class="modal-h"><h3>Chứng từ</h3><button class="x" data-close>×</button></div><div class="modal-b" style="text-align:center"><img src="${src}" style="max-width:100%"></div></div>`); }

  /* ---------- Modal + Form ---------- */
  function modal(html, onOpen) {
    const root = $('#modal-root'); root.innerHTML = `<div class="modal-bg">${html}</div>`;
    const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', esc_); };
    const esc_ = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc_);
    $$('[data-close]', root).forEach(b => b.onclick = close);
    $('.modal-bg', root).addEventListener('mousedown', e => { if (e.target.classList.contains('modal-bg')) close(); });
    onOpen && onOpen(root, close); return close;
  }
  function fieldHTML(fd, v, ro) {
    const req = fd.required ? ' <span class="req">*</span>' : '';
    const name = `name="${fd.k}"`; const r = fd.readonly || ro ? 'readonly' : '';
    let inp;
    switch (fd.type) {
      case 'textarea': inp = `<textarea ${name} rows="2" ${r}>${esc(v)}</textarea>`; break;
      case 'select': inp = `<select ${name} ${r ? 'disabled' : ''}><option value=""></option>${fd.options.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`; break;
      case 'ref': {
        const opts = Store.all(fd.ref).slice().sort((a, b) => String(refLabel(fd, a.id)).localeCompare(String(refLabel(fd, b.id)), 'vi'));
        inp = `<select ${name} ${r ? 'disabled' : ''}><option value=""></option>${opts.map(o => `<option value="${o.id}" ${o.id === v ? 'selected' : ''}>${esc(refLabel(fd, o.id))}</option>`).join('')}</select>`; break;
      }
      case 'refs': { const set = new Set(v || []); inp = `<div class="multi" data-refs="${fd.k}">${Store.all(fd.ref).slice(0, 300).map(o => `<label><input type="checkbox" value="${o.id}" ${set.has(o.id) ? 'checked' : ''}> ${esc(refLabel(fd, o.id))}</label>`).join('') || '<i>Chưa có dữ liệu</i>'}</div>`; break; }
      case 'money': inp = `<input ${name} inputmode="numeric" data-money value="${v === '' || v == null ? '' : U.money(v)}" ${r}>`; break;
      case 'num': inp = `<input ${name} type="number" step="any" value="${esc(v)}" ${r}>`; break;
      case 'date': inp = `<input ${name} type="date" value="${esc(String(v || '').slice(0, 10))}" ${r}>`; break;
      case 'datetime': inp = `<input ${name} type="datetime-local" value="${esc(v)}" ${r}>`; break;
      case 'password': inp = `<input ${name} type="password" value="${esc(v)}" autocomplete="new-password">`; break;
      case 'image': inp = `<div class="img-field"><input type="file" accept="image/*" data-img="${fd.k}"><input type="hidden" ${name} value="${esc(v)}">${v ? Store.img(v, `data-prev="${fd.k}"`) : `<img style="display:none" data-prev="${fd.k}">`}${v ? `<a data-clr="${fd.k}">Xoá ảnh</a>` : ''}</div>`; break;
      case 'code': inp = `<input ${name} value="${esc(v)}" placeholder="Tự động" ${r}>`; break;
      default: inp = `<input ${name} value="${esc(v)}" ${r}>`;
    }
    return `<div class="field ${fd.type === 'textarea' || fd.type === 'refs' || fd.type === 'image' ? 'wide' : ''}"><label>${esc(fd.label)}${req}</label>${inp}</div>`;
  }
  function readForm(mod, form, base) {
    const rec = Object.assign({}, base);
    mod.fields.forEach(fd => {
      if (fd.virtual) return;
      if (fd.type === 'refs') { rec[fd.k] = $$(`[data-refs="${fd.k}"] input:checked`, form).map(i => i.value); return; }
      const el = form.elements[fd.k]; if (!el) return;
      let v = el.value;
      if (fd.type === 'money') v = el.value === '' ? '' : U.num(el.value);
      else if (fd.type === 'num') v = el.value === '' ? '' : Number(el.value);
      rec[fd.k] = v;
    });
    return applyCalc(mod, rec);
  }
  function openForm(mod, rec, after, isDup) {
    const editing = rec && rec.id && !isDup;
    const data = rec ? Object.assign({}, rec) : {};
    if (!rec) mod.fields.forEach(fd => { data[fd.k] = defVal(fd); });
    applyCalc(mod, data);
    modal(`<form class="modal" id="mf" novalidate>
      <div class="modal-h"><h3>${editing ? 'Sửa' : 'Thêm mới'} ${esc(mod.title.toLowerCase())}</h3><button type="button" class="x" data-close>×</button></div>
      <div class="modal-b"><div class="form-grid">${mod.fields.filter(fd => !fd.virtual).map(fd => fieldHTML(fd, data[fd.k] ?? '')).join('')}</div><div class="err" id="ferr"></div></div>
      <div class="modal-f"><button type="button" class="btn" data-close>Huỷ</button>${editing ? '' : '<button type="submit" class="btn" data-more>Lưu &amp; thêm mới</button>'}<button type="submit" class="btn primary">Lưu</button></div></form>`,
      (root, close) => {
        const form = $('#mf', root);
        const recalc = () => { const r = readForm(mod, form, data); mod.fields.forEach(fd => { if (fd.calc && form.elements[fd.k]) form.elements[fd.k].value = fd.type === 'money' ? U.money(r[fd.k]) : r[fd.k]; }); };
        form.addEventListener('input', e => { if (e.target.dataset.money !== undefined) { const n = U.num(e.target.value); e.target.value = e.target.value === '' ? '' : U.money(n); } recalc(); });
        form.addEventListener('change', recalc);
        $$('[data-img]', form).forEach(inp => inp.onchange = async () => {
          const file = inp.files[0]; if (!file) return; const url = await U.resizeImage(file);
          const ref = await Store.Files.put(url);
          form.elements[inp.dataset.img].value = ref; const pv = $(`[data-prev="${inp.dataset.img}"]`, form); pv.src = url; pv.style.display = '';
        });
        $$('[data-clr]', form).forEach(a => a.onclick = () => { form.elements[a.dataset.clr].value = ''; $(`[data-prev="${a.dataset.clr}"]`, form).style.display = 'none'; });
        let more = false; $$('button[type=submit]', form).forEach(b => b.onclick = () => { more = b.hasAttribute('data-more'); });
        // Tự điền tài xế theo xe
        if (form.elements.vehicle_id && form.elements.driver_id) form.elements.vehicle_id.addEventListener('change', () => { const v = Store.get('vehicle', form.elements.vehicle_id.value); if (v && v.driver_id && !form.elements.driver_id.value) form.elements.driver_id.value = v.driver_id; });
        form.onsubmit = e => {
          e.preventDefault();
          const r = readForm(mod, form, data);
          const miss = mod.fields.filter(fd => fd.required && (r[fd.k] === '' || r[fd.k] == null || (Array.isArray(r[fd.k]) && !r[fd.k].length)));
          if (miss.length) { $('#ferr', root).textContent = 'Vui lòng nhập: ' + miss.map(m => m.label).join(', '); return; }
          const cf = mod.fields.find(fd => fd.type === 'code');
          if (cf && !r[cf.k]) r[cf.k] = Store.nextCode(mod.key, cf.prefix);
          if (editing) { Store.update(mod.key, rec.id, r); toast('Đã lưu'); }
          else { delete r.id; Store.insert(mod.key, r); toast('Đã thêm'); }
          if (mod.key === 'admin' || mod.key === 'role') { /* no-op */ }
          close(); after && after(); refreshBell();
          if (more) openForm(mod, null, after);
        };
      });
  }

  /* ---------- Row / header actions ---------- */
  const ROW_ACTIONS = {
    approveCost: {
      btn: r => r.status === 'Chờ duyệt' ? `<a data-a="approveCost" title="Duyệt / từ chối" style="color:var(--ok)">${ic('check')}</a>` : (r.status === 'Đã duyệt' ? `<a data-a="approveCost" title="Đánh dấu đã chi" style="color:var(--ok)">${ic('dollar')}</a>` : ''),
      run(r, draw) {
        if (!canApprove()) return alert('Vai trò của bạn không có quyền duyệt chi phí.');
        if (r.status === 'Đã duyệt') { if (confirm(`Xác nhận đã chi ${U.money(r.amount)} đ cho ${Store.label('driver', r.driver_id) || 'đề nghị này'}?`)) { Store.update('cost_request', r.id, { status: 'Đã chi' }); toast('Đã chi'); draw(); } return; }
        reviewModal('Duyệt đề nghị chi phí', r, [
          ['Mã', r.code], ['Xe', Store.label('vehicle', r.vehicle_id)], ['Tài xế', Store.label('driver', r.driver_id)], ['Khoản mục', Store.label('cost_category', r.category_id)],
          ['Số tiền', `<b>${U.money(r.amount)} đ</b>`], ['Ngày', U.date(r.date)], ['Nội dung', esc(r.description)], ['Hình thức', esc(r.pay_method)]
        ], r.image, ok => {
          const s = session();
          Store.update('cost_request', r.id, ok === true ? { status: 'Đã duyệt', approver: s.name, approved_at: U.now(), reject_reason: '' } : { status: 'Từ chối', approver: s.name, approved_at: U.now(), reject_reason: ok });
          toast(ok === true ? 'Đã duyệt' : 'Đã từ chối'); draw(); refreshBell();
        });
      }
    },
    confirmRevenue: {
      btn: r => r.status === 'Chờ xác nhận' ? `<a data-a="confirmRevenue" title="Xác nhận doanh thu" style="color:var(--ok)">${ic('check')}</a>` : '',
      run(r, draw) {
        reviewModal('Xác nhận doanh thu', r, [['Mã', r.code], ['Xe', Store.label('vehicle', r.vehicle_id)], ['Tài xế', Store.label('driver', r.driver_id)], ['Khách hàng', Store.label('customer', r.customer_id)], ['Loại', r.type], ['Số tiền', `<b>${U.money(r.amount)} đ</b>`], ['Hình thức thu', r.collect], ['Ghi chú', esc(r.note)]], r.image,
          ok => { Store.update('revenue', r.id, { status: ok === true ? 'Đã xác nhận' : 'Từ chối', note: ok === true ? r.note : ((r.note ? r.note + ' | ' : '') + 'Từ chối: ' + ok) }); toast('Đã cập nhật'); draw(); refreshBell(); });
      }
    },
    approveRoute: {
      btn: r => r.approve !== 'Đã phê duyệt' && r.status === 'Hoàn thành' ? `<a data-a="approveRoute" title="Phê duyệt chuyến" style="color:var(--ok)">${ic('check')}</a>` : '',
      run(r, draw) { Store.update('route', r.id, { approve: 'Đã phê duyệt' }); toast('Đã phê duyệt chuyến ' + r.code); draw(); }
    },
    toRevenue: {
      btn: r => r.status === 'Hoàn thành' && !Store.all('revenue').some(x => x.order_id === r.id) ? `<a data-a="toRevenue" title="Ghi nhận doanh thu" style="color:var(--ok)">${ic('dollar')}</a>` : '',
      run(r, draw) {
        if (!r.vehicle_id) return alert('Đơn hàng chưa gán xe.');
        Store.insert('revenue', { code: Store.nextCode('revenue', 'DT'), date: r.drop_date || r.pickup_date || U.today(), type: 'Cước vận chuyển', vehicle_id: r.vehicle_id, driver_id: r.driver_id, customer_id: r.customer_id, order_id: r.id, amount: U.num(r.revenue), vat: r.vat || '8%', total: U.num(r.revenue) + Math.round(U.num(r.revenue) * TMG_vatRate(r.vat)), collect: 'Công nợ', status: 'Đã xác nhận', source: 'Web' });
        toast('Đã ghi nhận doanh thu cho đơn ' + r.order_no); draw();
      }
    },
    vehiclePL: { btn: r => `<a data-a="vehiclePL" title="Lãi lỗ xe này" style="color:var(--ok)">${ic('chart')}</a>`, run(r) { location.hash = '#/p/rpt_vehicle/' + r.id; } }
  };
  const HEADER_ACTIONS = {
    buildInvoice: {
      btn: `<button class="btn" id="ha_buildInvoice">${ic('doc')} Tạo bảng kê từ đơn hàng</button>`,
      run(draw) {
        const m = U.today().slice(0, 7);
        modal(`<form class="modal sm" id="bf"><div class="modal-h"><h3>Tạo bảng kê</h3><button type="button" class="x" data-close>×</button></div>
          <div class="modal-b"><div class="field"><label>Khách hàng</label><select name="c" required>${Store.all('customer').map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Từ ngày</label><input type="date" name="f" value="${m}-01"></div><div class="field"><label>Đến ngày</label><input type="date" name="t" value="${U.today()}"></div>
          <div class="field"><label>VAT</label><select name="v"><option>8%</option><option>10%</option><option>0%</option><option>Không chịu thuế</option></select></div><div class="hint">Lấy các đơn hàng "Hoàn thành" của khách hàng trong khoảng ngày.</div></div>
          <div class="modal-f"><button type="button" class="btn" data-close>Huỷ</button><button class="btn primary">Tạo</button></div></form>`, (root, close) => {
          $('#bf', root).onsubmit = e => {
            e.preventDefault(); const fd = new FormData(e.target);
            const os = Store.all('order').filter(o => o.customer_id === fd.get('c') && o.status === 'Hoàn thành' && (o.drop_date || o.pickup_date) >= fd.get('f') && (o.drop_date || o.pickup_date) <= fd.get('t'));
            if (!os.length) return alert('Không có đơn hàng phù hợp');
            const amount = os.reduce((s, o) => s + U.num(o.revenue), 0);
            const r = applyCalc(M.invoice, { code: Store.nextCode('invoice', 'BK'), from: fd.get('f'), to: fd.get('t'), customer_id: fd.get('c'), status: 'Khởi tạo', amount, vat: fd.get('v'), pay_status: 'Chưa thanh toán', order_ids: os.map(o => o.id) });
            Store.insert('invoice', r); close(); toast(`Đã tạo bảng kê ${r.code} gồm ${os.length} đơn`); draw();
          };
        });
      }
    }
  };
  function reviewModal(title, r, rows, img, done) {
    modal(`<div class="modal sm"><div class="modal-h"><h3>${title}</h3><button class="x" data-close>×</button></div>
      <div class="modal-b"><table class="grid" style="width:100%">${rows.map(x => `<tr><td style="color:var(--ink-2);width:120px">${x[0]}</td><td style="white-space:normal">${x[1] || ''}</td></tr>`).join('')}</table>
      ${img ? `<div style="margin-top:10px">${Store.img(img, 'style="max-width:100%;border-radius:6px"')}</div>` : ''}
      <div class="field" style="margin-top:12px"><label>Lý do (khi từ chối)</label><input id="rr"></div></div>
      <div class="modal-f"><button class="btn" id="rj" style="color:var(--bad)">${ic('x')} Từ chối</button><button class="btn ok" id="ap">${ic('check')} Duyệt / Xác nhận</button></div></div>`,
      (root, close) => {
        $('#ap', root).onclick = () => { close(); done(true); };
        $('#rj', root).onclick = () => { const why = $('#rr', root).value.trim(); if (!why) { $('#rr', root).focus(); $('#rr', root).placeholder = 'Nhập lý do từ chối'; return; } close(); done(why); };
      });
  }

  /* ---------- Charts ---------- */
  function barChart(months, series) {
    // grouped bars, one y-axis (VND), hover tooltip
    const W = 560, H = 240, L = 56, B = 26, T = 10, R = 8;
    const max = Math.max(1, ...series.flatMap(s => s.values)); const nice = niceMax(max);
    const gw = (W - L - R) / months.length; const bw = Math.min(26, (gw - 14) / series.length);
    const y = v => T + (H - T - B) * (1 - v / nice);
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
    for (let i = 0; i <= 4; i++) { const v = nice * i / 4; svg += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#e8e9ec"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#5b6170">${short(v)}</text>`; }
    months.forEach((m, i) => {
      const x0 = L + gw * i + (gw - bw * series.length - 2 * (series.length - 1)) / 2;
      series.forEach((s, j) => { const v = s.values[i]; const x = x0 + j * (bw + 2); const h = Math.max(0, y(0) - y(v)); svg += `<path d="${roundTop(x, y(v), bw, h)}" fill="${s.color}"/>`; });
      svg += `<rect x="${L + gw * i}" y="${T}" width="${gw}" height="${H - T - B}" fill="transparent" data-i="${i}"/>`;
      svg += `<text x="${L + gw * i + gw / 2}" y="${H - 10}" text-anchor="middle" font-size="11" fill="#5b6170">${m.slice(5)}/${m.slice(2, 4)}</text>`;
    });
    svg += `<line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" stroke="#9aa0ad"/></svg>`;
    const id = 'c' + U.uid();
    setTimeout(() => {
      const box = document.getElementById(id); if (!box) return; const tt = $('.tt', box);
      $$('rect[data-i]', box).forEach(r => {
        r.onmousemove = e => { const i = +r.dataset.i; const rect = box.getBoundingClientRect(); tt.style.display = 'block'; tt.innerHTML = `<b>Tháng ${months[i].slice(5)}/${months[i].slice(0, 4)}</b><br>` + series.map(s => `<span style="color:${s.color}">■</span> ${s.name}: <b>${U.money(s.values[i])}</b>`).join('<br>') + (series.length === 2 ? `<br>Lợi nhuận: <b class="${series[0].values[i] - series[1].values[i] >= 0 ? 'pos' : 'neg'}">${U.money(series[0].values[i] - series[1].values[i])}</b>` : ''); let lx = e.clientX - rect.left + 12; if (lx + tt.offsetWidth > rect.width) lx = e.clientX - rect.left - tt.offsetWidth - 12; tt.style.left = lx + 'px'; tt.style.top = (e.clientY - rect.top - 10) + 'px'; r.setAttribute('fill', 'rgba(0,0,0,.04)'); };
        r.onmouseleave = () => { tt.style.display = 'none'; r.setAttribute('fill', 'transparent'); };
      });
    });
    return `<div class="legend">${series.map(s => `<span style="--c:${s.color}">${s.name}</span>`).join('')}</div><div class="chart" id="${id}">${svg}<div class="tt"></div></div>`;
  }
  const roundTop = (x, y, w, h) => { const r = Math.min(4, h, w / 2); return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`; };
  const niceMax = v => { const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };
  const short = v => v >= 1e9 ? (v / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tỷ' : v >= 1e6 ? (v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' tr' : U.money(v);
  const hbars = (items, color) => { const max = Math.max(1, ...items.map(i => i[1])); return items.map(([l, v]) => `<div class="hbar"><span title="${esc(l)}" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(l)}</span><div class="track"><div class="fill" style="width:${v / max * 100}%;${color ? 'background:' + color : ''}"></div></div><span class="val">${U.money(v)}</span></div>`).join(''); };
  const pct = (a, b) => b ? (a / b * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + '%' : '—';
  const monthEnd = ym => { const [y, m] = ym.split('-').map(Number); return ym + '-' + String(new Date(y, m, 0).getDate()).padStart(2, '0'); };

  function expiries() {
    const out = []; const t = new Date(U.today());
    const add = (what, who, d, href) => { if (!d) return; const days = Math.round((new Date(d) - t) / 864e5); out.push({ what, who, d, days, href }); };
    Store.all('vehicle').forEach(v => { add('Đăng kiểm', v.plate, v.inspection_exp, '#/m/vehicle'); add('Bảo hiểm', v.plate, v.insurance_exp, '#/m/vehicle'); add('Phí đường bộ', v.plate, v.road_fee_exp, '#/m/vehicle'); });
    Store.all('driver').forEach(d => add('GPLX', d.name, d.license_exp, '#/m/driver'));
    Store.all('trailer').forEach(r => add('Đăng kiểm rơ moóc', r.plate, r.inspection_exp, '#/m/trailer'));
    return out.sort((a, b) => a.days - b.days);
  }

  /* ---------- Pages ---------- */
  const PAGES = {
    dashboard(el) {
      const ym = U.today().slice(0, 7);
      const cur = Store.finance({ from: ym + '-01', to: monthEnd(ym) });
      const prevYm = U.addMonths(ym, -1); const prev = Store.finance({ from: prevYm + '-01', to: monthEnd(prevYm) });
      const months = [...Array(6)].map((_, i) => U.addMonths(ym, i - 5));
      const fin = months.map(m => Store.finance({ from: m + '-01', to: monthEnd(m) }));
      const routes = Store.all('route'); const running = routes.filter(r => r.status === 'Đang chạy').length;
      const tripsM = routes.filter(r => U.month(r.pickup_date) === ym && r.status !== 'Hủy').length;
      const pend = Store.all('cost_request').filter(r => r.status === 'Chờ duyệt');
      const pendRev = Store.all('revenue').filter(r => r.status === 'Chờ xác nhận');
      const vehs = Store.all('vehicle');
      const byV = vehs.map(v => { const f = Store.finance({ from: ym + '-01', to: monthEnd(ym), vehicle: v.id }); return { v, ...f }; }).sort((a, b) => b.profit - a.profit);
      const delta = (a, b) => b ? `${a >= b ? '▲' : '▼'} ${pct(Math.abs(a - b), Math.abs(b))} so với tháng trước` : '';
      el.innerHTML = `<div class="ph"><h1>Tổng quan</h1><div class="grow"></div><span style="color:var(--ink-2)">Tháng ${ym.slice(5)}/${ym.slice(0, 4)}</span></div>
      <div class="pad">
        <div class="kpis">
          <div class="kpi click" data-go="#/m/revenue"><div class="l">Doanh thu tháng</div><div class="v">${U.money(cur.revenue)}</div><div class="s">${delta(cur.revenue, prev.revenue)}</div></div>
          <div class="kpi click" data-go="#/p/rpt_cat"><div class="l">Chi phí tháng</div><div class="v">${U.money(cur.cost)}</div><div class="s">${delta(cur.cost, prev.cost)}</div></div>
          <div class="kpi click" data-go="#/p/rpt_vehicle"><div class="l">Lợi nhuận gộp</div><div class="v ${cur.profit >= 0 ? 'pos' : 'neg'}">${U.money(cur.profit)}</div><div class="s">Biên LN: ${pct(cur.profit, cur.revenue)}</div></div>
          <div class="kpi click" data-go="#/m/route"><div class="l">Chuyến trong tháng</div><div class="v">${tripsM}</div><div class="s">${running} chuyến đang chạy</div></div>
          <div class="kpi click" data-go="#/m/cost_request"><div class="l">Đề nghị chi phí chờ duyệt</div><div class="v">${pend.length}</div><div class="s">${U.money(pend.reduce((s, r) => s + U.num(r.amount), 0))} đ</div></div>
          <div class="kpi click" data-go="#/m/revenue"><div class="l">Doanh thu chờ xác nhận</div><div class="v">${pendRev.length}</div><div class="s">${U.money(pendRev.reduce((s, r) => s + U.num(r.amount), 0))} đ</div></div>
        </div>
        <div class="cols">
          <div class="card"><h3>Doanh thu và chi phí 6 tháng (VNĐ)</h3>${barChart(months, [{ name: 'Doanh thu', color: 'var(--rev)', values: fin.map(f => f.revenue) }, { name: 'Chi phí', color: 'var(--cost)', values: fin.map(f => f.cost) }])}</div>
          <div class="card"><h3>Chi phí tháng này theo khoản mục</h3>${hbars(Object.entries(cur.rows.filter(r => r.kind === 'cost').reduce((a, r) => (a[r.cat] = (a[r.cat] || 0) + r.amount, a), {})).sort((a, b) => b[1] - a[1]).slice(0, 8), 'var(--cost)') || '<div class="empty">Chưa có chi phí</div>'}</div>
        </div>
        <div class="cols">
          <div class="card"><h3>Hiệu quả theo đầu xe — tháng này</h3><table class="grid" style="width:100%"><thead><tr><th>Biển số</th><th>Tài xế</th><th class="num">Doanh thu</th><th class="num">Chi phí</th><th class="num">Lợi nhuận</th><th class="num">Biên</th></tr></thead>
            <tbody>${byV.map(x => `<tr><td><a href="#/p/rpt_vehicle/${x.v.id}">${esc(x.v.plate)}</a></td><td>${esc(Store.label('driver', x.v.driver_id))}</td><td class="num">${U.money(x.revenue)}</td><td class="num">${U.money(x.cost)}</td><td class="num ${x.profit >= 0 ? 'pos' : 'neg'}">${U.money(x.profit)}</td><td class="num">${pct(x.profit, x.revenue)}</td></tr>`).join('')}</tbody></table></div>
          <div class="card"><h3>Cần xử lý</h3>${[
            ...pend.slice(0, 6).map(r => `<div class="hbar" style="grid-template-columns:1fr auto"><a href="#/m/cost_request">${esc(r.code)} · ${esc(Store.label('vehicle', r.vehicle_id))} · ${esc(Store.label('cost_category', r.category_id))}</a><b>${U.money(r.amount)}</b></div>`),
            ...expiries().filter(x => x.days <= 30).slice(0, 6).map(x => `<div class="hbar" style="grid-template-columns:1fr auto"><a href="${x.href}">${esc(x.what)} · ${esc(x.who)}</a>${chip(x.days < 0 ? 'Đã hết hạn' : 'Còn ' + x.days + ' ngày').replace('chip ', 'chip ' + (x.days < 0 ? 'bad ' : 'warn '))}</div>`)
          ].join('') || '<div class="empty">Không có việc tồn đọng 🎉</div>'}</div>
        </div>
        <div class="card"><h3>Trạng thái xe</h3><div class="kpis">${['Xe trống', 'Xe đang vận chuyển', 'Xe hỏng', 'Xe công an giữ'].map(s => `<div class="kpi"><div class="l">${s}</div><div class="v">${vehs.filter(v => v.state === s).length}</div></div>`).join('')}</div></div>
      </div>`;
      $$('[data-go]', el).forEach(k => k.onclick = () => location.hash = k.dataset.go);
    },

    board(el) {
      const st = ['Khởi tạo', 'Sẵn sàng', 'Chờ tài xế xác nhận', 'Chờ nhận hàng', 'Đang vận chuyển', 'Hoàn thành'];
      const os = Store.all('order').filter(o => o.status !== 'Hủy' && (o.status !== 'Hoàn thành' || o.pickup_date >= U.addMonths(U.today().slice(0, 7), 0)));
      el.innerHTML = `<div class="ph"><h1>Bảng điều vận</h1><div class="grow"></div><span class="note" style="width:auto">Bấm thẻ để sửa; kéo thả để đổi trạng thái</span></div>
        <div class="pad"><div class="board">${st.map(s => { const list = os.filter(o => o.status === s); return `<div class="col" data-st="${s}"><h4>${s}<span class="chip">${list.length}</span></h4>${list.map(o => `<div class="tcard" draggable="true" data-id="${o.id}"><b>${esc(o.order_no)}</b><br>${esc(Store.label('customer', o.customer_id))}<br>${esc(Store.label('location', o.pickup_location))} → ${esc(Store.label('location', o.drop_location))}<br>🚚 ${esc(Store.label('vehicle', o.vehicle_id, 'plate') || 'Chưa gán xe')} · ${U.date(o.pickup_date)}</div>`).join('')}</div>`; }).join('')}</div></div>`;
      $$('.tcard', el).forEach(c => { c.ondragstart = e => e.dataTransfer.setData('id', c.dataset.id); c.onclick = () => openForm(M.order, Store.get('order', c.dataset.id), () => PAGES.board(el)); });
      $$('.col', el).forEach(col => { col.ondragover = e => e.preventDefault(); col.ondrop = e => { e.preventDefault(); Store.update('order', e.dataTransfer.getData('id'), { status: col.dataset.st }); PAGES.board(el); }; });
    },

    rptVehicle(el, vid) {
      const ym = U.today().slice(0, 7);
      const st = PAGES._rv = PAGES._rv || { from: ym + '-01', to: monthEnd(ym) };
      const vehs = Store.all('vehicle');
      const draw = () => {
        const sel = vid && Store.get('vehicle', vid);
        const rows = (sel ? [sel] : vehs).map(v => {
          const f = Store.finance({ from: st.from, to: st.to, vehicle: v.id });
          const by = src => f.rows.filter(r => r.kind === 'cost' && r.src === src).reduce((s, r) => s + r.amount, 0);
          const rts = Store.all('route').filter(r => r.vehicle_id === v.id && r.pickup_date >= st.from && r.pickup_date <= st.to && r.status !== 'Hủy');
          const km = rts.reduce((s, r) => s + U.num(r.km_actual), 0);
          return { v, ...f, fuel: by('Nhiên liệu'), req: by('Đề nghị chi phí'), op: by('Chi phí vận hành'), rep: by('Sửa chữa'), trips: rts.length, km };
        });
        const T = k => rows.reduce((s, r) => s + r[k], 0);
        let detail = '';
        if (sel) {
          const f = rows[0];
          const cats = Object.entries(f.rows.filter(r => r.kind === 'cost').reduce((a, r) => (a[r.cat] = (a[r.cat] || 0) + r.amount, a), {})).sort((a, b) => b[1] - a[1]);
          detail = `<div class="cols"><div class="card"><h3>Cơ cấu chi phí — ${esc(sel.plate)}</h3>${hbars(cats, 'var(--cost)') || '<div class="empty">Không có chi phí</div>'}</div>
            <div class="card"><h3>Chỉ số</h3><table class="grid" style="width:100%">
            <tr><td>Doanh thu / chuyến</td><td class="num">${U.money(f.trips ? f.revenue / f.trips : 0)}</td></tr>
            <tr><td>Chi phí / km</td><td class="num">${U.money(f.km ? Math.round(f.cost / f.km) : 0)}</td></tr>
            <tr><td>Doanh thu / km</td><td class="num">${U.money(f.km ? Math.round(f.revenue / f.km) : 0)}</td></tr>
            <tr><td>Nhiên liệu / doanh thu</td><td class="num">${pct(f.fuel, f.revenue)}</td></tr>
            <tr><td>Lít dầu / 100km</td><td class="num">${(() => { const l = Store.all('route_fuel').filter(r => r.vehicle_id === sel.id && r.date >= st.from && r.date <= st.to).reduce((s, r) => s + U.num(r.liters), 0); return f.km ? (l / f.km * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : '—'; })()} (ĐM: ${sel.fuel_norm || '—'})</td></tr></table></div></div>
            <div class="card"><h3>Chi tiết phát sinh</h3><div style="max-height:420px;overflow:auto"><table class="grid" style="width:100%"><thead><tr><th>Ngày</th><th>Loại</th><th>Nguồn</th><th>Khoản mục</th><th class="num">Thu</th><th class="num">Chi</th></tr></thead><tbody>
            ${f.rows.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).map(r => `<tr><td>${U.date(r.date)}</td><td>${r.kind === 'rev' ? chip('Doanh thu').replace('chip', 'chip ok') : chip('Chi phí').replace('chip', 'chip warn')}</td><td>${esc(r.src || 'Doanh thu')}</td><td>${esc(r.cat)}</td><td class="num">${r.kind === 'rev' ? U.money(r.amount) : ''}</td><td class="num">${r.kind === 'cost' ? U.money(r.amount) : ''}</td></tr>`).join('')}</tbody></table></div></div>`;
        }
        $('#rv', el).innerHTML = `<div class="card" style="padding:0;overflow:auto"><table class="grid" style="width:100%"><thead><tr><th>Biển số</th><th>Tài xế</th><th class="num">Số chuyến</th><th class="num">Km</th><th class="num">Doanh thu</th><th class="num">Nhiên liệu</th><th class="num">Đề nghị CP</th><th class="num">Sửa chữa</th><th class="num">CP vận hành</th><th class="num">Tổng chi phí</th><th class="num">Lợi nhuận</th><th class="num">Biên LN</th></tr></thead>
          <tbody>${rows.map(r => `<tr><td><a href="#/p/rpt_vehicle/${r.v.id}">${esc(r.v.plate)}</a></td><td>${esc(Store.label('driver', r.v.driver_id))}</td><td class="num">${r.trips}</td><td class="num">${U.money(r.km)}</td><td class="num">${U.money(r.revenue)}</td><td class="num">${U.money(r.fuel)}</td><td class="num">${U.money(r.req)}</td><td class="num">${U.money(r.rep)}</td><td class="num">${U.money(r.op)}</td><td class="num">${U.money(r.cost)}</td><td class="num ${r.profit >= 0 ? 'pos' : 'neg'}"><b>${U.money(r.profit)}</b></td><td class="num">${pct(r.profit, r.revenue)}</td></tr>`).join('')}</tbody>
          ${sel ? '' : `<tfoot><tr><td>Tổng</td><td></td><td class="num">${T('trips')}</td><td class="num">${U.money(T('km'))}</td><td class="num">${U.money(T('revenue'))}</td><td class="num">${U.money(T('fuel'))}</td><td class="num">${U.money(T('req'))}</td><td class="num">${U.money(T('rep'))}</td><td class="num">${U.money(T('op'))}</td><td class="num">${U.money(T('cost'))}</td><td class="num">${U.money(T('profit'))}</td><td class="num">${pct(T('profit'), T('revenue'))}</td></tr></tfoot>`}</table></div>` + detail;
      };
      el.innerHTML = `<div class="ph"><h1>Lãi lỗ theo đầu xe</h1><div class="grow"></div>
        <div class="toolbar"><select class="input" id="vv"><option value="">Tất cả xe</option>${vehs.map(v => `<option value="${v.id}" ${v.id === vid ? 'selected' : ''}>${esc(v.plate)}</option>`).join('')}</select>
        <input type="date" class="input" id="f1" value="${st.from}"> → <input type="date" class="input" id="f2" value="${st.to}">
        <button class="btn" data-q="m">Tháng này</button><button class="btn" data-q="pm">Tháng trước</button><button class="btn" data-q="y">Năm nay</button><button class="btn" id="px">${ic('dl')} CSV</button></div>
        <div class="note">Doanh thu = phiếu doanh thu đã xác nhận. Chi phí = nhiên liệu + đề nghị chi phí đã duyệt + phiếu sửa chữa đã duyệt + chi phí vận hành.</div></div><div class="pad" id="rv"></div>`;
      $('#vv', el).onchange = e => location.hash = '#/p/rpt_vehicle' + (e.target.value ? '/' + e.target.value : '');
      $('#f1', el).onchange = e => { st.from = e.target.value; draw(); }; $('#f2', el).onchange = e => { st.to = e.target.value; draw(); };
      $$('[data-q]', el).forEach(b => b.onclick = () => { const q = b.dataset.q; const m = q === 'pm' ? U.addMonths(ym, -1) : ym; if (q === 'y') { st.from = ym.slice(0, 4) + '-01-01'; st.to = ym.slice(0, 4) + '-12-31'; } else { st.from = m + '-01'; st.to = monthEnd(m); } $('#f1', el).value = st.from; $('#f2', el).value = st.to; draw(); });
      $('#px', el).onclick = () => { const t = $('#rv table', el); const lines = [...t.rows].map(tr => [...tr.cells].map(c => '"' + c.innerText.replace(/"/g, '""') + '"').join(',')); download('lai_lo_dau_xe_' + st.from + '_' + st.to + '.csv', '﻿' + lines.join('\r\n'), 'text/csv'); };
      draw();
    },

    rptMonth(el) {
      const ym = U.today().slice(0, 7);
      const months = [...Array(12)].map((_, i) => U.addMonths(ym, i - 11));
      const fin = months.map(m => Store.finance({ from: m + '-01', to: monthEnd(m) }));
      el.innerHTML = `<div class="ph"><h1>Doanh thu - chi phí theo tháng</h1></div><div class="pad">
        <div class="card"><h3>12 tháng gần nhất (VNĐ)</h3>${barChart(months, [{ name: 'Doanh thu', color: 'var(--rev)', values: fin.map(f => f.revenue) }, { name: 'Chi phí', color: 'var(--cost)', values: fin.map(f => f.cost) }])}</div>
        <div class="card" style="padding:0;overflow:auto"><table class="grid" style="width:100%"><thead><tr><th>Tháng</th><th class="num">Doanh thu</th><th class="num">Chi phí</th><th class="num">Lợi nhuận</th><th class="num">Biên LN</th></tr></thead><tbody>
        ${months.map((m, i) => `<tr><td>${m.slice(5)}/${m.slice(0, 4)}</td><td class="num">${U.money(fin[i].revenue)}</td><td class="num">${U.money(fin[i].cost)}</td><td class="num ${fin[i].profit >= 0 ? 'pos' : 'neg'}">${U.money(fin[i].profit)}</td><td class="num">${pct(fin[i].profit, fin[i].revenue)}</td></tr>`).reverse().join('')}</tbody></table></div></div>`;
    },

    rptCat(el) {
      const ym = U.today().slice(0, 7);
      const st = PAGES._rc = PAGES._rc || { from: ym + '-01', to: monthEnd(ym) };
      const draw = () => {
        const f = Store.finance(st); const cost = f.rows.filter(r => r.kind === 'cost');
        const cats = Object.entries(cost.reduce((a, r) => (a[r.cat] = (a[r.cat] || 0) + r.amount, a), {})).sort((a, b) => b[1] - a[1]);
        const srcs = Object.entries(cost.reduce((a, r) => (a[r.src] = (a[r.src] || 0) + r.amount, a), {})).sort((a, b) => b[1] - a[1]);
        const vehs = Store.all('vehicle');
        $('#rc', el).innerHTML = `<div class="cols"><div class="card"><h3>Theo khoản mục — tổng ${U.money(f.cost)} đ</h3>${hbars(cats, 'var(--cost)') || '<div class="empty">Không có dữ liệu</div>'}</div><div class="card"><h3>Theo nguồn</h3>${hbars(srcs, 'var(--cost)')}</div></div>
        <div class="card" style="padding:0;overflow:auto"><table class="grid" style="width:100%"><thead><tr><th>Khoản mục</th>${vehs.map(v => `<th class="num">${esc(v.plate)}</th>`).join('')}<th class="num">Tổng</th><th class="num">Tỷ trọng</th></tr></thead><tbody>
        ${cats.map(([c, t]) => `<tr><td>${esc(c)}</td>${vehs.map(v => `<td class="num">${U.money(cost.filter(r => r.cat === c && r.vehicle === v.id).reduce((s, r) => s + r.amount, 0))}</td>`).join('')}<td class="num"><b>${U.money(t)}</b></td><td class="num">${pct(t, f.cost)}</td></tr>`).join('')}</tbody></table></div>`;
      };
      el.innerHTML = `<div class="ph"><h1>Chi phí theo khoản mục</h1><div class="grow"></div><div class="toolbar"><input type="date" class="input" id="f1" value="${st.from}"> → <input type="date" class="input" id="f2" value="${st.to}"></div></div><div class="pad" id="rc"></div>`;
      $('#f1', el).onchange = e => { st.from = e.target.value; draw(); }; $('#f2', el).onchange = e => { st.to = e.target.value; draw(); };
      draw();
    },

    rptExpiry(el) {
      const list = expiries();
      el.innerHTML = `<div class="ph"><h1>Cảnh báo hạn giấy tờ</h1></div><div class="pad"><div class="card" style="padding:0"><table class="grid" style="width:100%"><thead><tr><th>Loại giấy tờ</th><th>Xe / Tài xế</th><th>Ngày hết hạn</th><th>Tình trạng</th></tr></thead><tbody>
        ${list.map(x => `<tr><td>${esc(x.what)}</td><td><a href="${x.href}">${esc(x.who)}</a></td><td>${U.date(x.d)}</td><td>${x.days < 0 ? `<span class="chip bad">Đã hết hạn ${-x.days} ngày</span>` : x.days <= 30 ? `<span class="chip warn">Còn ${x.days} ngày</span>` : `<span class="chip ok">Còn ${x.days} ngày</span>`}</td></tr>`).join('') || '<tr><td colspan="4"><div class="empty">Chưa nhập hạn giấy tờ</div></td></tr>'}</tbody></table></div></div>`;
    },

    settings(el) {
      const s = Store.settings();
      el.innerHTML = `<div class="ph"><h1>Thiết lập công ty</h1></div><div class="pad"><form class="card" id="sf" style="max-width:720px"><div class="form-grid">
        ${[['company', 'Tên công ty'], ['tax_code', 'Mã số thuế'], ['address', 'Địa chỉ'], ['phone', 'Điện thoại'], ['email', 'Email'], ['bank', 'Tài khoản ngân hàng']].map(([k, l]) => `<div class="field"><label>${l}</label><input name="${k}" value="${esc(s[k] || '')}"></div>`).join('')}
        <div class="field"><label>Giá dầu tham chiếu (đ/lít)</label><input name="fuel_price" type="number" value="${esc(s.fuel_price || '')}"></div></div>
        <button class="btn primary">Lưu thiết lập</button></form></div>`;
      $('#sf', el).onsubmit = e => { e.preventDefault(); Store.saveSettings(Object.fromEntries(new FormData(e.target))); toast('Đã lưu'); $('.co').textContent = Store.settings().company; };
    },

    async backup(el) {
      const kb = n => (n / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' KB';
      const dlFile = async () => download('tmg_tms_backup_' + U.today() + '.json', await Store.exportJSON(), 'application/json');
      const list = await Store.Backups.list();
      el.innerHTML = `<div class="ph"><h1>Sao lưu / Khôi phục dữ liệu</h1></div><div class="pad">
        ${Store.isLegacy() ? '<div class="card" style="border-color:var(--bad)"><b>Trình duyệt này không hỗ trợ IndexedDB</b> — đang chạy chế độ dự phòng, không có sao lưu tự động. Hãy tải file sao lưu thường xuyên.</div>' : ''}
        <div class="card"><h3>Tải file sao lưu</h3><p>Dữ liệu chữ đang dùng ${kb(Store.usage())} bộ nhớ trình duyệt; ảnh chứng từ lưu riêng trong IndexedDB. File tải về gồm cả ảnh. Nên tải định kỳ và khi chuyển máy.</p><button class="btn primary" id="ex">${ic('dl')} Tải file sao lưu (.json)</button></div>
        <div class="card"><h3>Bản sao lưu tự động trên máy này</h3><p>Hệ thống tự lưu 1 bản mỗi ngày (giữ 10 bản gần nhất) và trước mọi thao tác ghi đè (khôi phục, khởi tạo lại, xoá sạch, nâng cấp dữ liệu).</p>
          <button class="btn" id="snap">Tạo bản sao lưu ngay</button>
          <table class="grid" style="width:100%;margin-top:10px"><thead><tr><th>Thời điểm</th><th>Lý do</th><th class="num">Kích thước</th><th></th></tr></thead><tbody>
          ${list.map(b => `<tr><td>${U.date(b.at)}</td><td>${esc(b.reason)}</td><td class="num">${kb(b.size)}</td><td><a data-dl="${b.id}">Tải về</a> · <a data-rs="${b.id}">Khôi phục</a></td></tr>`).join('') || '<tr><td colspan="4"><div class="empty">Chưa có bản sao lưu</div></td></tr>'}</tbody></table></div>
        <div class="card"><h3>Khôi phục từ file</h3><p>Nạp file sẽ <b>thay thế</b> dữ liệu hiện tại (hệ thống tự sao lưu bản hiện tại trước). Nhận cả file sao lưu của phiên bản cũ.</p><input type="file" accept=".json" id="im"></div>
        <div class="card"><h3>Dữ liệu mẫu</h3><p>Hai thao tác dưới sẽ <b>bắt buộc tải file sao lưu</b> về máy trước khi thực hiện.</p><button class="btn" id="rs" style="color:var(--bad)">Khởi tạo lại dữ liệu mẫu</button>
        <button class="btn" id="clr" style="color:var(--bad)">Xoá sạch, bắt đầu dữ liệu thật</button></div></div>`;
      const reload = () => setTimeout(() => location.reload(), 700);
      $('#ex', el).onclick = dlFile;
      $('#snap', el).onclick = async () => { await Store.Backups.snapshot('Thủ công'); toast('Đã tạo bản sao lưu'); PAGES.backup(el); };
      $$('[data-dl]', el).forEach(a => a.onclick = async () => { const b = await Store.Backups.get(a.dataset.dl); download('tmg_tms_backup_' + b.at.replace(/[:T]/g, '-') + '.json', b.data, 'application/json'); });
      $$('[data-rs]', el).forEach(a => a.onclick = async () => { if (!confirm('Khôi phục dữ liệu về bản sao lưu này? (Bản hiện tại sẽ được sao lưu tự động trước)')) return; try { await Store.restoreBackup(a.dataset.rs); toast('Đã khôi phục'); reload(); } catch (err) { alert('Lỗi: ' + err.message); } });
      $('#im', el).onchange = async e => { const f = e.target.files[0]; if (!f) return; if (!confirm('Thay thế toàn bộ dữ liệu hiện tại bằng file này? (Bản hiện tại sẽ được sao lưu tự động trước)')) return; try { await Store.importJSON(await f.text()); toast('Đã khôi phục'); reload(); } catch (err) { alert('Lỗi: ' + err.message); } };
      $('#rs', el).onclick = async () => { if (!confirm('Tải file sao lưu về máy, sau đó xoá dữ liệu hiện tại và tạo lại dữ liệu mẫu?')) return; await dlFile(); await Store.reset(); Store.clearSession(); reload(); };
      $('#clr', el).onclick = async () => {
        if (!confirm('Tải file sao lưu về máy, sau đó xoá sạch giao dịch, xe, tài xế, khách hàng? (Giữ lại người dùng, vai trò, khoản mục chi phí, chủng loại xe, phòng ban)')) return;
        await dlFile(); await Store.wipe(['admin', 'role', 'cost_category', 'vehicle_group', 'department']); toast('Đã xoá dữ liệu'); reload();
      };
    },

    trash(el) {
      const items = Store.trash();
      el.innerHTML = `<div class="ph"><h1>Thùng rác</h1><div class="note">Bản ghi bị xoá được giữ ở đây và không tính vào báo cáo. Khôi phục để dùng lại; "Xoá vĩnh viễn" không thể hoàn tác.</div></div>
        <div class="pad"><div class="card" style="padding:0;overflow:auto"><table class="grid" style="width:100%"><thead><tr><th>Module</th><th>Bản ghi</th><th>Xoá lúc</th><th>Người xoá</th><th></th></tr></thead><tbody>
        ${items.map(({ col, rec }) => `<tr><td>${esc(M[col] ? M[col].title : col)}</td><td>${esc(rec.code || rec.plate || rec.name || rec.order_no || rec.username || rec.id)}</td><td>${U.date(rec._deleted)}</td><td>${esc(rec._deleted_by)}</td><td><a data-r="${col}|${rec.id}">Khôi phục</a> · <a data-p="${col}|${rec.id}" style="color:var(--bad)">Xoá vĩnh viễn</a></td></tr>`).join('') || '<tr><td colspan="5"><div class="empty">Thùng rác trống</div></td></tr>'}</tbody></table></div></div>`;
      $$('[data-r]', el).forEach(a => a.onclick = () => { const [c, id] = a.dataset.r.split('|'); Store.restore(c, id); toast('Đã khôi phục'); PAGES.trash(el); refreshBell(); });
      $$('[data-p]', el).forEach(a => a.onclick = () => { const [c, id] = a.dataset.p.split('|'); if (confirm('Xoá vĩnh viễn bản ghi này? Không thể hoàn tác (trừ khi khôi phục từ bản sao lưu).')) { Store.purge(c, id); toast('Đã xoá vĩnh viễn'); PAGES.trash(el); } });
    }
  };
  PAGES.rpt_vehicle = PAGES.rptVehicle; PAGES.rpt_month = PAGES.rptMonth; PAGES.rpt_cat = PAGES.rptCat; PAGES.rpt_expiry = PAGES.rptExpiry;

  // Tab khác (VD: App tài xế) vừa ghi dữ liệu -> vẽ lại nếu người dùng không đang nhập liệu
  Store.onChange = () => {
    refreshBell();
    const busy = $('#modal-root').children.length || (document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName));
    if (!busy && session() && $('.layout')) route();
  };
  Store.ready().then(route).catch(err => { $('#app').innerHTML = `<div class="empty">Không khởi động được dữ liệu: ${esc(err.message)}</div>`; console.error(err); });
})();
