/* TMG TMS - giao diện quản trị (v2: giao diện hiện đại) */
(function () {
  'use strict';
  const M = window.TMG_MODULES;
  const CLOUD = Store.cloud.on;
  // Chạy trên máy chủ: tài khoản đăng nhập do Supabase quản lý -> thay mục "Người dùng", thêm trang "Máy chủ dữ liệu",
  // và không hiển thị mật khẩu/PIN dạng chữ trong dữ liệu
  const MENU = window.TMG_MENU.map(g => !g.items ? g : Object.assign({}, g, {
    items: g.items.map(it => CLOUD && it === 'admin' ? { id: 'accounts', title: 'Tài khoản đăng nhập', page: 'accounts' } : it)
      .concat(g.title === 'Thiết lập' ? [{ id: 'cloud', title: CLOUD ? 'Máy chủ dữ liệu' : 'Máy chủ dữ liệu (chưa bật)', page: 'cloud' }] : [])
  }));
  if (CLOUD) { M.driver.fields = M.driver.fields.filter(f => f.k !== 'pin'); M.admin.fields = M.admin.fields.filter(f => f.k !== 'password'); }
  const ROLE_LABEL = { admin: 'Quản trị viên (xác nhận duyệt chi)', accountant: 'Kế toán (duyệt chi cấp 1)', dispatcher: 'Điều vận', driver: 'Tài xế' };
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
    menu: 'M3 6h18M3 12h18M3 18h18', bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
    dl: 'M12 3v12M7 10l5 5 5-5M4 21h16', refresh: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5', phone: 'M7 2h10v20H7zM11 18h2',
    print: 'M6 9V2h12v7M6 18H4v-7h16v7h-2M8 14h8v8H8z', dollar: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5', chev: 'M9 6l6 6-6 6', sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
    moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z', panel: 'M3 4h18v16H3zM9 4v16', filter: 'M3 5h18l-7 8v6l-4 2v-8z',
    cols: 'M3 4h18v16H3zM9 4v16M15 4v16', logout: 'M9 21H4V3h5M16 17l5-5-5-5M21 12H9', alert: 'M12 2L1 21h22zM12 9v5M12 17.5v.01',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2', receipt: 'M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2zM9 7h6M9 11h6M9 15h4',
    undo: 'M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8', inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13L22 12v7H2v-7z', ext: 'M14 3h7v7M21 3l-9 9M19 14v7H3V5h7'
  };
  const ic = (n, extra = '') => `<svg class="i" ${extra} viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n] || P.list}"/></svg>`;

  /* ---------- Helpers ---------- */
  function toast(msg) { const box = $('#toast'); const d = document.createElement('div'); d.innerHTML = ic('check') + esc(msg); box.appendChild(d); setTimeout(() => d.remove(), 2600); }
  const session = () => Store.session();
  // Phải có vai trò được cấp quyền duyệt
  const myRole = () => { const s = session(); const u = s && Store.get('admin', s.id); return u && Store.get('role', u.role_id); };
  // Cấp 1 (kế toán): duyệt đề nghị chi, không giới hạn số tiền
  const canApprove = () => { const s = session(); if (!s) return false; if (CLOUD) return ['admin', 'accountant'].includes(s.role); const r = myRole(); return !!r && (r.approve_cost === 'Có' || isFinal()); };
  // Cấp 2 (quản trị viên): xác nhận duyệt cuối. Dữ liệu cũ chưa có cột này -> dựa vào tên vai trò "Quản trị…"
  function isFinal() { const s = session(); if (!s) return false; if (CLOUD) return s.role === 'admin'; const r = myRole(); return !!r && (r.final_approve ? r.final_approve === 'Có' : /quản trị/i.test(r.name || '')); }
  const APPROVED = ['Đã duyệt', 'Đã chi'];
  const BADGE = {
    ok: ['Hoàn thành', 'Đã xác nhận', 'Đã duyệt', 'Đã chi', 'Đã thanh toán', 'Đã phê duyệt', 'Có', 'Đã thu tiền', 'Đã xử lý', 'Xe trống', 'Hoạt động', 'Đã tạo đơn'],
    warn: ['Chờ duyệt', 'Chờ xác nhận', 'Chờ tài xế xác nhận', 'Chờ nhận hàng', 'Chưa phê duyệt', 'Thanh toán chưa đủ', 'Đang xử lý', 'Chưa thanh toán', 'Gửi tài xế', 'Mới', 'Chưa xử lý', 'Chưa bắt đầu', 'Khởi tạo', 'Tạo mới'],
    bad: ['Hủy', 'Từ chối', 'Đã hủy', 'Xe hỏng', 'Xe công an giữ', 'Không'],
    info: ['Đang vận chuyển', 'Đang chạy', 'Xe đang vận chuyển', 'Sẵn sàng', 'Đã cấp số hóa đơn', 'Đã tiếp nhận', 'Kế toán đã duyệt', 'Đã quyết toán'],
    neutral: ['Chưa quyết toán']
  };
  const chip = (v, kind) => { if (!v) return ''; const k = kind || Object.keys(BADGE).find(k => BADGE[k].includes(v)); return `<span class="chip ${k || ''}">${esc(v)}</span>`; };
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
      case 'money': return v === '' ? '' : U.money(v);
      case 'num': return v === '' ? '' : Number(v).toLocaleString('vi-VN');
      case 'date': case 'datetime': return U.date(v);
      case 'image': return Store.img(v, 'class="thumb" data-zoom alt=""');
      case 'password': return '••••';
      case 'select': return fd.badge ? chip(v) : esc(v);
      default: return esc(v);
    }
  }
  const defVal = fd => { const d = fd.def; if (d === 'today') return U.today(); if (d === 'now') return U.now(); return typeof d === 'function' ? d() : (d ?? (fd.type === 'refs' ? [] : '')); };
  const applyCalc = (mod, rec) => { mod.fields.forEach(fd => { if (fd.calc) rec[fd.k] = fd.calc(rec); }); return rec; };
  const titleOf = (r) => r.code || r.plate || r.order_no || r.name || r.username || r.serial || '';
  const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const isNum = fd => fd.type === 'money' || fd.type === 'num';
  const pct = (a, b) => b ? (a / b * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + '%' : '—';
  const short = v => Math.abs(v) >= 1e9 ? (v / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tỷ' : Math.abs(v) >= 1e6 ? (v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' tr' : U.money(v);
  const monthEnd = U.monthEnd;
  // Tuỳ chọn giao diện (không phải dữ liệu nghiệp vụ)
  const PK = 'tmg_ui' + (Store.NS ? '_' + Store.NS : '') + ':';
  const prefs = { get(k, d) { try { const v = localStorage.getItem(PK + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { localStorage.setItem(PK + k, JSON.stringify(v)); } };
  function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
  const applyTheme = t => { document.documentElement.dataset.theme = t; };
  applyTheme(prefs.get('theme', window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  /* ---------- Routing ---------- */
  const state = {};
  let current = { kind: '', key: '' };
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '') || 'p/dashboard';
    const [path, q] = h.split('?'); const [kind, key, arg] = path.split('/');
    return { kind, key, arg, q: new URLSearchParams(q || '') };
  }
  function route() {
    if (!session()) return renderLogin();
    if (!$('.app')) renderShell();
    const { kind, key, arg, q } = parseHash();
    closeOverlay(); $('.app').classList.remove('mnav');
    const el = $('.content .page'); $('.content').scrollTop = 0;
    current = { kind, key };
    if (kind === 'm' && M[key]) renderList(M[key], el, q);
    else if (kind === 'p' && PAGES[key]) PAGES[key](el, arg);
    else { location.hash = '#/p/dashboard'; return; }
    markNav(key); refreshBell();
    const h1 = $('.page-head h1', el); document.title = (h1 ? h1.textContent + ' · ' : '') + 'TMG Logistics';
  }
  window.addEventListener('hashchange', () => Store.ready().then(route));
  const menuEntry = key => { for (const g of MENU) { if (g.id === key) return { g, title: g.title }; for (const it of g.items || []) { const id = typeof it === 'string' ? it : it.id; if (id === key) return { g, title: typeof it === 'string' ? M[it].title : it.title }; } } return null; };
  function markNav(key) {
    $$('.side [data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === key));
    $$('.nav-group').forEach(g => { const has = !!$(`[data-nav="${key}"]`, g); g.classList.toggle('has-active', has); if (has) g.classList.add('open'); });
    const e = menuEntry(key);
    $('.crumbs').innerHTML = e ? (e.g.items ? `<span>${esc(e.g.title)}</span>${ic('chev', 'style="width:14px;height:14px"')}` : '') + `<b>${esc(e.title)}</b>` : '';
  }

  /* ---------- Login ---------- */
  const loginShell = (inner) => {
    const set = Store.settings();
    $('#app').innerHTML = `
    <div class="login">
      <div class="login-hero">
        <div class="brand-mark"><span class="logo" style="background:#fff;color:var(--brand)">${ic('truck')}</span><span>TMG Logistics</span></div>
        <div><h2>Quản lý vận tải<br>theo từng đầu xe</h2>${set.company && set.company !== 'TMG Logistics' ? `<p>${esc(set.company)}</p>` : ''}
          <ul><li><span>${ic('truck')}</span>Đơn hàng, chuyến xe, điều vận</li><li><span>${ic('receipt')}</span>Doanh thu, đề nghị &amp; duyệt chi phí</li><li><span>${ic('chart')}</span>Lãi lỗ theo đầu xe, theo tháng</li><li><span>${ic('phone')}</span>App tài xế trên điện thoại</li></ul></div>
        <a href="driver.html">${ic('phone')} Mở App tài xế →</a>
      </div>
      <div class="login-form">${inner}</div>
    </div>`;
  };
  // Đăng nhập khi chạy trên máy chủ Supabase
  async function renderCloudLogin() {
    const C = Store.cloud;
    const fail = (title, msg) => loginShell(`<div style="max-width:420px"><h1>${title}</h1><p class="muted">${msg}</p><p><a href="?local=1">Dùng tạm chế độ chạy trên máy →</a></p><button class="btn" onclick="location.reload()">${ic('refresh')} Thử lại</button></div>`);
    if (!C.client) return fail('Không kết nối được máy chủ', esc(C.error));
    loginShell('<div class="muted">Đang kết nối máy chủ…</div>');
    let st;
    try { st = await C.status(); }
    catch (e) { return /tmg_status|function|schema cache|404/i.test(e.message) ? fail('Máy chủ chưa được cài đặt', 'Mở Supabase → SQL Editor, chạy file <code>supabase/setup.sql</code> rồi thử lại.') : fail('Không kết nối được máy chủ', esc(e.message)); }
    if (!st.has_admin) {
      loginShell(`<form id="bf"><h1>Tạo tài khoản quản trị</h1><p class="muted" style="margin:0 0 20px">Máy chủ mới chưa có quản trị viên. Tài khoản tạo ở đây có toàn quyền và dùng để cấp tài khoản cho nhân viên, tài xế.</p>
        <div class="field"><label>Họ tên</label><input name="n" required></div><div class="field"><label>Email</label><input name="e" type="email" autocomplete="username" required></div>
        <div class="field"><label>Mật khẩu (tối thiểu 8 ký tự)</label><input name="p" type="password" minlength="8" autocomplete="new-password" required></div><div class="field"><label>Nhập lại mật khẩu</label><input name="p2" type="password" autocomplete="new-password" required></div>
        <div class="err" id="lerr"></div><button class="btn primary block">Tạo và đăng nhập</button></form>`);
      $('#bf').onsubmit = async e => {
        e.preventDefault(); const f = new FormData(e.target); const err = $('#lerr');
        if (f.get('p') !== f.get('p2')) return (err.textContent = 'Hai mật khẩu không khớp');
        const b = e.target.querySelector('button'); b.disabled = true;
        try { await C.bootstrapAdmin(f.get('e'), f.get('p'), f.get('n')); await C.signIn(f.get('e'), f.get('p')); route(); }
        catch (x) { err.textContent = x.message; b.disabled = false; }
      };
      return;
    }
    loginShell(`<form id="lf"><h1>Đăng nhập</h1><p class="muted" style="margin:0 0 24px">Trang quản trị dành cho văn phòng</p>
      <div class="field"><label for="lu">Email</label><input id="lu" name="u" type="email" autocomplete="username" required autofocus></div>
      <div class="field"><label for="lp">Mật khẩu</label><input id="lp" name="p" type="password" autocomplete="current-password" required></div>
      <div class="err" id="lerr"></div><button class="btn primary block">Đăng nhập</button>
      <div class="hint">Dữ liệu dùng chung trên máy chủ. Quên mật khẩu: nhờ quản trị viên đặt lại trong mục Tài khoản đăng nhập.</div></form>`);
    $('#lf').onsubmit = async e => {
      e.preventDefault(); const f = new FormData(e.target); const b = e.target.querySelector('button'); b.disabled = true;
      try {
        await C.signIn(f.get('u'), f.get('p'));
        if (session().role === 'driver') { C.signOut(); throw new Error('Đây là tài khoản tài xế — hãy dùng App tài xế (driver.html)'); }
        route();
      } catch (x) { $('#lerr').textContent = x.message; b.disabled = false; }
    };
  }
  function renderLogin() {
    if (CLOUD) return renderCloudLogin();
    const set = Store.settings();
    $('#app').innerHTML = `
    <div class="login">
      <div class="login-hero">
        <div class="brand-mark"><span class="logo" style="background:#fff;color:var(--brand)">${ic('truck')}</span><span>TMG Logistics</span></div>
        <div><h2>Quản lý vận tải<br>theo từng đầu xe</h2>${set.company && set.company !== 'TMG Logistics' ? `<p>${esc(set.company)}</p>` : ''}
          <ul><li><span>${ic('truck')}</span>Đơn hàng, chuyến xe, điều vận</li><li><span>${ic('receipt')}</span>Doanh thu, đề nghị &amp; duyệt chi phí</li><li><span>${ic('chart')}</span>Lãi lỗ theo đầu xe, theo tháng</li><li><span>${ic('phone')}</span>App tài xế trên điện thoại</li></ul></div>
        <a href="driver.html">${ic('phone')} Mở App tài xế →</a>
      </div>
      <div class="login-form"><form id="lf">
        <h1>Đăng nhập</h1><p class="muted" style="margin:0 0 24px">Trang quản trị dành cho văn phòng</p>
        <div class="field"><label for="lu">Tên đăng nhập</label><input id="lu" name="u" autocomplete="username" required autofocus></div>
        <div class="field"><label for="lp">Mật khẩu</label><input id="lp" name="p" type="password" autocomplete="current-password" required></div>
        <label style="display:flex;gap:8px;align-items:center;margin-bottom:6px;color:var(--ink-2)"><input type="checkbox" name="r" checked> Ghi nhớ đăng nhập</label>
        <div class="err" id="lerr"></div>
        <button class="btn primary block">Đăng nhập</button>
        <div class="hint">Lần đầu dùng: <b>admin</b> / <b>admin123</b> — đổi mật khẩu trong Quản trị → Người dùng. Dữ liệu lưu trên trình duyệt của máy này.</div>
      </form></div>
    </div>`;
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
    const s = session();
    const navItem = (id, title, icon, href) => `<a class="nav-item" data-nav="${id}" href="${href}" title="${esc(title)}">${icon ? ic(icon) : ''}<span class="t">${esc(title)}</span><span class="nav-badge" data-badge="${id}" style="display:none"></span></a>`;
    const nav = MENU.map((g, i) => g.page ? navItem(g.id, g.title, g.icon, '#/p/' + g.id)
      : `<div class="nav-group" data-g="${i}"><button type="button" title="${esc(g.title)}">${ic(g.icon)}<span class="t">${esc(g.title)}</span>${ic('chev', 'class="i caret" style="width:14px;height:14px"')}</button>
         <div class="nav-sub">${g.items.map(it => typeof it === 'string' ? navItem(it, M[it].title, '', '#/m/' + it) : navItem(it.id, it.title, '', '#/p/' + it.id)).join('')}</div></div>`).join('');
    $('#app').innerHTML = `
    <div class="app ${prefs.get('rail', false) ? 'rail' : ''}">
      <aside class="side">
        <div class="side-head"><a class="brand-mark" href="#/p/dashboard" style="color:var(--ink);text-decoration:none"><span class="logo">${ic('truck')}</span><span class="t">TMG Logistics</span></a></div>
        <nav>${nav}</nav>
        <div class="side-foot"><a class="nav-item" href="driver.html" target="_blank" title="App tài xế">${ic('phone')}<span class="t">App tài xế</span>${ic('ext', 'class="i t" style="width:14px;margin-left:auto"')}</a>
          <button class="nav-item" id="railBtn" title="Thu gọn / mở rộng menu">${ic('panel')}<span class="t">Thu gọn menu</span></button></div>
      </aside>
      <div class="main">
        <header class="topbar">
          <button class="btn ghost icon menu-btn" id="mt" aria-label="Menu">${ic('menu')}</button>
          <div class="crumbs"></div>
          <button class="top-search" id="ts">${ic('search')}<span class="t">Tìm xe, tài xế, đơn, mã phiếu…</span><span class="kbd">Ctrl K</span></button>
          ${CLOUD ? '<a class="sync" id="sync" href="#/p/cloud" title="Trạng thái đồng bộ máy chủ"></a>' : ''}
          <button class="btn ghost icon" id="theme" title="Chế độ sáng/tối">${ic(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}</button>
          <button class="btn ghost icon bell" id="bell" title="Thông báo">${ic('bell')}<span class="dot" id="bn" style="display:none"></span></button>
          <button class="avatar" id="av" title="${esc(s.name)}">${esc((s.name || 'A').trim()[0])}</button>
        </header>
        <div class="content"><div class="page"></div></div>
      </div>
    </div>`;
    $$('.nav-group > button').forEach(b => b.onclick = () => {
      const app = $('.app');
      if (app.classList.contains('rail')) { app.classList.remove('rail'); prefs.set('rail', false); }
      b.parentElement.classList.toggle('open');
    });
    $('#railBtn').onclick = () => { const a = $('.app'); a.classList.toggle('rail'); prefs.set('rail', a.classList.contains('rail')); };
    $('#mt').onclick = e => { e.stopPropagation(); $('.app').classList.toggle('mnav'); };
    $('.content').addEventListener('click', () => $('.app').classList.remove('mnav'));
    $('#theme').onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(t); prefs.set('theme', t); $('#theme').innerHTML = ic(t === 'dark' ? 'sun' : 'moon'); if (current.kind === 'p') route(); };
    $('#ts').onclick = openPalette;
    $('#av').onclick = e => popover(e.currentTarget, `<div class="item" style="display:block"><b>${esc(s.name)}</b><br><small class="muted">${esc(s.username)}</small></div><div class="sep"></div>
      <a href="#/m/admin">${ic('users')} Người dùng</a><a href="#/p/settings">${ic('gear')} Thiết lập công ty</a><a href="#/p/backup">${ic('dl')} Sao lưu / Khôi phục</a><a href="#/p/trash">${ic('trash')} Thùng rác</a><div class="sep"></div><a id="lo">${ic('logout')} Đăng xuất</a>`,
      pop => { $('#lo', pop).onclick = () => { Store.clearSession(); location.hash = ''; location.reload(); }; });
    if (CLOUD) { Store.cloud.onStatus(syncChip); syncChip(Store.cloud.state()); }
    $('#bell').onclick = e => { const n = notifications(); popover(e.currentTarget, n.length ? n.map(x => `<a href="${x.href}">${ic(x.icon)} <span>${x.text}</span></a>`).join('') : '<div class="item muted">Không có thông báo mới</div>'); };
  }
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && session()) { e.preventDefault(); openPalette(); }
  });
  function syncChip(st) {
    const el = $('#sync'); if (!el) return;
    const [k, t] = !st.online ? ['bad', `Mất mạng${st.pending ? ' · ' + st.pending + ' chờ gửi' : ''}`] : st.error ? ['bad', 'Lỗi đồng bộ'] : st.pending || st.syncing ? ['warn', st.pending ? `Đang gửi ${st.pending}` : 'Đang đồng bộ'] : ['ok', 'Đã đồng bộ'];
    el.innerHTML = chip(t, k); el.title = st.error || 'Trạng thái đồng bộ máy chủ';
  }
  Store.cloud.onError = msg => toast(msg);
  function popover(anchor, html, after) {
    $$('.popover').forEach(p => p.remove());
    const p = document.createElement('div'); p.className = 'popover'; p.innerHTML = html; document.body.appendChild(p);
    const r = anchor.getBoundingClientRect();
    p.style.top = (r.bottom + 6) + 'px';
    p.style.left = Math.max(8, Math.min(r.right - p.offsetWidth, innerWidth - p.offsetWidth - 8)) + 'px';
    const off = ev => { if (!p.contains(ev.target) && !anchor.contains(ev.target)) { p.remove(); document.removeEventListener('mousedown', off); } };
    setTimeout(() => document.addEventListener('mousedown', off));
    p.addEventListener('click', ev => { if (ev.target.closest('a')) p.remove(); });
    after && after(p); return p;
  }
  function notifications() {
    const n = [];
    const pc = Store.all('cost_request').filter(r => r.status === 'Chờ duyệt').length;
    const pf = isFinal() ? Store.all('cost_request').filter(r => r.status === 'Kế toán đã duyệt').length : 0;
    const pr = Store.all('revenue').filter(r => r.status === 'Chờ xác nhận').length;
    const ex = expiries().filter(x => x.days <= 30).length;
    const inc = Store.all('incident').filter(r => r.status === 'Chưa xử lý').length;
    if (pf) n.push({ icon: 'check', text: `<b>${pf}</b> đề nghị kế toán đã duyệt, chờ bạn xác nhận`, href: '#/m/cost_request?s=Kế toán đã duyệt' });
    if (pc) n.push({ icon: 'receipt', text: `<b>${pc}</b> đề nghị chi phí chờ kế toán duyệt`, href: '#/m/cost_request?s=Chờ duyệt' });
    if (pr) n.push({ icon: 'dollar', text: `<b>${pr}</b> doanh thu chờ xác nhận`, href: '#/m/revenue?s=Chờ xác nhận' });
    if (ex) n.push({ icon: 'clock', text: `<b>${ex}</b> giấy tờ sắp/đã hết hạn`, href: '#/p/rpt_expiry' });
    if (inc) n.push({ icon: 'alert', text: `<b>${inc}</b> sự cố chưa xử lý`, href: '#/m/incident?s=Chưa xử lý' });
    return n;
  }
  function refreshBell() {
    const b = $('#bn'); if (!b) return;
    const c = notifications().length; b.textContent = c || ''; b.style.display = c ? '' : 'none';
    const badge = (id, n) => { const e = $(`[data-badge="${id}"]`); if (e) { e.textContent = n; e.style.display = n ? '' : 'none'; } };
    badge('cost_request', Store.all('cost_request').filter(r => r.status === 'Chờ duyệt' || (isFinal() && r.status === 'Kế toán đã duyệt')).length);
    badge('revenue', Store.all('revenue').filter(r => r.status === 'Chờ xác nhận').length);
    badge('incident', Store.all('incident').filter(r => r.status === 'Chưa xử lý').length);
  }

  /* ---------- Overlay (modal / drawer / palette) ---------- */
  function overlay(html, onOpen, opts = {}) {
    const root = $('#modal-root');
    if (!opts.stack) root.innerHTML = '';
    const layer = document.createElement('div'); layer.className = 'overlay'; layer.innerHTML = html; root.appendChild(layer);
    const close = () => { layer.remove(); document.removeEventListener('keydown', onKey); opts.onClose && opts.onClose(); };
    const onKey = e => { if (e.key === 'Escape' && root.lastElementChild === layer && !e.defaultPrevented) close(); };
    document.addEventListener('keydown', onKey);
    $$('[data-close]', layer).forEach(b => b.onclick = close);
    layer.addEventListener('mousedown', e => { if (e.target === layer) close(); });
    onOpen && onOpen(layer, close); return close;
  }
  function closeOverlay() { $('#modal-root').innerHTML = ''; $$('.popover').forEach(p => p.remove()); }
  function showImage(src) { overlay(`<div class="modal"><div class="m-h"><h3>Chứng từ</h3><button class="btn ghost icon" data-close>${ic('x')}</button></div><div class="m-b" style="text-align:center"><img src="${src}" style="max-width:100%;border-radius:8px"></div></div>`, null, { stack: true }); }
  document.addEventListener('click', e => { const img = e.target.closest('img[data-zoom]'); if (img && img.src) { e.stopPropagation(); showImage(img.src); } }, true);

  /* ---------- Command palette (Ctrl+K) ---------- */
  function openPalette() {
    const entries = [];
    MENU.forEach(g => { if (g.page) entries.push({ grp: 'Trang', title: g.title, icon: g.icon, href: '#/p/' + g.id }); (g.items || []).forEach(it => { const id = typeof it === 'string' ? it : it.id; entries.push({ grp: 'Trang', title: typeof it === 'string' ? M[it].title : it.title, sub: g.title, icon: g.icon, href: (typeof it === 'string' ? '#/m/' : '#/p/') + id }); }); });
    entries.push({ grp: 'Thao tác', title: 'Thêm đơn hàng mới', icon: 'plus', act: () => openForm(M.order, null) }, { grp: 'Thao tác', title: 'Thêm đề nghị chi phí', icon: 'plus', act: () => openForm(M.cost_request, null) }, { grp: 'Thao tác', title: 'Nhập doanh thu', icon: 'plus', act: () => openForm(M.revenue, null) }, { grp: 'Thao tác', title: 'Đổi chế độ sáng / tối', icon: 'moon', act: () => $('#theme').click() });
    const recs = [['vehicle', r => r.plate, r => Store.label('driver', r.driver_id)], ['driver', r => r.name, r => r.phone], ['customer', r => r.name, r => r.code], ['order', r => r.order_no, r => Store.label('customer', r.customer_id)], ['route', r => r.code, r => Store.label('vehicle', r.vehicle_id)], ['cost_request', r => r.code, r => U.money(r.amount) + ' đ'], ['revenue', r => r.code, r => U.money(r.amount) + ' đ'], ['repair_ticket', r => r.code, r => r.name]];
    overlay(`<div class="palette"><div class="q">${ic('search')}<input placeholder="Tìm trang, biển số, tài xế, khách hàng, mã đơn, mã phiếu…" autofocus><span class="kbd">Esc</span></div><div class="res"></div></div>`, (layer, close) => {
      const inp = $('input', layer), res = $('.res', layer); let items = [], on = 0;
      const draw = () => {
        const q = norm(inp.value.trim());
        items = entries.filter(e => !q || norm(e.title + ' ' + (e.sub || '')).includes(q)).slice(0, q ? 8 : 14);
        if (q.length >= 2) recs.forEach(([c, t, sub]) => {
          Store.all(c).filter(r => norm(t(r) + ' ' + sub(r)).includes(q)).slice(0, 5).forEach(r => items.push({ grp: M[c].title, title: t(r) || r.id, sub: sub(r), icon: 'doc', href: `#/m/${c}?id=${r.id}` }));
        });
        on = Math.min(on, Math.max(0, items.length - 1)); let g = '';
        res.innerHTML = items.map((e, i) => (e.grp !== g ? `<div class="grp">${esc(g = e.grp)}</div>` : '') + `<div class="it ${i === on ? 'on' : ''}" data-i="${i}">${ic(e.icon)}<span>${esc(e.title)}</span><small>${esc(e.sub || '')}</small></div>`).join('') || '<div class="empty">Không tìm thấy</div>';
        $$('.it', res).forEach(d => d.onclick = () => go(items[+d.dataset.i]));
      };
      const go = e => { if (!e) return; close(); if (e.act) e.act(); else if (location.hash === e.href) route(); else location.hash = e.href; };
      inp.oninput = () => { on = 0; draw(); };
      inp.onkeydown = e => {
        if (e.key === 'ArrowDown') { on = Math.min(items.length - 1, on + 1); draw(); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { on = Math.max(0, on - 1); draw(); e.preventDefault(); }
        else if (e.key === 'Enter') go(items[on]);
      };
      draw(); inp.focus();
    });
  }

  /* ---------- List (CRUD) ---------- */
  function listState(key) { return (state[key] = state[key] || { f: {}, q: '', status: '', from: '', to: '', sort: null, dir: 1, page: 1, size: 50, sel: new Set(), showF: false }); }
  const statusField = mod => mod.fields.find(f => f.type === 'select' && f.badge && ['status', 'approve', 'approved', 'pay_status', 'state'].includes(f.k));
  const dateField = mod => mod.fields.find(f => (f.type === 'date' || f.type === 'datetime') && !f.readonly);
  function visibleCols(mod) { const saved = prefs.get('cols_' + mod.key, null); const all = mod.fields.filter(f => f.type !== 'password'); return saved ? all.filter(f => saved.includes(f.k)) : all.filter(f => f.list !== false); }
  function compute(mod, st) {
    const cols = visibleCols(mod), sf = statusField(mod), df = dateField(mod);
    let rows = Store.all(mod.key).slice();
    if (st.q) { const q = norm(st.q); const fs = mod.fields.filter(f => f.type !== 'image' && f.type !== 'password'); rows = rows.filter(r => fs.some(f => norm(rawValue(f, r)).includes(q))); }
    if (df && (st.from || st.to)) rows = rows.filter(r => { const d = String(r[df.k] || '').slice(0, 10); return (!st.from || d >= st.from) && (!st.to || d <= st.to); });
    Object.entries(st.f).forEach(([k, q]) => {
      if (!q) return; const fd = mod.fields.find(c => c.k === k); if (!fd) return;
      const ql = norm(q);
      rows = rows.filter(r => {
        const v = rawValue(fd, r);
        if (fd.type === 'select') return v === q;
        if (isNum(fd)) { const m = q.match(/^(>=|<=|>|<|=)?\s*([\d.,]+)$/); if (!m) return true; const n = U.num(m[2]); const x = U.num(v); return ({ '>': x > n, '<': x < n, '>=': x >= n, '<=': x <= n }[m[1]] ?? x === n); }
        if (fd.type === 'date' || fd.type === 'datetime') return String(v).startsWith(q) || U.date(v).includes(q);
        return norm(v).includes(ql);
      });
    });
    const counts = {}; if (sf) rows.forEach(r => { counts[r[sf.k]] = (counts[r[sf.k]] || 0) + 1; });
    if (sf && st.status) rows = rows.filter(r => r[sf.k] === st.status);
    if (st.sort) { const fd = mod.fields.find(c => c.k === st.sort) || { k: st.sort }; rows.sort((a, b) => { const x = fd.type ? rawValue(fd, a) : a[st.sort], y = fd.type ? rawValue(fd, b) : b[st.sort]; return (isNum(fd) ? U.num(x) - U.num(y) : String(x ?? '').localeCompare(String(y ?? ''), 'vi')) * st.dir; }); }
    return { rows, cols, counts, sf, df };
  }
  function renderList(mod, el, q) {
    const st = listState(mod.key); const ro = mod.readonlyModule;
    if (q && q.get('s') != null) { st.status = q.get('s'); st.page = 1; }
    if (q && q.get('f')) { const [k, ...v] = q.get('f').split(':'); st.f = { [k]: v.join(':') }; st.showF = true; st.page = 1; st.status = ''; st.q = ''; }
    const sf = statusField(mod), df = dateField(mod);
    const acts = mod.rowActions || [];
    el.innerHTML = `
      <div class="page-head"><div><h1>${esc(mod.title)}</h1>${mod.note ? `<div class="desc">${esc(mod.note)}</div>` : ''}</div><div class="grow"></div>
        <div class="acts">${(mod.headerActions || []).map(a => HEADER_ACTIONS[a].btn).join('')}
          <button class="btn" id="csv">${ic('dl')} Xuất Excel</button><button class="btn icon" id="prt" title="In">${ic('print')}</button>
          ${ro ? '' : `<button class="btn primary" id="add">${ic('plus')} Thêm mới</button>`}</div></div>
      <div class="card list-card">
        ${sf ? `<div class="tabs" id="tabs"></div>` : ''}
        <div class="toolbar">
          <div class="search">${ic('search')}<input class="input" id="q" placeholder="Tìm trong ${esc(mod.title.toLowerCase())}…" value="${esc(st.q)}"></div>
          ${df ? `<span class="daterange">${ic('clock')}<input type="date" class="input sm" id="d1" value="${st.from}" title="${esc(df.label)} từ"> – <input type="date" class="input sm" id="d2" value="${st.to}" title="đến"></span>` : ''}
          <div class="grow"></div>
          <button class="btn sm" id="tf">${ic('filter')} Lọc theo cột</button>
          <button class="btn sm" id="cc">${ic('cols')} Cột</button>
          <button class="btn sm ghost" id="clr" title="Xoá mọi bộ lọc">${ic('refresh')}</button>
        </div>
        <div id="bulk"></div>
        <div class="tbl-wrap"><table class="grid" id="g"><thead></thead><tbody></tbody><tfoot></tfoot></table></div>
        <div class="mcards" id="mc"></div>
        <div class="foot"><span id="cnt"></span><div class="grow"></div>Hiển thị
          <select class="input sm" id="ps" style="width:auto">${[20, 50, 100, 500].map(n => `<option ${n === st.size ? 'selected' : ''}>${n}</option>`).join('')}</select>
          <button class="btn sm icon" id="pp">‹</button><span id="pg"></span><button class="btn sm icon" id="pn">›</button></div>
      </div>`;
    const drawHead = () => {
      const cols = visibleCols(mod);
      $('#g thead').innerHTML = `<tr><th class="cb nosort"><input type="checkbox" id="sa" aria-label="Chọn tất cả"></th>
        ${cols.map(c => `<th data-s="${c.k}" class="${isNum(c) ? 'num' : ''}">${esc(c.label)}<span class="sort">${st.sort === c.k ? (st.dir > 0 ? '▲' : '▼') : ''}</span></th>`).join('')}
        <th data-s="created_at">Ngày tạo<span class="sort">${st.sort === 'created_at' ? (st.dir > 0 ? '▲' : '▼') : ''}</span></th><th class="actc nosort"></th></tr>
        ${st.showF ? `<tr class="filters"><th></th>${cols.map(c => `<th>${filterInput(c, st.f[c.k])}</th>`).join('')}<th></th><th class="actc"></th></tr>` : ''}`;
      $$('#g thead th[data-s]').forEach(th => th.onclick = () => { const k = th.dataset.s; if (st.sort === k) st.dir *= -1; else { st.sort = k; st.dir = 1; } drawHead(); drawBody(); });
      $$('#g [data-f]').forEach(inp => {
        const ev = inp.tagName === 'SELECT' ? 'change' : 'input';
        inp.addEventListener(ev, () => { st.f[inp.dataset.f] = inp.value; st.page = 1; clearTimeout(inp._t); inp._t = setTimeout(drawBody, ev === 'input' ? 200 : 0); });
      });
      $('#sa').onchange = e => { const { rows } = compute(mod, st); pageRows(rows).forEach(r => e.target.checked ? st.sel.add(r.id) : st.sel.delete(r.id)); drawBody(); };
      $('#tf').classList.toggle('primary', st.showF);
    };
    const pageRows = rows => rows.slice((st.page - 1) * st.size, st.page * st.size);
    const drawBody = () => {
      const { rows, cols, counts } = compute(mod, st);
      const pages = Math.max(1, Math.ceil(rows.length / st.size)); if (st.page > pages) st.page = pages;
      const view = pageRows(rows);
      if (sf) { const total = Object.values(counts).reduce((a, b) => a + b, 0); $('#tabs').innerHTML = `<button data-st="" class="${!st.status ? 'on' : ''}">Tất cả <span class="n">${total}</span></button>` + sf.options.map(o => `<button data-st="${esc(o)}" class="${st.status === o ? 'on' : ''}">${esc(o)} <span class="n">${counts[o] || 0}</span></button>`).join(''); $$('#tabs button').forEach(b => b.onclick = () => { st.status = b.dataset.st; st.page = 1; drawBody(); }); }
      const sums = cols.filter(c => c.sum);
      $('#g tbody').innerHTML = view.length ? view.map(r => `<tr data-id="${r.id}" class="${st.sel.has(r.id) ? 'sel' : ''}"><td class="cb"><input type="checkbox" class="cs" ${st.sel.has(r.id) ? 'checked' : ''} aria-label="Chọn"></td>
          ${cols.map((c, i) => `<td class="${isNum(c) ? 'num' : ''} ${i === 0 ? 'code' : ''}" title="${esc(String(rawValue(c, r)).slice(0, 200))}">${cell(c, r)}</td>`).join('')}
          <td class="muted">${U.date(r.created_at)}</td>
          <td class="actc"><span class="row-acts">${acts.map(a => ROW_ACTIONS[a].show(r) ? `<button data-a="${a}" class="ok" title="${esc(ROW_ACTIONS[a].label(r))}">${ic(ROW_ACTIONS[a].icon(r))}</button>` : '').join('')}${ro ? '' : `<button data-a="edit" title="Sửa">${ic('edit')}</button><button data-a="dup" title="Sao chép">${ic('copy')}</button><button data-a="del" class="del" title="Xoá">${ic('trash')}</button>`}</span></td></tr>`).join('')
        : `<tr><td colspan="${cols.length + 3}"><div class="empty">${ic('inbox')}Không có dữ liệu phù hợp</div></td></tr>`;
      $('#g tfoot').innerHTML = sums.length && rows.length ? `<tr><td></td>${cols.map((c, i) => `<td class="num">${c.sum ? U.money(rows.reduce((s, r) => s + U.num(rawValue(c, r)), 0)) : i === 0 ? '<span style="float:left">Tổng</span>' : ''}</td>`).join('')}<td></td><td class="actc"></td></tr>` : '';
      $('#mc').innerHTML = view.map(r => `<div class="mcard" data-id="${r.id}"><div class="t"><span>${esc(rawValue(cols[0], r))}</span>${sf ? chip(r[sf.k]) : ''}</div><div class="m">${cols.slice(1, 6).filter(c => c !== sf && c.type !== 'image').map(c => `<span>${esc(c.label)}</span><span>${cell(c, r) || '—'}</span>`).join('')}</div></div>`).join('') || '<div class="empty">Không có dữ liệu phù hợp</div>';
      $('#cnt').innerHTML = `<b>${rows.length.toLocaleString('vi-VN')}</b> bản ghi`;
      $('#pg').textContent = `${st.page} / ${pages}`;
      $('#pp').disabled = st.page <= 1; $('#pn').disabled = st.page >= pages;
      const sa = $('#sa'); if (sa) sa.checked = view.length > 0 && view.every(r => st.sel.has(r.id));
      drawBulk();
      $$('#g .cs').forEach(cb => { cb.onclick = e => e.stopPropagation(); cb.onchange = () => { const id = cb.closest('tr').dataset.id; cb.checked ? st.sel.add(id) : st.sel.delete(id); drawBody(); }; });
      $$('#g tbody tr[data-id], #mc .mcard').forEach(tr => tr.onclick = e => { if (e.target.closest('button, input, a, img[data-zoom]')) return; openDetail(mod, tr.dataset.id, drawBody); });
      $$('#g tbody [data-a]').forEach(b => b.onclick = e => {
        e.stopPropagation();
        const id = b.closest('tr').dataset.id; const r = Store.get(mod.key, id); const act = b.dataset.a;
        if (act === 'edit') openForm(mod, r, drawBody);
        else if (act === 'dup') duplicate(mod, r, drawBody);
        else if (act === 'del') { if (confirm('Chuyển bản ghi này vào thùng rác? (Có thể khôi phục trong Quản trị → Thùng rác)')) { Store.remove(mod.key, id); st.sel.delete(id); toast('Đã chuyển vào thùng rác'); drawBody(); refreshBell(); } }
        else ROW_ACTIONS[act].run(r, drawBody);
      });
    };
    const drawBulk = () => {
      const box = $('#bulk'); if (!st.sel.size) { box.innerHTML = ''; return; }
      const sel = [...st.sel].map(id => Store.get(mod.key, id)).filter(r => r && !r._deleted);
      const bulks = acts.filter(a => ROW_ACTIONS[a].bulk).map(a => { const b = ROW_ACTIONS[a].bulk; const n = sel.filter(b.ok).length; return n ? `<button class="btn sm ok" data-b="${a}">${ic('check')} ${esc(b.label)} (${n})</button>` : ''; }).join('');
      box.innerHTML = `<div class="bulkbar">Đã chọn ${st.sel.size}<span style="flex:1"></span>${bulks}${ro ? '' : `<button class="btn sm danger" id="bdel">${ic('trash')} Xoá</button>`}<button class="btn sm ghost" id="bx">Bỏ chọn</button></div>`;
      $$('[data-b]', box).forEach(b => b.onclick = () => { const def = ROW_ACTIONS[b.dataset.b].bulk; const list = sel.filter(def.ok); if (def.run(list) !== false) { st.sel.clear(); drawBody(); refreshBell(); } });
      if ($('#bdel', box)) $('#bdel', box).onclick = () => { if (confirm(`Chuyển ${st.sel.size} bản ghi đã chọn vào thùng rác?`)) { st.sel.forEach(id => Store.remove(mod.key, id)); st.sel.clear(); toast('Đã chuyển vào thùng rác'); drawBody(); refreshBell(); } };
      $('#bx', box).onclick = () => { st.sel.clear(); drawBody(); };
    };
    $('#q').oninput = e => { st.q = e.target.value; st.page = 1; clearTimeout(e.target._t); e.target._t = setTimeout(drawBody, 200); };
    if (df) { $('#d1').onchange = e => { st.from = e.target.value; st.page = 1; drawBody(); }; $('#d2').onchange = e => { st.to = e.target.value; st.page = 1; drawBody(); }; }
    $('#tf').onclick = () => { st.showF = !st.showF; if (!st.showF) st.f = {}; drawHead(); drawBody(); };
    $('#cc').onclick = e => {
      const vis = visibleCols(mod).map(c => c.k);
      popover(e.currentTarget, `<div class="item muted" style="font-size:12px">Chọn cột hiển thị</div>${mod.fields.filter(f => f.type !== 'password').map(f => `<label><input type="checkbox" value="${f.k}" ${vis.includes(f.k) ? 'checked' : ''}> ${esc(f.label)}</label>`).join('')}<div class="sep"></div><a id="cdef">${ic('undo')} Về mặc định</a>`, pop => {
        pop.style.maxHeight = '60vh'; pop.style.overflowY = 'auto';
        $$('input', pop).forEach(cb => cb.onchange = () => { const ks = $$('input:checked', pop).map(i => i.value); if (!ks.length) { cb.checked = true; return; } prefs.set('cols_' + mod.key, ks); drawHead(); drawBody(); });
        $('#cdef', pop).onclick = () => { localStorage.removeItem(PK + 'cols_' + mod.key); drawHead(); drawBody(); };
      });
    };
    $('#clr').onclick = () => { Object.assign(st, { f: {}, q: '', status: '', from: '', to: '', page: 1 }); st.sel.clear(); renderList(mod, el); };
    $('#ps').onchange = e => { st.size = +e.target.value; st.page = 1; drawBody(); };
    $('#pp').onclick = () => { st.page--; drawBody(); }; $('#pn').onclick = () => { st.page++; drawBody(); };
    if ($('#add')) $('#add').onclick = () => openForm(mod, null, drawBody);
    $('#csv').onclick = () => exportCSV(mod, compute(mod, st));
    $('#prt').onclick = () => window.print();
    (mod.headerActions || []).forEach(a => { const b = $('#ha_' + a); if (b) b.onclick = () => HEADER_ACTIONS[a].run(drawBody); });
    drawHead(); drawBody();
    if (q && q.get('id') && Store.get(mod.key, q.get('id'))) openDetail(mod, q.get('id'), drawBody);
  }
  function filterInput(c, v) {
    v = v || '';
    if (c.type === 'select') return `<select data-f="${c.k}"><option value="">Tất cả</option>${c.options.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    if (c.type === 'image') return '';
    const ph = isNum(c) ? '>=, <, =' : c.type === 'date' ? 'yyyy-mm' : 'Chứa…';
    return `<input data-f="${c.k}" value="${esc(v)}" placeholder="${ph}">`;
  }
  function exportCSV(mod, { rows, cols }) {
    const head = cols.filter(c => c.type !== 'image').concat([{ k: 'created_by', label: 'Người tạo' }, { k: 'created_at', label: 'Ngày tạo' }]);
    const q = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
    const lines = [head.map(c => q(c.label)).join(',')].concat(rows.map(r => head.map(c => q(c.type ? rawValue(c, r) : r[c.k])).join(',')));
    download(mod.key + '_' + U.today() + '.csv', '﻿' + lines.join('\r\n'), 'text/csv');
  }
  function duplicate(mod, r, after) { const c = Object.assign({}, r); delete c.id; delete c._deleted; delete c._deleted_by; mod.fields.forEach(f => { if (f.type === 'code') c[f.k] = ''; }); openForm(mod, c, after, true); }

  /* ---------- Detail drawer ---------- */
  function related(modKey, id) {
    const out = [];
    Object.values(M).forEach(m => m.fields.forEach(f => {
      if (f.ref !== modKey || (f.type !== 'ref' && f.type !== 'refs')) return;
      const n = Store.all(m.key).filter(r => f.type === 'ref' ? r[f.k] === id : (r[f.k] || []).includes(id)).length;
      if (n) out.push({ m, f, n });
    }));
    return out;
  }
  function openDetail(mod, id, after) {
    const r = Store.get(mod.key, id); if (!r) return;
    const sf = statusField(mod); const ro = mod.readonlyModule;
    const fields = mod.fields.filter(f => f.type !== 'password' && f.type !== 'code');
    const vals = fields.map(f => { const v = rawValue(f, r); if (v === '' || v == null || (Array.isArray(v) && !v.length)) return ''; return `<div>${esc(f.label)}</div><div>${f.type === 'image' ? Store.img(r[f.k], 'data-zoom alt=""') : f.type === 'ref' && r[f.k] ? `<a href="#/m/${f.ref}?id=${r[f.k]}">${esc(v)}</a>` : cell(f, r)}</div>`; }).join('');
    let extra = '';
    if (mod.key === 'vehicle') {
      const ym = U.today().slice(0, 7); const fin = Store.finance({ from: ym + '-01', to: monthEnd(ym), vehicle: id });
      extra = `<div class="sec-t">Tháng ${ym.slice(5)}/${ym.slice(0, 4)}</div><div class="mini-kpis"><div><small>Doanh thu</small><b>${short(fin.revenue)}</b></div><div><small>Chi phí</small><b>${short(fin.cost)}</b></div><div><small>Lợi nhuận</small><b class="${fin.profit >= 0 ? 'pos' : 'neg'}">${short(fin.profit)}</b></div></div><a class="rel" style="margin-top:8px" href="#/p/rpt_vehicle/${id}"><span>${ic('chart')} Xem lãi lỗ chi tiết</span>${ic('chev')}</a>`;
    }
    const rel = related(mod.key, id);
    const label = encodeURIComponent(titleOf(r) || refLabel({ ref: mod.key }, id));
    const relHTML = rel.length ? `<div class="sec-t">Liên quan</div>` + rel.map(x => `<a class="rel" href="#/m/${x.m.key}?f=${x.f.k}:${label}"><span>${esc(x.m.title)} <span class="muted">· ${esc(x.f.label)}</span></span><b>${x.n}</b></a>`).join('') : '';
    const custom = (mod.rowActions || []).filter(a => ROW_ACTIONS[a].show(r)).map(a => `<button class="btn ok" data-a="${a}">${ic(ROW_ACTIONS[a].icon(r))} ${esc(ROW_ACTIONS[a].label(r))}</button>`).join('');
    overlay(`<div class="drawer"><div class="m-h"><div style="flex:1;min-width:0"><div class="sub">${esc(mod.title)}</div><h3>${esc(titleOf(r) || 'Chi tiết')} ${sf ? chip(r[sf.k]) : ''}</h3></div><button class="btn ghost icon" data-close aria-label="Đóng">${ic('x')}</button></div>
      <div class="m-b"><div class="dl">${vals}</div>${extra}${relHTML}
        <div class="sec-t">Lịch sử</div><div class="muted" style="font-size:13px">Tạo bởi ${esc(r.created_by || '—')} lúc ${U.date(r.created_at) || '—'}${r.updated_at ? `<br>Sửa lần cuối bởi ${esc(r.updated_by)} lúc ${U.date(r.updated_at)}` : ''}</div></div>
      <div class="m-f">${custom}<span class="grow"></span>${ro ? '' : `<button class="btn danger" data-x="del">${ic('trash')} Xoá</button><button class="btn" data-x="dup">${ic('copy')} Sao chép</button><button class="btn primary" data-x="edit">${ic('edit')} Sửa</button>`}</div></div>`, (layer, close) => {
      $$('[data-a]', layer).forEach(b => b.onclick = () => { close(); ROW_ACTIONS[b.dataset.a].run(Store.get(mod.key, id), after); });
      $$('[data-x]', layer).forEach(b => b.onclick = () => {
        const x = b.dataset.x; const rec = Store.get(mod.key, id);
        if (x === 'edit') { close(); openForm(mod, rec, after); }
        else if (x === 'dup') { close(); duplicate(mod, rec, after); }
        else if (confirm('Chuyển bản ghi này vào thùng rác?')) { Store.remove(mod.key, id); if (AFTER_SAVE[mod.key]) AFTER_SAVE[mod.key](null, rec); close(); toast('Đã chuyển vào thùng rác'); after && after(); refreshBell(); }
      });
      $$('a[href^="#"]', layer).forEach(a => a.addEventListener('click', () => close()));
    });
  }

  /* ---------- Form ---------- */
  const SECTIONS = [['Thông tin chung', f => !isNum(f) && !['textarea', 'image', 'refs'].includes(f.type)], ['Số tiền & số liệu', isNum], ['Chi tiết & chứng từ', f => ['textarea', 'image', 'refs'].includes(f.type)]];
  function fieldHTML(fd, v) {
    const req = fd.required ? ' <span class="req">*</span>' : '';
    const name = `name="${fd.k}"`; const ro = fd.readonly || (fd.lock && !isFinal()); const r = ro ? 'readonly' : '';
    let inp;
    switch (fd.type) {
      case 'textarea': inp = `<textarea ${name} rows="2" ${r}>${esc(v)}</textarea>`; break;
      case 'select': inp = ro ? `<input value="${esc(v)}" readonly><input type="hidden" ${name} value="${esc(v)}">` : `<select ${name}><option value=""></option>${fd.options.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`; break;
      case 'ref': inp = ro ? `<input value="${esc(refLabel(fd, v))}" readonly><input type="hidden" ${name} value="${esc(v)}">` : `<div class="combo" data-combo="${fd.k}"><input type="hidden" ${name} value="${esc(v || '')}"><input class="combo-in" value="${esc(refLabel(fd, v))}" placeholder="Gõ để tìm…" autocomplete="off" role="combobox" aria-label="${esc(fd.label)}"><div class="combo-list" role="listbox"></div></div>`; break;
      case 'refs': { const set = new Set(v || []); const opts = Store.all(fd.ref); inp = `<div class="multi" data-refs="${fd.k}">${opts.length > 8 ? '<input class="input multi-search" placeholder="Tìm…">' : ''}${opts.slice(0, 2000).map(o => `<label><input type="checkbox" value="${o.id}" ${set.has(o.id) ? 'checked' : ''}> <span>${esc(refLabel(fd, o.id))}</span></label>`).join('') || '<i class="muted">Chưa có dữ liệu</i>'}</div>`; break; }
      case 'money': inp = `<input ${name} inputmode="numeric" data-money value="${v === '' || v == null ? '' : U.money(v)}" ${r}>`; break;
      case 'num': inp = `<input ${name} type="number" step="any" value="${esc(v)}" ${r}>`; break;
      case 'date': inp = `<input ${name} type="date" value="${esc(String(v || '').slice(0, 10))}" ${r}>`; break;
      case 'datetime': inp = `<input ${name} type="datetime-local" value="${esc(v)}" ${r}>`; break;
      case 'password': inp = `<input ${name} type="password" value="${esc(v)}" autocomplete="new-password">`; break;
      case 'image': inp = `<div class="img-field"><input type="file" accept="image/*" data-img="${fd.k}"><input type="hidden" ${name} value="${esc(v)}">${v ? Store.img(v, `data-prev="${fd.k}" alt=""`) : `<img style="display:none" data-prev="${fd.k}" alt="">`}${v ? `<a data-clr="${fd.k}">Xoá ảnh</a>` : ''}</div>`; break;
      case 'code': inp = `<input ${name} value="${esc(v)}" placeholder="Tự động" ${r}>`; break;
      default: inp = `<input ${name} value="${esc(v)}" ${r}>`;
    }
    return `<div class="field ${['textarea', 'refs', 'image'].includes(fd.type) ? 'wide' : ''}"><label>${esc(fd.label)}${req}</label>${inp}${fd.hint ? `<div class="hint">${esc(fd.hint)}</div>` : ''}</div>`;
  }
  // Ô chọn có tìm kiếm (thay <select> cho danh sách dài)
  function initCombos(root, mod) {
    $$('.combo', root).forEach(c => {
      const fd = mod.fields.find(f => f.k === c.dataset.combo);
      const hid = $('input[type=hidden]', c), inp = $('.combo-in', c), list = $('.combo-list', c);
      const opts = Store.all(fd.ref).map(o => ({ id: o.id, label: String(refLabel(fd, o.id)) })).sort((a, b) => a.label.localeCompare(b.label, 'vi'));
      let shown = [], on = 0;
      const draw = (q) => {
        const n = norm(q); shown = (n ? opts.filter(o => norm(o.label).includes(n)) : opts).slice(0, 80);
        on = Math.min(on, Math.max(0, shown.length - 1));
        list.innerHTML = (fd.required ? '' : `<div data-v="" class="${!hid.value ? 'on' : ''} muted">— Không chọn —</div>`) + (shown.map((o, i) => `<div data-v="${o.id}" class="${i === on ? 'on' : ''}">${esc(o.label)}</div>`).join('') || '<div class="none">Không tìm thấy</div>');
      };
      const set = id => { hid.value = id; const o = opts.find(x => x.id === id); inp.value = o ? o.label : ''; c.classList.remove('open'); hid.dispatchEvent(new Event('change', { bubbles: true })); };
      c.setValue = set;
      inp.onfocus = () => { c.classList.add('open'); on = 0; draw(''); inp.select(); };
      inp.oninput = () => { c.classList.add('open'); on = 0; draw(inp.value); };
      inp.onkeydown = e => {
        if (e.key === 'ArrowDown') { on = Math.min(shown.length - 1, on + 1); draw(inp.value === (opts.find(o => o.id === hid.value) || {}).label ? '' : inp.value); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { on = Math.max(0, on - 1); draw(inp.value === (opts.find(o => o.id === hid.value) || {}).label ? '' : inp.value); e.preventDefault(); }
        else if (e.key === 'Enter') { if (c.classList.contains('open') && shown[on]) { set(shown[on].id); e.preventDefault(); } }
        else if (e.key === 'Escape' && c.classList.contains('open')) { c.classList.remove('open'); e.preventDefault(); }
      };
      list.onmousedown = e => { const d = e.target.closest('[data-v]'); if (d) { e.preventDefault(); set(d.dataset.v); } };
      inp.onblur = () => { setTimeout(() => { c.classList.remove('open'); if (!inp.value.trim()) { if (hid.value) set(''); } else { const o = opts.find(x => x.id === hid.value); inp.value = o ? o.label : ''; } }, 120); };
    });
  }
  const setField = (form, k, v) => { const c = $(`.combo[data-combo="${k}"]`, form); if (c && c.setValue) c.setValue(v); else if (form.elements[k]) form.elements[k].value = v; };
  function readForm(mod, form, base) {
    const rec = Object.assign({}, base);
    mod.fields.forEach(fd => {
      if (fd.virtual) return;
      if (fd.type === 'refs') { rec[fd.k] = $$(`[data-refs="${fd.k}"] label input:checked`, form).map(i => i.value); return; }
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
    // Bản sao không mang theo trạng thái duyệt / quyết toán / thông tin do hệ thống ghi
    else if (!editing) mod.fields.forEach(fd => { if (fd.lock) data[fd.k] = defVal(fd); else if (fd.readonly && !fd.calc && !fd.virtual) data[fd.k] = ''; });
    applyCalc(mod, data);
    const fs = mod.fields.filter(fd => !fd.virtual);
    const secs = SECTIONS.map(([t, test]) => [t, fs.filter(test)]).filter(([, l]) => l.length);
    overlay(`<form class="modal" id="mf" novalidate>
      <div class="m-h"><div style="flex:1"><div class="sub">${esc(mod.title)}</div><h3>${editing ? 'Sửa ' + esc(titleOf(rec) || '') : 'Thêm mới'}</h3></div><button type="button" class="btn ghost icon" data-close aria-label="Đóng">${ic('x')}</button></div>
      <div class="m-b">${secs.map(([t, l]) => `<div class="form-sec">${secs.length > 1 ? `<h4>${t}</h4>` : ''}<div class="form-grid">${l.map(fd => fieldHTML(fd, data[fd.k] ?? '')).join('')}</div></div>`).join('')}<div class="err" id="ferr"></div></div>
      <div class="m-f"><button type="button" class="btn" data-close>Huỷ</button>${editing ? '' : '<button type="submit" class="btn" data-more>Lưu &amp; thêm mới</button>'}<button type="submit" class="btn primary">${ic('check')} Lưu</button></div></form>`,
      (layer, close) => {
        const form = $('#mf', layer);
        initCombos(form, mod);
        const recalc = () => { const r = readForm(mod, form, data); mod.fields.forEach(fd => { if (fd.calc && form.elements[fd.k]) form.elements[fd.k].value = fd.type === 'money' ? U.money(r[fd.k]) : r[fd.k]; }); };
        form.addEventListener('input', e => { if (e.target.dataset.money !== undefined) { const n = U.num(e.target.value); e.target.value = e.target.value === '' ? '' : U.money(n); } if (!e.target.classList.contains('multi-search') && !e.target.classList.contains('combo-in')) recalc(); });
        form.addEventListener('change', recalc);
        $$('.multi-search', form).forEach(s => s.oninput = () => { const q = norm(s.value); $$('label', s.parentElement).forEach(l => { l.style.display = norm(l.textContent).includes(q) ? '' : 'none'; }); });
        $$('[data-img]', form).forEach(inp => inp.onchange = async () => {
          const file = inp.files[0]; if (!file) return; const url = await U.resizeImage(file);
          const ref = await Store.Files.put(url);
          form.elements[inp.dataset.img].value = ref; const pv = $(`[data-prev="${inp.dataset.img}"]`, form); pv.src = url; pv.style.display = '';
        });
        $$('[data-clr]', form).forEach(a => a.onclick = () => { form.elements[a.dataset.clr].value = ''; $(`[data-prev="${a.dataset.clr}"]`, form).style.display = 'none'; });
        let more = false; $$('button[type=submit]', form).forEach(b => b.onclick = () => { more = b.hasAttribute('data-more'); });
        // Tự điền tài xế chính khi chọn xe
        if (form.elements.vehicle_id && form.elements.driver_id) form.elements.vehicle_id.addEventListener('change', () => { const v = Store.get('vehicle', form.elements.vehicle_id.value); if (v && v.driver_id && !form.elements.driver_id.value) setField(form, 'driver_id', v.driver_id); });
        form.onsubmit = e => {
          e.preventDefault();
          const r = readForm(mod, form, data);
          const miss = mod.fields.filter(fd => fd.required && (r[fd.k] === '' || r[fd.k] == null || (Array.isArray(r[fd.k]) && !r[fd.k].length)));
          if (miss.length) { $('#ferr', layer).textContent = 'Vui lòng nhập: ' + miss.map(m => m.label).join(', '); return; }
          const cf = mod.fields.find(fd => fd.type === 'code');
          if (cf && !r[cf.k]) r[cf.k] = Store.nextCode(mod.key, cf.prefix);
          if (BEFORE_SAVE[mod.key]) { const w = BEFORE_SAVE[mod.key](r, editing ? rec.id : null); if (w && !confirm(w)) return; }
          let saved;
          if (editing) { saved = Store.update(mod.key, rec.id, r); toast('Đã lưu'); }
          else { delete r.id; saved = Store.insert(mod.key, r); toast('Đã thêm ' + (titleOf(r) || '')); }
          if (AFTER_SAVE[mod.key]) AFTER_SAVE[mod.key](saved, editing ? rec : null);
          close(); after && after(); refreshBell();
          if (more) openForm(mod, null, after);
        };
        const first = $('input:not([type=hidden]):not([readonly]), select, textarea', form); first && setTimeout(() => first.focus(), 30);
      });
  }

  /* ---------- Row / bulk / header actions ---------- */
  // Duyệt 2 cấp: Kế toán duyệt (không giới hạn số tiền) -> Quản trị viên xác nhận -> "Đã duyệt".
  // Quản trị viên duyệt một đề nghị "Chờ duyệt" thì đi thẳng tới "Đã duyệt".
  const approveRec = (r, ok) => {
    const s = session(); const t = U.now();
    if (ok !== true) return Store.update('cost_request', r.id, { status: 'Từ chối', approver: s.name, approved_at: t, reject_reason: ok });
    if (r.status === 'Chờ duyệt' && !isFinal()) return Store.update('cost_request', r.id, { status: 'Kế toán đã duyệt', acc_approver: s.name, acc_approved_at: t, reject_reason: '' });
    const fin = { approver: s.name, approved_at: t, acc_approver: r.acc_approver || s.name, acc_approved_at: r.acc_approved_at || t, reject_reason: '' };
    // Chi phí trừ vào phiếu tạm ứng: tiền đã đưa tài xế từ trước -> duyệt xong là "Đã chi", không chi lần nữa
    if (r.advance_id && Store.get('payment_voucher', r.advance_id)) return Store.update('cost_request', r.id, Object.assign(fin, { status: 'Đã chi', paid_at: U.today(), voucher_id: r.advance_id }));
    return Store.update('cost_request', r.id, Object.assign(fin, { status: 'Đã duyệt' }));
  };
  const canStep = r => (r.status === 'Chờ duyệt' && canApprove()) || (r.status === 'Kế toán đã duyệt' && isFinal());
  // Đánh dấu "Đã chi" + tự tạo phiếu chi
  function markPaid(r, method) {
    const pc = Store.insert('payment_voucher', { code: Store.nextCode('payment_voucher', 'PC'), driver_id: r.driver_id || '', vehicle_id: r.vehicle_id || '', date: U.today(), amount: U.num(r.amount), method: method || 'Tiền mặt', kind: 'Thanh toán chi phí', cost_request_id: r.id, note: 'Chi đề nghị ' + (r.code || '') + (r.description ? ' - ' + r.description : '') });
    Store.update('cost_request', r.id, { status: 'Đã chi', paid_at: U.today(), voucher_id: pc.id });
    return pc;
  }
  // Quyết toán chuyến: tạm ứng chuyến - chi phí tài xế đã ứng (đã duyệt, chưa chi) - dầu tài xế tự trả
  function settlement(rt) {
    const own = c => c.route_id === rt.id && c.pay_method !== 'Công ty chi trực tiếp' && !c.advance_id;
    const reqs = Store.all('cost_request').filter(c => own(c) && c.status === 'Đã duyệt');
    const pending = Store.all('cost_request').filter(c => own(c) && ['Chờ duyệt', 'Kế toán đã duyệt'].includes(c.status));
    const fuels = Store.all('route_fuel').filter(f => f.route_id === rt.id && f.pay_type === 'Tự thanh toán' && f.pay_status !== 'Đã thanh toán');
    const spent = reqs.reduce((a, c) => a + U.num(c.amount), 0) + fuels.reduce((a, f) => a + U.num(f.total), 0);
    const advance = U.num(rt.advance);
    return { reqs, pending, fuels, advance, spent, balance: advance - spent }; // balance > 0: tài xế hoàn lại; < 0: công ty trả thêm
  }
  const ROW_ACTIONS = {
    approveCost: {
      show: r => ['Chờ duyệt', 'Kế toán đã duyệt', 'Đã duyệt'].includes(r.status),
      icon: r => r.status === 'Đã duyệt' ? 'dollar' : 'check',
      label: r => r.status === 'Chờ duyệt' ? 'Duyệt / từ chối' : r.status === 'Kế toán đã duyệt' ? 'Xác nhận duyệt (QTV)' : 'Đánh dấu đã chi',
      run(r, draw) {
        if (r.status === 'Đã duyệt') {
          if (!canApprove()) return alert('Vai trò của bạn không có quyền chi tiền.');
          if (confirm(`Xác nhận đã chi ${U.money(r.amount)} đ cho ${Store.label('driver', r.driver_id) || 'đề nghị này'}?\nHệ thống sẽ tự tạo phiếu chi.`)) { const pc = markPaid(r); toast('Đã chi, tạo phiếu ' + pc.code); draw && draw(); refreshBell(); }
          return;
        }
        if (r.status === 'Kế toán đã duyệt' && !isFinal()) return alert(`Đề nghị đã được kế toán ${r.acc_approver || ''} duyệt, đang chờ Quản trị viên xác nhận.`);
        if (!canApprove()) return alert('Vai trò của bạn không có quyền duyệt chi phí.');
        const lvl2 = r.status === 'Kế toán đã duyệt';
        reviewModal(lvl2 ? 'Xác nhận duyệt chi (Quản trị viên)' : (isFinal() ? 'Duyệt đề nghị chi phí (Quản trị viên)' : 'Duyệt đề nghị chi phí (Kế toán)'), [
          ['Mã', esc(r.code)], ['Xe', esc(Store.label('vehicle', r.vehicle_id))], ['Tài xế', esc(Store.label('driver', r.driver_id))], ['Khoản mục', esc(Store.label('cost_category', r.category_id))],
          ['Số tiền', `<b>${U.money(r.amount)} đ</b>`], ['Ngày', U.date(r.date)], ['Nội dung', esc(r.description)], ['Hình thức', esc(r.pay_method)]
        ].concat(r.advance_id ? [['Trừ vào tạm ứng', (() => { const pv = Store.get('payment_voucher', r.advance_id); return pv ? `<b>${esc(pv.code)}</b> · ${esc(pv.purpose || '')} · còn ${U.money(Store.advanceUse(pv).remain)} đ<br><span class="muted">Duyệt xong chuyển thẳng "Đã chi" (tiền đã ứng trước)</span>` : '—'; })()]] : []).concat(lvl2 ? [['Kế toán duyệt', esc((r.acc_approver || '') + ' · ' + U.date(r.acc_approved_at))]] : [['Sau khi duyệt', isFinal() ? 'Đã duyệt (tính vào chi phí xe)' : 'Chuyển Quản trị viên xác nhận']]), r.image,
        ok => { approveRec(r, ok); const n = Store.get('cost_request', r.id); toast(ok === true ? (n.status === 'Đã duyệt' ? 'Đã duyệt ' : 'Kế toán đã duyệt, chờ QTV xác nhận: ') + r.code : 'Đã từ chối ' + r.code); draw && draw(); refreshBell(); });
      },
      bulk: {
        label: 'Duyệt', ok: r => canStep(r),
        run(list) {
          if (!canApprove()) { alert('Vai trò của bạn không có quyền duyệt chi phí.'); return false; }
          const sum = list.reduce((s, r) => s + U.num(r.amount), 0);
          if (!confirm(`${isFinal() ? 'Duyệt (Quản trị viên)' : 'Duyệt cấp kế toán'} ${list.length} đề nghị, tổng ${U.money(sum)} đ?`)) return false;
          list.forEach(r => approveRec(r, true)); toast(`Đã duyệt ${list.length} đề nghị`); refreshBell();
        }
      }
    },
    settleRoute: {
      show: r => r.status === 'Hoàn thành' && r.settle !== 'Đã quyết toán', icon: () => 'cash', label: () => 'Quyết toán chuyến',
      run(r, draw) {
        if (!canApprove()) return alert('Chỉ Kế toán / Quản trị viên được quyết toán chuyến.');
        const st = settlement(r); const drv = Store.label('driver', r.driver_id) || 'tài xế';
        const line = (t, v) => `<div>${t}</div><div>${v}</div>`;
        overlay(`<div class="modal sm"><div class="m-h"><h3>Quyết toán chuyến ${esc(r.code)}</h3><button class="btn ghost icon" data-close>${ic('x')}</button></div>
          <div class="m-b"><div class="dl">${line('Tài xế', esc(drv))}${line('Xe', esc(Store.label('vehicle', r.vehicle_id)))}${line('Tạm ứng chuyến', U.money(st.advance) + ' đ')}
          ${line('Chi phí tài xế đã ứng', `${U.money(st.reqs.reduce((a, c) => a + U.num(c.amount), 0))} đ <span class="muted">(${st.reqs.length} đề nghị đã duyệt, chưa chi)</span>`)}
          ${line('Dầu tài xế tự trả', `${U.money(st.fuels.reduce((a, f) => a + U.num(f.total), 0))} đ <span class="muted">(${st.fuels.length} lần)</span>`)}
          ${line('Kết quả', `<b>${st.balance >= 0 ? `Tài xế hoàn lại ${U.money(st.balance)} đ` : `Công ty trả thêm ${U.money(-st.balance)} đ`}</b>`)}</div>
          ${st.pending.length ? `<div class="err" style="margin-top:12px">${st.pending.length} đề nghị trên chuyến còn chờ duyệt — chưa được tính. Nên duyệt xong trước khi quyết toán.</div>` : ''}
          <div class="hint" style="margin-top:10px">Khi quyết toán: các đề nghị trên chuyển "Đã chi", dầu tự trả chuyển "Đã thanh toán"${st.balance < 0 ? ', tạo phiếu chi phần công ty trả thêm' : ''}.</div></div>
          <div class="m-f"><button class="btn" data-close>Huỷ</button><button class="btn ok" id="ok">${ic('check')} Quyết toán</button></div></div>`, (layer, close) => {
          $('#ok', layer).onclick = () => {
            let pc = null;
            if (st.balance < 0) pc = Store.insert('payment_voucher', { code: Store.nextCode('payment_voucher', 'PC'), driver_id: r.driver_id || '', vehicle_id: r.vehicle_id || '', date: U.today(), amount: -st.balance, method: 'Tiền mặt', kind: 'Thanh toán chi phí', route_id: r.id, note: 'Quyết toán chuyến ' + r.code });
            st.reqs.forEach(c => Store.update('cost_request', c.id, { status: 'Đã chi', paid_at: U.today(), voucher_id: pc ? pc.id : '', note: 'Quyết toán chuyến ' + r.code }));
            st.fuels.forEach(f => Store.update('route_fuel', f.id, { pay_status: 'Đã thanh toán' }));
            Store.update('route', r.id, { settle: 'Đã quyết toán', settle_amount: st.balance, settled_at: U.today() });
            close(); toast('Đã quyết toán chuyến ' + r.code + (pc ? ', tạo phiếu ' + pc.code : '')); draw && draw(); refreshBell();
          };
        });
      }
    },    settleAdvance: {
      show: r => r.kind === 'Tạm ứng cho tài xế' && r.adv_status !== 'Đã quyết toán', icon: () => 'cash', label: () => 'Quyết toán tạm ứng',
      run(r, draw) {
        if (!canApprove()) return alert('Chỉ Kế toán / Quản trị viên được quyết toán tạm ứng.');
        const u = Store.advanceUse(r); const line = (t, v) => `<div>${t}</div><div>${v}</div>`;
        overlay(`<div class="modal sm"><div class="m-h"><h3>Quyết toán tạm ứng ${esc(r.code)}</h3><button class="btn ghost icon" data-close>${ic('x')}</button></div>
          <div class="m-b"><div class="dl">${line('Tài xế', esc(Store.label('driver', r.driver_id)))}${line('Mục đích', esc(r.purpose || ''))}${line('Số tiền tạm ứng', U.money(r.amount) + ' đ')}
          ${line('Đã dùng', `${U.money(u.used)} đ <span class="muted">(${u.reqs.length} đề nghị, ${u.fuels.length} lần đổ dầu)</span>`)}
          ${line('Kết quả', `<b>${u.remain >= 0 ? `Tài xế hoàn lại ${U.money(u.remain)} đ` : `Công ty trả thêm ${U.money(-u.remain)} đ`}</b>`)}</div>
          ${u.pending ? `<div class="err" style="margin-top:12px">Còn ${U.money(u.pending)} đ chi phí trừ tạm ứng đang chờ duyệt. Nên duyệt xong trước khi quyết toán.</div>` : ''}
          ${u.remain < 0 ? '<div class="hint" style="margin-top:10px">Hệ thống tạo phiếu chi phần công ty trả thêm.</div>' : ''}</div>
          <div class="m-f"><button class="btn" data-close>Huỷ</button><button class="btn ok" id="ok">${ic('check')} Quyết toán</button></div></div>`, (layer, close) => {
          $('#ok', layer).onclick = () => {
            let pc = null;
            if (u.remain < 0) pc = Store.insert('payment_voucher', { code: Store.nextCode('payment_voucher', 'PC'), driver_id: r.driver_id || '', vehicle_id: r.vehicle_id || '', date: U.today(), amount: -u.remain, method: 'Tiền mặt', kind: 'Thanh toán chi phí', note: 'Quyết toán tạm ứng ' + r.code });
            Store.update('payment_voucher', r.id, { adv_status: 'Đã quyết toán', adv_settled_at: U.today(), adv_return: Math.max(0, u.remain) });
            close(); toast('Đã quyết toán ' + r.code + (pc ? ', tạo phiếu ' + pc.code : '')); draw && draw();
          };
        });
      }
    },
    confirmRevenue: {
      show: r => r.status === 'Chờ xác nhận', icon: () => 'check', label: () => 'Xác nhận doanh thu',
      run(r, draw) {
        reviewModal('Xác nhận doanh thu', [['Mã', esc(r.code)], ['Xe', esc(Store.label('vehicle', r.vehicle_id))], ['Tài xế', esc(Store.label('driver', r.driver_id))], ['Khách hàng', esc(Store.label('customer', r.customer_id))], ['Loại', esc(r.type)], ['Số tiền', `<b>${U.money(r.amount)} đ</b>`], ['Hình thức thu', esc(r.collect)], ['Ghi chú', esc(r.note)]], r.image,
          ok => { Store.update('revenue', r.id, { status: ok === true ? 'Đã xác nhận' : 'Từ chối', note: ok === true ? r.note : ((r.note ? r.note + ' | ' : '') + 'Từ chối: ' + ok) }); toast('Đã cập nhật ' + r.code); draw && draw(); refreshBell(); });
      },
      bulk: { label: 'Xác nhận', ok: r => r.status === 'Chờ xác nhận', run(list) { if (!confirm(`Xác nhận ${list.length} phiếu doanh thu?`)) return false; list.forEach(r => Store.update('revenue', r.id, { status: 'Đã xác nhận' })); toast(`Đã xác nhận ${list.length} phiếu`); } }
    },
    approveRoute: {
      show: r => r.approve !== 'Đã phê duyệt' && r.status === 'Hoàn thành', icon: () => 'check', label: () => 'Phê duyệt chuyến',
      run(r, draw) { Store.update('route', r.id, { approve: 'Đã phê duyệt' }); toast('Đã phê duyệt chuyến ' + r.code); draw && draw(); },
      bulk: { label: 'Phê duyệt', ok: r => r.approve !== 'Đã phê duyệt' && r.status === 'Hoàn thành', run(list) { list.forEach(r => Store.update('route', r.id, { approve: 'Đã phê duyệt' })); toast(`Đã phê duyệt ${list.length} chuyến`); } }
    },
    toRevenue: {
      show: r => r.status === 'Hoàn thành' && !Store.all('revenue').some(x => x.order_id === r.id), icon: () => 'dollar', label: () => 'Ghi nhận doanh thu',
      run(r, draw) {
        if (!r.vehicle_id) return alert('Đơn hàng chưa gán xe.');
        Store.insert('revenue', { code: Store.nextCode('revenue', 'DT'), date: r.drop_date || r.pickup_date || U.today(), type: 'Cước vận chuyển', vehicle_id: r.vehicle_id, driver_id: r.driver_id, customer_id: r.customer_id, order_id: r.id, amount: U.num(r.revenue), vat: r.vat || '8%', total: U.num(r.revenue) + Math.round(U.num(r.revenue) * TMG_vatRate(r.vat)), collect: 'Công nợ', status: 'Đã xác nhận', source: 'Web' });
        toast('Đã ghi nhận doanh thu đơn ' + r.order_no); draw && draw();
      }
    },
    vehiclePL: { show: () => true, icon: () => 'chart', label: () => 'Lãi lỗ xe này', run(r) { location.hash = '#/p/rpt_vehicle/' + r.id; } }
  };
  const HEADER_ACTIONS = {
    buildInvoice: {
      btn: `<button class="btn" id="ha_buildInvoice">${ic('doc')} Tạo bảng kê từ đơn hàng</button>`,
      run(draw) {
        const m = U.today().slice(0, 7);
        overlay(`<form class="modal sm" id="bf"><div class="m-h"><h3>Tạo bảng kê</h3><button type="button" class="btn ghost icon" data-close>${ic('x')}</button></div>
          <div class="m-b"><div class="field"><label>Khách hàng</label><select name="c" required>${Store.all('customer').map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
          <div class="form-grid"><div class="field"><label>Từ ngày</label><input type="date" name="f" value="${m}-01"></div><div class="field"><label>Đến ngày</label><input type="date" name="t" value="${U.today()}"></div></div>
          <div class="field"><label>VAT</label><select name="v"><option>8%</option><option>10%</option><option>0%</option><option>Không chịu thuế</option></select></div><div class="hint">Lấy các đơn hàng "Hoàn thành" của khách hàng trong khoảng ngày.</div></div>
          <div class="m-f"><button type="button" class="btn" data-close>Huỷ</button><button class="btn primary">Tạo bảng kê</button></div></form>`, (layer, close) => {
          $('#bf', layer).onsubmit = e => {
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
    ,
    calcSalary: {
      btn: `<button class="btn" id="ha_calcSalary">${ic('cash')} Tính lương tháng</button>`,
      run(draw) {
        overlay(`<form class="modal sm" id="sf"><div class="m-h"><h3>Tính lương tài xế</h3><button type="button" class="btn ghost icon" data-close>${ic('x')}</button></div>
          <div class="m-b"><div class="field"><label>Tháng</label><input type="month" name="m" value="${U.today().slice(0, 7)}" required></div>
          <div class="hint">Lương cơ bản (hồ sơ tài xế) + lương chuyến (chuyến hoàn thành trong tháng × Định mức lương tài xế, hoặc Lương khoán theo tuyến) − tạm ứng lương tháng đó. Tài xế đã có bảng lương tháng này được bỏ qua.</div></div>
          <div class="m-f"><button type="button" class="btn" data-close>Huỷ</button><button class="btn primary">Tính lương</button></div></form>`, (layer, close) => {
          $('#sf', layer).onsubmit = e => {
            e.preventDefault(); const ym = new FormData(e.target).get('m'); if (!ym) return;
            const res = salaryFor(ym); close();
            toast(`Đã tạo ${res.created} bảng lương tháng ${ym.slice(5)}/${ym.slice(0, 4)}` + (res.skipped ? `, bỏ qua ${res.skipped} đã có` : ''));
            if (res.noNorm) setTimeout(() => alert(`${res.noNorm} chuyến chưa có định mức lương (Định mức → Định mức lương tài xế / Lương khoán) nên lương chuyến = 0.`), 50);
            draw();
          };
        });
      }
    }  };
  /* ---------- Nghiệp vụ tài chính (giai đoạn 3) ---------- */
  // Lương tháng: cơ bản + chuyến × định mức - tạm ứng lương
  function tripWage(rt) {
    const veh = Store.get('vehicle', rt.vehicle_id); const grp = veh && veh.group_id;
    const road = Store.all('road').find(x => x.from_location && x.from_location === rt.from_location && x.to_location === rt.to_location);
    if (!road) return null;
    const pick = list => list.find(x => x.road_id === road.id && x.vehicle_group === grp) || list.find(x => x.road_id === road.id && !x.vehicle_group);
    const p = pick(Store.all('payroll')) || pick(Store.all('contract_salary'));
    return p ? U.num(p.amount) : null;
  }
  function salaryFor(ym) {
    const from = ym + '-01', to = monthEnd(ym); let created = 0, skipped = 0, noNorm = 0;
    const have = new Set(Store.all('salary').filter(x => x.month === ym && x.status !== 'Đã hủy').map(x => x.driver_id));
    Store.all('driver').filter(d => d.active !== 'Không').forEach(d => {
      if (have.has(d.id)) { skipped++; return; }
      const trips = Store.all('route').filter(r => r.driver_id === d.id && r.status === 'Hoàn thành' && (r.drop_date || r.pickup_date || '') >= from && (r.drop_date || r.pickup_date || '') <= to);
      let wage = 0; trips.forEach(r => { const w = tripWage(r); if (w == null) noNorm++; else wage += w; });
      const deduct = Store.all('advance_salary').filter(a => a.driver_id === d.id && String(a.month) === String(+ym.slice(5)) && String(a.year) === ym.slice(0, 4)).reduce((s, a) => s + U.num(a.amount), 0);
      const base = U.num(d.base_salary);
      if (!base && !trips.length) return;
      Store.insert('salary', applyCalc(M.salary, { code: Store.nextCode('salary', 'BL'), driver_id: d.id, month: ym, status: 'Tạo mới', base, trip_salary: wage, allowance: 0, deduct, trips: trips.length, note: `Tự tính: ${trips.length} chuyến hoàn thành` }));
      created++;
    });
    return { created, skipped, noNorm };
  }
  // Bảng kê: cập nhật trạng thái thanh toán theo phiếu thu
  function syncInvoice(id) {
    const inv = id && Store.get('invoice', id); if (!inv || inv._deleted) return;
    const paid = Store.all('receipt_voucher').filter(x => x.invoice_id === id).reduce((s, x) => s + U.num(x.amount), 0);
    const total = U.num(inv.total) || U.num(inv.amount);
    const pay = paid <= 0 ? 'Chưa thanh toán' : paid >= total ? 'Đã thanh toán' : 'Thanh toán chưa đủ';
    const patch = {};
    if (inv.pay_status !== pay) patch.pay_status = pay;
    if (pay === 'Đã thanh toán' && !['Đã thu tiền', 'Đã hủy'].includes(inv.status)) patch.status = 'Đã thu tiền';
    if (pay !== 'Đã thanh toán' && inv.status === 'Đã thu tiền') patch.status = 'Đã xác nhận';
    if (Object.keys(patch).length) Store.update('invoice', id, patch);
  }
  const AFTER_SAVE = {
    receipt_voucher: (r, old) => { syncInvoice(r && r.invoice_id); if (old && old.invoice_id && (!r || old.invoice_id !== r.invoice_id)) syncInvoice(old.invoice_id); }
  };
  // Cảnh báo trước khi lưu (trả về câu hỏi xác nhận, rỗng = không cảnh báo)
  const BEFORE_SAVE = {
    payment_voucher(r) { return r.kind === 'Tạm ứng cho tài xế' && !r.driver_id ? 'Phiếu tạm ứng chưa chọn tài xế nên tài xế sẽ không nhận được thông báo trên App.\nVẫn lưu?' : ''; },
    revenue(r, selfId) {
      const dup = Store.all('revenue').find(x => x.id !== selfId && x.status !== 'Từ chối' && (x.type || '') === (r.type || '') &&
        ((r.order_id && x.order_id === r.order_id) || (x.vehicle_id === r.vehicle_id && x.date === r.date && U.num(x.amount) === U.num(r.amount))));
      return dup ? `Có thể trùng doanh thu: phiếu ${dup.code} (${U.date(dup.date)}, ${Store.label('vehicle', dup.vehicle_id)}, ${U.money(dup.amount)} đ, ${dup.type || ''}).\nVẫn lưu?` : '';
    }
  };  function reviewModal(title, rows, img, done) {
    overlay(`<div class="modal sm"><div class="m-h"><h3>${title}</h3><button class="btn ghost icon" data-close>${ic('x')}</button></div>
      <div class="m-b"><div class="dl">${rows.map(x => `<div>${x[0]}</div><div>${x[1] || '—'}</div>`).join('')}</div>
      ${img ? `<div style="margin-top:12px">${Store.img(img, 'data-zoom style="max-width:100%;border-radius:8px" alt="Chứng từ"')}</div>` : '<div class="muted" style="margin-top:10px">Không có ảnh chứng từ</div>'}
      <div class="field" style="margin-top:14px"><label for="rr">Lý do (khi từ chối)</label><input id="rr"></div></div>
      <div class="m-f"><button class="btn danger" id="rj">${ic('x')} Từ chối</button><button class="btn ok" id="ap">${ic('check')} Duyệt / Xác nhận</button></div></div>`,
      (layer, close) => {
        $('#ap', layer).onclick = () => { close(); done(true); };
        $('#rj', layer).onclick = () => { const why = $('#rr', layer).value.trim(); if (!why) { $('#rr', layer).focus(); $('#rr', layer).placeholder = 'Nhập lý do từ chối'; return; } close(); done(why); };
      });
  }

  /* ---------- Charts ---------- */
  function barChart(months, series) {
    const W = 560, H = 240, L = 56, B = 26, T = 10, R = 8;
    const max = Math.max(1, ...series.flatMap(s => s.values)); const nice = niceMax(max);
    const gw = (W - L - R) / months.length; const bw = Math.min(24, (gw - 14) / series.length);
    const y = v => T + (H - T - B) * (1 - v / nice);
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Biểu đồ ${series.map(s => s.name).join(', ')}">`;
    for (let i = 0; i <= 4; i++) { const v = nice * i / 4; svg += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${short(v)}</text>`; }
    months.forEach((m, i) => {
      svg += `<rect class="hit" x="${L + gw * i}" y="${T}" width="${gw}" height="${H - T - B}" fill="transparent" data-i="${i}" rx="6"/>`;
      const x0 = L + gw * i + (gw - bw * series.length - 2 * (series.length - 1)) / 2;
      series.forEach((s, j) => { const v = s.values[i]; const x = x0 + j * (bw + 2); const h = Math.max(0, y(0) - y(v)); svg += `<path d="${roundTop(x, y(v), bw, h)}" style="fill:${s.color};pointer-events:none"/>`; });
      svg += `<text x="${L + gw * i + gw / 2}" y="${H - 8}" text-anchor="middle">${m.slice(5)}/${m.slice(2, 4)}</text>`;
    });
    svg += `<line class="ax" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/></svg>`;
    const id = 'c' + U.uid();
    setTimeout(() => {
      const box = document.getElementById(id); if (!box) return; const tt = $('.tt', box);
      $$('rect[data-i]', box).forEach(r => {
        r.onmousemove = e => { const i = +r.dataset.i; const rect = box.getBoundingClientRect(); tt.style.display = 'block'; tt.innerHTML = `<b>Tháng ${months[i].slice(5)}/${months[i].slice(0, 4)}</b><br>` + series.map(s => `<span style="color:${s.color}">■</span> ${s.name}: <b>${U.money(s.values[i])}</b>`).join('<br>') + (series.length === 2 ? `<br>Lợi nhuận: <b class="${series[0].values[i] - series[1].values[i] >= 0 ? 'pos' : 'neg'}">${U.money(series[0].values[i] - series[1].values[i])}</b>` : ''); let lx = e.clientX - rect.left + 14; if (lx + tt.offsetWidth > rect.width) lx = e.clientX - rect.left - tt.offsetWidth - 14; tt.style.left = lx + 'px'; tt.style.top = Math.max(0, e.clientY - rect.top - 20) + 'px'; };
        r.onmouseleave = () => { tt.style.display = 'none'; };
      });
    });
    return `<div class="legend">${series.map(s => `<span style="--c:${s.color}">${s.name}</span>`).join('')}</div><div class="chart" id="${id}">${svg}<div class="tt"></div></div>`;
  }
  const roundTop = (x, y, w, h) => { const r = Math.min(4, h, w / 2); return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`; };
  const niceMax = v => { const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };
  const hbars = (items, color) => { const max = Math.max(1, ...items.map(i => i[1])); return items.map(([l, v]) => `<div class="hbar"><span class="lbl" title="${esc(l)}">${esc(l)}</span><div class="track"><div class="fill" style="width:${v / max * 100}%;${color ? 'background:' + color : ''}"></div></div><span class="val">${U.money(v)}</span></div>`).join(''); };

  function expiries() {
    const out = []; const t = new Date(U.today());
    const add = (what, who, d, href) => { if (!d) return; const days = Math.round((new Date(d) - t) / 864e5); out.push({ what, who, d, days, href }); };
    Store.all('vehicle').forEach(v => { add('Đăng kiểm', v.plate, v.inspection_exp, '#/m/vehicle?id=' + v.id); add('Bảo hiểm', v.plate, v.insurance_exp, '#/m/vehicle?id=' + v.id); add('Phí đường bộ', v.plate, v.road_fee_exp, '#/m/vehicle?id=' + v.id); });
    Store.all('driver').forEach(d => add('GPLX', d.name, d.license_exp, '#/m/driver?id=' + d.id));
    Store.all('trailer').forEach(r => add('Đăng kiểm rơ moóc', r.plate, r.inspection_exp, '#/m/trailer?id=' + r.id));
    return out.sort((a, b) => a.days - b.days);
  }
  const head = (title, desc, acts = '') => `<div class="page-head"><div><h1>${title}</h1>${desc ? `<div class="desc">${desc}</div>` : ''}</div><div class="grow"></div><div class="acts">${acts}</div></div>`;
  function periodRange(p) {
    const ym = U.today().slice(0, 7), y = ym.slice(0, 4), m = +ym.slice(5);
    if (p === 'pm') { const k = U.addMonths(ym, -1); return { from: k + '-01', to: monthEnd(k), prev: { from: U.addMonths(ym, -2) + '-01', to: monthEnd(U.addMonths(ym, -2)) }, label: 'tháng trước' }; }
    if (p === 'q') { const qs = Math.floor((m - 1) / 3) * 3 + 1; const a = y + '-' + String(qs).padStart(2, '0'); const pa = U.addMonths(a, -3); return { from: a + '-01', to: monthEnd(U.addMonths(a, 2)), prev: { from: pa + '-01', to: monthEnd(U.addMonths(pa, 2)) }, label: 'quý này' }; }
    if (p === 'y') return { from: y + '-01-01', to: y + '-12-31', prev: { from: (y - 1) + '-01-01', to: (y - 1) + '-12-31' }, label: 'năm nay' };
    const pm = U.addMonths(ym, -1); return { from: ym + '-01', to: monthEnd(ym), prev: { from: pm + '-01', to: monthEnd(pm) }, label: 'tháng này' };
  }

  /* ---------- Pages ---------- */
  // Trang báo cáo có chọn khoảng ngày + xuất Excel; body(st, redraw) trả về HTML
  function exportTable(t, name) { if (!t) return; const lines = [...t.rows].map(tr => [...tr.cells].map(c => '"' + c.innerText.replace(/"/g, '""') + '"').join(',')); download(name + '.csv', '﻿' + lines.join('\r\n'), 'text/csv'); }
  function rangePage(el, key, title, sub, body) {
    const ym = U.today().slice(0, 7); const st = PAGES[key] = PAGES[key] || { from: ym + '-01', to: monthEnd(ym) };
    el.innerHTML = head(title, sub, `<button class="btn" id="px">${ic('dl')} Xuất Excel</button>`) + `
      <div class="card" style="margin-bottom:16px"><div class="toolbar"><span class="daterange">${ic('clock')}<input type="date" class="input sm" id="f1" value="${st.from}"> – <input type="date" class="input sm" id="f2" value="${st.to}"></span>
      <div class="seg">${[['m', 'Tháng này'], ['pm', 'Tháng trước'], ['q', 'Quý này'], ['y', 'Năm nay']].map(([k, l]) => `<button data-q="${k}">${l}</button>`).join('')}</div></div></div><div id="rb"></div>`;
    const draw = () => { $('#rb', el).innerHTML = body(st, draw); };
    $('#f1', el).onchange = e => { st.from = e.target.value; draw(); }; $('#f2', el).onchange = e => { st.to = e.target.value; draw(); };
    $$('[data-q]', el).forEach(b => b.onclick = () => { const r = periodRange(b.dataset.q); st.from = r.from; st.to = r.to; $('#f1', el).value = st.from; $('#f2', el).value = st.to; draw(); });
    $('#px', el).onclick = () => { const ts = $$('#rb table', el); exportTable(ts[ts.length - 1], key.replace('_', '') + '_' + st.from + '_' + st.to); };
    draw();
  }
  const PAGES = {
    dashboard(el) {
      const per = PAGES._per || 'm'; const R = periodRange(per);
      const cur = Store.finance(R), prev = Store.finance(R.prev);
      const ym = U.today().slice(0, 7);
      const months = [...Array(6)].map((_, i) => U.addMonths(ym, i - 5));
      const fin = months.map(m => Store.finance({ from: m + '-01', to: monthEnd(m) }));
      const routes = Store.all('route'); const running = routes.filter(r => r.status === 'Đang chạy').length;
      const trips = routes.filter(r => r.pickup_date >= R.from && r.pickup_date <= R.to && r.status !== 'Hủy').length;
      const pend = Store.all('cost_request').filter(r => r.status === 'Chờ duyệt' || r.status === 'Kế toán đã duyệt');
      const pendRev = Store.all('revenue').filter(r => r.status === 'Chờ xác nhận');
      const vehs = Store.all('vehicle');
      const byV = vehs.map(v => ({ v, ...Store.finance({ from: R.from, to: R.to, vehicle: v.id }) })).sort((a, b) => b.profit - a.profit);
      const maxAbs = Math.max(1, ...byV.map(x => Math.abs(x.profit)));
      const delta = (a, b, invert) => { if (!b) return ''; const up = a >= b; const good = invert ? !up : up; return `<span class="delta ${good ? 'up' : 'down'}">${up ? '▲' : '▼'} ${pct(Math.abs(a - b), Math.abs(b))}</span>`; };
      const s = session(); const hr = new Date().getHours();
      const todo = [
        ...pend.slice(0, 5).map(r => `<div class="todo"><span class="ic" style="background:var(--warn-bg);color:var(--warn)">${ic('receipt')}</span><div class="tx"><div><a href="#/m/cost_request?id=${r.id}">${esc(r.code)}</a> · ${esc(Store.label('cost_category', r.category_id))}</div><small>${esc(Store.label('vehicle', r.vehicle_id))} · ${esc(Store.label('driver', r.driver_id))}</small></div><b class="num">${U.money(r.amount)}</b></div>`),
        ...pendRev.slice(0, 3).map(r => `<div class="todo"><span class="ic" style="background:var(--info-bg);color:var(--info)">${ic('dollar')}</span><div class="tx"><div><a href="#/m/revenue?id=${r.id}">${esc(r.code)}</a> · ${esc(r.type)}</div><small>${esc(Store.label('vehicle', r.vehicle_id))} · chờ xác nhận</small></div><b class="num">${U.money(r.amount)}</b></div>`),
        ...expiries().filter(x => x.days <= 30).slice(0, 5).map(x => `<div class="todo"><span class="ic" style="background:var(--bad-bg);color:var(--bad)">${ic('clock')}</span><div class="tx"><div><a href="${x.href}">${esc(x.what)}</a> · ${esc(x.who)}</div><small>Hết hạn ${U.date(x.d)}</small></div>${chip(x.days < 0 ? 'Quá ' + (-x.days) + ' ngày' : 'Còn ' + x.days + ' ngày', x.days < 0 ? 'bad' : 'warn')}</div>`)
      ].join('');
      el.innerHTML = head(`${hr < 11 ? 'Chào buổi sáng' : hr < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'}, ${esc(s.name || '')}`, `Tình hình kinh doanh ${R.label} · ${U.date(R.from)} – ${U.date(R.to)}`,
        `<div class="seg" id="per">${[['m', 'Tháng này'], ['pm', 'Tháng trước'], ['q', 'Quý này'], ['y', 'Năm nay']].map(([k, l]) => `<button data-p="${k}" class="${per === k ? 'on' : ''}">${l}</button>`).join('')}</div>`) + `
      <div class="stack">
        <div class="kpis">
          <button class="kpi" data-go="#/m/revenue"><div class="top"><span class="ico">${ic('dollar')}</span>Doanh thu</div><div class="v">${U.money(cur.revenue)}</div><div class="s">${delta(cur.revenue, prev.revenue)} so với kỳ trước</div></button>
          <button class="kpi" data-go="#/p/rpt_cat"><div class="top"><span class="ico">${ic('receipt')}</span>Chi phí</div><div class="v">${U.money(cur.cost)}</div><div class="s">${delta(cur.cost, prev.cost, true)} so với kỳ trước</div></button>
          <button class="kpi" data-go="#/p/rpt_vehicle"><div class="top"><span class="ico">${ic('chart')}</span>Lợi nhuận gộp</div><div class="v ${cur.profit >= 0 ? 'pos' : 'neg'}">${U.money(cur.profit)}</div><div class="s">Biên lợi nhuận ${pct(cur.profit, cur.revenue)}</div></button>
          <button class="kpi" data-go="#/m/route"><div class="top"><span class="ico">${ic('truck')}</span>Chuyến xe</div><div class="v">${trips}</div><div class="s">${running} chuyến đang chạy</div></button>
          <button class="kpi" data-go="#/m/cost_request?s=Chờ duyệt"><div class="top"><span class="ico">${ic('clock')}</span>Chờ duyệt chi</div><div class="v">${pend.length}</div><div class="s">${U.money(pend.reduce((a, r) => a + U.num(r.amount), 0))} đ · ${pendRev.length} doanh thu chờ xác nhận</div></button>
        </div>
        <div class="grid2">
          <div class="card"><div class="card-h"><h3>Doanh thu và chi phí 6 tháng</h3><span class="grow"></span><a href="#/p/rpt_month">Xem 12 tháng</a></div><div class="card-b">${barChart(months, [{ name: 'Doanh thu', color: 'var(--rev)', values: fin.map(f => f.revenue) }, { name: 'Chi phí', color: 'var(--cost)', values: fin.map(f => f.cost) }])}</div></div>
          <div class="card"><div class="card-h"><h3>Chi phí theo khoản mục</h3><span class="grow"></span><a href="#/p/rpt_cat">Chi tiết</a></div><div class="card-b">${hbars(Object.entries(cur.rows.filter(r => r.kind === 'cost').reduce((a, r) => (a[r.cat] = (a[r.cat] || 0) + r.amount, a), {})).sort((a, b) => b[1] - a[1]).slice(0, 8), 'var(--cost)') || '<div class="empty">Chưa có chi phí</div>'}</div></div>
        </div>
        <div class="grid2">
          <div class="card"><div class="card-h"><h3>Hiệu quả theo đầu xe</h3><span class="grow"></span><a href="#/p/rpt_vehicle">Báo cáo lãi lỗ</a></div><div class="card-b" style="padding-top:6px;overflow-x:auto"><table class="grid"><thead><tr><th class="nosort">Biển số</th><th class="nosort">Tài xế</th><th class="num nosort">Doanh thu</th><th class="num nosort">Chi phí</th><th class="num nosort">Lợi nhuận</th><th class="nosort" style="width:120px"></th></tr></thead>
            <tbody>${byV.map(x => `<tr onclick="location.hash='#/p/rpt_vehicle/${x.v.id}'"><td class="code">${esc(x.v.plate)}</td><td>${esc(Store.label('driver', x.v.driver_id))}</td><td class="num">${U.money(x.revenue)}</td><td class="num">${U.money(x.cost)}</td><td class="num ${x.profit >= 0 ? 'pos' : 'neg'}"><b>${U.money(x.profit)}</b></td><td><div class="hbar" style="grid-template-columns:1fr;margin:0"><div class="track"><div class="fill" style="width:${Math.abs(x.profit) / maxAbs * 100}%;background:${x.profit >= 0 ? 'var(--ok)' : 'var(--bad)'}"></div></div></div></td></tr>`).join('')}</tbody></table></div></div>
          <div class="card"><div class="card-h"><h3>Việc cần xử lý</h3></div><div class="card-b" style="padding-top:4px">${todo || `<div class="empty">${ic('check')}Không có việc tồn đọng</div>`}</div></div>
        </div>
        <div class="kpis">${[['Xe trống', 'ok'], ['Xe đang vận chuyển', 'info'], ['Xe hỏng', 'bad'], ['Xe công an giữ', 'bad']].map(([st, k]) => `<a class="kpi" href="#/m/vehicle?s=${encodeURIComponent(st)}" style="text-decoration:none;color:inherit"><div class="top">${chip(st, k)}</div><div class="v">${vehs.filter(v => v.state === st).length}</div></a>`).join('')}</div>
      </div>`;
      $$('[data-go]', el).forEach(k => k.onclick = () => location.hash = k.dataset.go);
      $$('#per button', el).forEach(b => b.onclick = () => { PAGES._per = b.dataset.p; PAGES.dashboard(el); });
    },

    board(el) {
      const st = ['Khởi tạo', 'Sẵn sàng', 'Chờ tài xế xác nhận', 'Chờ nhận hàng', 'Đang vận chuyển', 'Hoàn thành'];
      const ym = U.today().slice(0, 7);
      const os = Store.all('order').filter(o => o.status !== 'Hủy' && (o.status !== 'Hoàn thành' || String(o.pickup_date) >= ym));
      el.innerHTML = head('Bảng điều vận', 'Kéo thả thẻ để đổi trạng thái đơn hàng; bấm thẻ để xem chi tiết.', `<button class="btn primary" id="nb">${ic('plus')} Đơn hàng mới</button>`) + `<div class="board">${st.map(s => { const list = os.filter(o => o.status === s); return `<div class="col" data-st="${s}"><h4>${s}<span class="chip">${list.length}</span></h4>${list.map(o => `<div class="tcard" draggable="true" data-id="${o.id}"><b>${esc(o.order_no)}</b><br>${esc(Store.label('customer', o.customer_id))}<br>${esc(Store.label('location', o.pickup_location))} → ${esc(Store.label('location', o.drop_location))}<br>${ic('truck', 'style="width:14px;height:14px"')} ${esc(Store.label('vehicle', o.vehicle_id, 'plate') || 'Chưa gán xe')} · ${U.date(o.pickup_date)}</div>`).join('')}</div>`; }).join('')}</div>`;
      const redraw = () => PAGES.board(el);
      $('#nb', el).onclick = () => openForm(M.order, null, redraw);
      $$('.tcard', el).forEach(c => { c.ondragstart = e => e.dataTransfer.setData('id', c.dataset.id); c.onclick = () => openDetail(M.order, c.dataset.id, redraw); });
      $$('.col', el).forEach(col => { col.ondragover = e => { e.preventDefault(); col.classList.add('drop'); }; col.ondragleave = () => col.classList.remove('drop'); col.ondrop = e => { e.preventDefault(); Store.update('order', e.dataTransfer.getData('id'), { status: col.dataset.st }); redraw(); }; });
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
          const liters = Store.all('route_fuel').filter(r => r.vehicle_id === sel.id && r.date >= st.from && r.date <= st.to).reduce((s, r) => s + U.num(r.liters), 0);
          detail = `<div class="grid2"><div class="card"><div class="card-h"><h3>Cơ cấu chi phí — ${esc(sel.plate)}</h3></div><div class="card-b">${hbars(cats, 'var(--cost)') || '<div class="empty">Không có chi phí</div>'}</div></div>
            <div class="card"><div class="card-h"><h3>Chỉ số</h3></div><div class="card-b"><div class="dl">
            <div>Doanh thu / chuyến</div><div class="num">${U.money(f.trips ? Math.round(f.revenue / f.trips) : 0)}</div>
            <div>Chi phí / km</div><div class="num">${U.money(f.km ? Math.round(f.cost / f.km) : 0)}</div>
            <div>Doanh thu / km</div><div class="num">${U.money(f.km ? Math.round(f.revenue / f.km) : 0)}</div>
            <div>Nhiên liệu / doanh thu</div><div class="num">${pct(f.fuel, f.revenue)}</div>
            <div>Lít dầu / 100km</div><div class="num">${f.km ? (liters / f.km * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : '—'} <span class="muted">(định mức ${sel.fuel_norm || '—'})</span></div></div></div></div></div>
            <div class="card"><div class="card-h"><h3>Chi tiết phát sinh</h3></div><div class="card-b" style="max-height:440px;overflow:auto"><table class="grid"><thead><tr><th class="nosort">Ngày</th><th class="nosort">Loại</th><th class="nosort">Nguồn</th><th class="nosort">Khoản mục</th><th class="num nosort">Thu</th><th class="num nosort">Chi</th></tr></thead><tbody>
            ${f.rows.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).map(r => `<tr><td>${U.date(r.date)}</td><td>${r.kind === 'rev' ? chip('Doanh thu', 'ok') : chip('Chi phí', 'warn')}</td><td>${esc(r.src || 'Doanh thu')}</td><td>${esc(r.cat)}</td><td class="num">${r.kind === 'rev' ? U.money(r.amount) : ''}</td><td class="num">${r.kind === 'cost' ? U.money(r.amount) : ''}</td></tr>`).join('')}</tbody></table></div></div>`;
        }
        $('#rv', el).innerHTML = `<div class="card" style="overflow:auto"><table class="grid"><thead><tr><th class="nosort">Biển số</th><th class="nosort">Tài xế</th><th class="num nosort">Chuyến</th><th class="num nosort">Km</th><th class="num nosort">Doanh thu</th><th class="num nosort">Nhiên liệu</th><th class="num nosort">Đề nghị CP</th><th class="num nosort">Sửa chữa</th><th class="num nosort">CP vận hành</th><th class="num nosort">Tổng chi phí</th><th class="num nosort">Lợi nhuận</th><th class="num nosort">Biên</th></tr></thead>
          <tbody>${rows.map(r => `<tr onclick="location.hash='#/p/rpt_vehicle/${r.v.id}'"><td class="code">${esc(r.v.plate)}</td><td>${esc(Store.label('driver', r.v.driver_id))}</td><td class="num">${r.trips}</td><td class="num">${U.money(r.km)}</td><td class="num">${U.money(r.revenue)}</td><td class="num">${U.money(r.fuel)}</td><td class="num">${U.money(r.req)}</td><td class="num">${U.money(r.rep)}</td><td class="num">${U.money(r.op)}</td><td class="num">${U.money(r.cost)}</td><td class="num ${r.profit >= 0 ? 'pos' : 'neg'}"><b>${U.money(r.profit)}</b></td><td class="num">${pct(r.profit, r.revenue)}</td></tr>`).join('')}</tbody>
          ${sel ? '' : `<tfoot><tr><td>Tổng</td><td></td><td class="num">${T('trips')}</td><td class="num">${U.money(T('km'))}</td><td class="num">${U.money(T('revenue'))}</td><td class="num">${U.money(T('fuel'))}</td><td class="num">${U.money(T('req'))}</td><td class="num">${U.money(T('rep'))}</td><td class="num">${U.money(T('op'))}</td><td class="num">${U.money(T('cost'))}</td><td class="num">${U.money(T('profit'))}</td><td class="num">${pct(T('profit'), T('revenue'))}</td></tr></tfoot>`}</table></div>` + detail;
      };
      el.innerHTML = head('Lãi lỗ theo đầu xe', 'Doanh thu = phiếu doanh thu đã xác nhận. Chi phí = nhiên liệu + đề nghị chi phí đã duyệt + phiếu sửa chữa đã duyệt + chi phí vận hành.', `<button class="btn" id="px">${ic('dl')} Xuất Excel</button>`) + `
        <div class="card" style="margin-bottom:16px"><div class="toolbar"><select class="input sm" id="vv" style="width:auto"><option value="">Tất cả xe</option>${vehs.map(v => `<option value="${v.id}" ${v.id === vid ? 'selected' : ''}>${esc(v.plate)}</option>`).join('')}</select>
        <span class="daterange">${ic('clock')}<input type="date" class="input sm" id="f1" value="${st.from}"> – <input type="date" class="input sm" id="f2" value="${st.to}"></span>
        <div class="seg">${[['m', 'Tháng này'], ['pm', 'Tháng trước'], ['q', 'Quý này'], ['y', 'Năm nay']].map(([k, l]) => `<button data-q="${k}">${l}</button>`).join('')}</div></div></div><div class="stack" id="rv"></div>`;
      $('#vv', el).onchange = e => location.hash = '#/p/rpt_vehicle' + (e.target.value ? '/' + e.target.value : '');
      $('#f1', el).onchange = e => { st.from = e.target.value; draw(); }; $('#f2', el).onchange = e => { st.to = e.target.value; draw(); };
      $$('[data-q]', el).forEach(b => b.onclick = () => { const r = periodRange(b.dataset.q); st.from = r.from; st.to = r.to; $('#f1', el).value = st.from; $('#f2', el).value = st.to; draw(); });
      $('#px', el).onclick = () => { const t = $('#rv table', el); const lines = [...t.rows].map(tr => [...tr.cells].map(c => '"' + c.innerText.replace(/"/g, '""') + '"').join(',')); download('lai_lo_dau_xe_' + st.from + '_' + st.to + '.csv', '﻿' + lines.join('\r\n'), 'text/csv'); };
      draw();
    },

    rptMonth(el) {
      const ym = U.today().slice(0, 7);
      const months = [...Array(12)].map((_, i) => U.addMonths(ym, i - 11));
      const fin = months.map(m => Store.finance({ from: m + '-01', to: monthEnd(m) }));
      el.innerHTML = head('Doanh thu - chi phí theo tháng', '12 tháng gần nhất (VNĐ)') + `<div class="stack">
        <div class="card"><div class="card-b">${barChart(months, [{ name: 'Doanh thu', color: 'var(--rev)', values: fin.map(f => f.revenue) }, { name: 'Chi phí', color: 'var(--cost)', values: fin.map(f => f.cost) }])}</div></div>
        <div class="card" style="overflow:auto"><table class="grid"><thead><tr><th class="nosort">Tháng</th><th class="num nosort">Doanh thu</th><th class="num nosort">Chi phí</th><th class="num nosort">Lợi nhuận</th><th class="num nosort">Biên</th></tr></thead><tbody>
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
        $('#rc', el).innerHTML = `<div class="grid2"><div class="card"><div class="card-h"><h3>Theo khoản mục · tổng ${U.money(f.cost)} đ</h3></div><div class="card-b">${hbars(cats, 'var(--cost)') || '<div class="empty">Không có dữ liệu</div>'}</div></div><div class="card"><div class="card-h"><h3>Theo nguồn</h3></div><div class="card-b">${hbars(srcs, 'var(--cost)')}</div></div></div>
        <div class="card" style="overflow:auto"><table class="grid"><thead><tr><th class="nosort">Khoản mục</th>${vehs.map(v => `<th class="num nosort">${esc(v.plate)}</th>`).join('')}<th class="num nosort">Tổng</th><th class="num nosort">Tỷ trọng</th></tr></thead><tbody>
        ${cats.map(([c, t]) => `<tr><td>${esc(c)}</td>${vehs.map(v => `<td class="num">${U.money(cost.filter(r => r.cat === c && r.vehicle === v.id).reduce((s, r) => s + r.amount, 0))}</td>`).join('')}<td class="num"><b>${U.money(t)}</b></td><td class="num">${pct(t, f.cost)}</td></tr>`).join('')}</tbody></table></div>`;
      };
      el.innerHTML = head('Chi phí theo khoản mục', '', `<span class="daterange">${ic('clock')}<input type="date" class="input sm" id="f1" value="${st.from}"> – <input type="date" class="input sm" id="f2" value="${st.to}"></span>`) + '<div class="stack" id="rc"></div>';
      $('#f1', el).onchange = e => { st.from = e.target.value; draw(); }; $('#f2', el).onchange = e => { st.to = e.target.value; draw(); };
      draw();
    },

    rptExpiry(el) {
      const list = expiries();
      el.innerHTML = head('Cảnh báo hạn giấy tờ', 'Đăng kiểm, bảo hiểm, phí đường bộ của xe/rơ moóc và GPLX của tài xế.') + `<div class="card" style="overflow:auto"><table class="grid"><thead><tr><th class="nosort">Loại giấy tờ</th><th class="nosort">Xe / Tài xế</th><th class="nosort">Ngày hết hạn</th><th class="nosort">Tình trạng</th></tr></thead><tbody>
        ${list.map(x => `<tr onclick="location.hash='${x.href}'"><td>${esc(x.what)}</td><td class="code">${esc(x.who)}</td><td>${U.date(x.d)}</td><td>${x.days < 0 ? chip('Đã hết hạn ' + (-x.days) + ' ngày', 'bad') : x.days <= 30 ? chip('Còn ' + x.days + ' ngày', 'warn') : chip('Còn ' + x.days + ' ngày', 'ok')}</td></tr>`).join('') || '<tr><td colspan="4"><div class="empty">Chưa nhập hạn giấy tờ</div></td></tr>'}</tbody></table></div>`;
    },

    // Lãi lỗ theo chuyến: doanh thu gắn chuyến/đơn của chuyến − chi phí biến đổi của chuyến (không gồm chi phí cố định theo xe)
    rptTrip(el) {
      rangePage(el, '_rt', 'Lãi lỗ theo chuyến', 'Doanh thu đã xác nhận gắn với chuyến (hoặc đơn hàng của chuyến) − nhiên liệu − đề nghị chi phí đã duyệt của chuyến. Chưa gồm chi phí cố định theo xe.', st => {
        const revs = Store.all('revenue').filter(r => r.status === 'Đã xác nhận');
        const fuels = Store.all('route_fuel'); const reqs = Store.all('cost_request').filter(x => APPROVED.includes(x.status));
        const rows = Store.all('route').filter(r => r.status !== 'Hủy' && (r.pickup_date || '') >= st.from && (r.pickup_date || '') <= st.to).map(rt => {
          const ids = new Set(rt.order_ids || []);
          const rev = revs.filter(x => x.route_id === rt.id || (!x.route_id && x.order_id && ids.has(x.order_id))).reduce((s, x) => s + U.num(x.amount), 0);
          const fuel = fuels.filter(x => x.route_id === rt.id).reduce((s, x) => s + U.num(x.total), 0);
          const cost = reqs.filter(x => x.route_id === rt.id).reduce((s, x) => s + U.num(x.amount), 0);
          return { rt, rev, fuel, cost, profit: rev - fuel - cost };
        }).sort((a, b) => String(b.rt.pickup_date).localeCompare(String(a.rt.pickup_date)));
        const T = k => rows.reduce((s, r) => s + r[k], 0); const loss = rows.filter(r => r.profit < 0).length;
        return `<div class="mini-kpis" style="margin-bottom:14px"><div><small>Số chuyến</small><b>${rows.length}</b></div><div><small>Lợi nhuận chuyến</small><b class="${T('profit') >= 0 ? 'pos' : 'neg'}">${short(T('profit'))}</b></div><div><small>Chuyến lỗ</small><b class="${loss ? 'neg' : ''}">${loss}</b></div></div>
        <div class="card" style="overflow:auto"><table class="grid"><thead><tr><th class="nosort">Mã chuyến</th><th class="nosort">Ngày</th><th class="nosort">Xe</th><th class="nosort">Tài xế</th><th class="nosort">Tuyến</th><th class="num nosort">Km</th><th class="num nosort">Doanh thu</th><th class="num nosort">Nhiên liệu</th><th class="num nosort">Chi phí chuyến</th><th class="num nosort">Lãi / lỗ</th><th class="num nosort">Biên</th></tr></thead><tbody>
        ${rows.map(r => `<tr onclick="location.hash='#/m/route?id=${r.rt.id}'"><td class="code">${esc(r.rt.code)}</td><td>${U.date(r.rt.pickup_date)}</td><td>${esc(Store.label('vehicle', r.rt.vehicle_id, 'plate'))}</td><td>${esc(Store.label('driver', r.rt.driver_id))}</td><td>${esc([Store.label('location', r.rt.from_location), Store.label('location', r.rt.to_location)].filter(Boolean).join(' → '))}</td><td class="num">${U.money(r.rt.km_actual)}</td><td class="num">${U.money(r.rev)}</td><td class="num">${U.money(r.fuel)}</td><td class="num">${U.money(r.cost)}</td><td class="num ${r.profit >= 0 ? 'pos' : 'neg'}"><b>${U.money(r.profit)}</b></td><td class="num">${pct(r.profit, r.rev)}</td></tr>`).join('') || '<tr><td colspan="11"><div class="empty">Không có chuyến trong khoảng ngày</div></td></tr>'}</tbody>
        <tfoot><tr><td>Tổng</td><td></td><td></td><td></td><td></td><td class="num">${U.money(rows.reduce((s, r) => s + U.num(r.rt.km_actual), 0))}</td><td class="num">${U.money(T('rev'))}</td><td class="num">${U.money(T('fuel'))}</td><td class="num">${U.money(T('cost'))}</td><td class="num">${U.money(T('profit'))}</td><td class="num">${pct(T('profit'), T('rev'))}</td></tr></tfoot></table></div>`;
      });
    },

    // Dầu: định mức (km chuyến hoàn thành × lít/100km) so với lít thực đổ
    rptFuel(el) {
      rangePage(el, '_rf', 'Dầu: định mức và thực tế', 'Định mức = km thực tế các chuyến hoàn thành × định mức của xe (hoặc Định mức dầu theo chủng loại; chuyến rỗng dùng mức không hàng). Thực tế = số lít đổ trong khoảng ngày. Vượt quá 5% được cảnh báo.', st => {
        const rows = Store.all('vehicle').map(v => {
          const q = Store.all('fuel_quota').find(x => x.vehicle_group === v.group_id) || {};
          const loaded = U.num(v.fuel_norm) || U.num(q.loaded); const empty = U.num(q.empty) || loaded;
          const rts = Store.all('route').filter(r => r.vehicle_id === v.id && r.status === 'Hoàn thành' && (r.pickup_date || '') >= st.from && (r.pickup_date || '') <= st.to);
          const km = rts.reduce((s, r) => s + U.num(r.km_actual), 0);
          const norm = Math.round(rts.reduce((s, r) => s + U.num(r.km_actual) * (r.type === 'Chuyến rỗng' ? empty : loaded) / 100, 0));
          const fu = Store.all('route_fuel').filter(r => r.vehicle_id === v.id && (r.date || '') >= st.from && (r.date || '') <= st.to);
          const lit = fu.reduce((s, r) => s + U.num(r.liters), 0); const money = fu.reduce((s, r) => s + U.num(r.total), 0);
          const diff = lit - norm; const rate = norm ? diff / norm : 0; const price = lit ? money / lit : U.num(Store.settings().fuel_price);
          return { v, loaded, km, norm, lit, diff, rate, value: Math.round(diff * price) };
        });
        const flag = r => !r.loaded ? chip('Chưa có định mức', 'warn') : !r.norm ? chip('Không có chuyến', '') : r.rate > 0.05 ? chip('Vượt ' + pct(r.diff, r.norm), 'bad') : r.rate < -0.05 ? chip('Thấp hơn ' + pct(-r.diff, r.norm), 'info') : chip('Đạt', 'ok');
        return `<div class="card" style="overflow:auto"><table class="grid"><thead><tr><th class="nosort">Biển số</th><th class="num nosort">Định mức (l/100km)</th><th class="num nosort">Km chạy</th><th class="num nosort">Lít định mức</th><th class="num nosort">Lít thực tế</th><th class="num nosort">Chênh lệch (lít)</th><th class="num nosort">Giá trị chênh lệch</th><th class="nosort">Đánh giá</th></tr></thead><tbody>
        ${rows.map(r => `<tr onclick="location.hash='#/p/rpt_vehicle/${r.v.id}'"><td class="code">${esc(r.v.plate)}</td><td class="num">${r.loaded || '—'}</td><td class="num">${U.money(r.km)}</td><td class="num">${U.money(r.norm)}</td><td class="num">${U.money(r.lit)}</td><td class="num ${r.diff > 0 ? 'neg' : ''}">${r.diff > 0 ? '+' : ''}${U.money(r.diff)}</td><td class="num ${r.value > 0 ? 'neg' : ''}">${U.money(r.value)}</td><td>${flag(r)}</td></tr>`).join('')}</tbody></table></div>`;
      });
    },

    // Công nợ khách hàng: doanh thu công nợ đã xác nhận (sau VAT) − phiếu thu; tuổi nợ theo hạn công nợ của khách (thu tiền trừ dần khoản cũ nhất)
    rptDebt(el) {
      const today = U.today(); const dd = (a, b) => Math.round((new Date(a) - new Date(b)) / 864e5);
      const B = [['Trong hạn', x => x <= 0], ['Quá hạn 1–30', x => x > 0 && x <= 30], ['31–60', x => x > 30 && x <= 60], ['61–90', x => x > 60 && x <= 90], ['> 90 ngày', x => x > 90]];
      const rows = Store.all('customer').map(c => {
        const days = U.num(c.debt_days) || 30;
        const items = Store.all('revenue').filter(r => r.customer_id === c.id && r.status === 'Đã xác nhận' && r.collect === 'Công nợ')
          .map(r => ({ date: r.date, amt: U.num(r.total) || (U.num(r.amount) + Math.round(U.num(r.amount) * TMG_vatRate(r.vat))) })).sort((a, b) => String(a.date).localeCompare(String(b.date)));
        const owed = items.reduce((s, x) => s + x.amt, 0);
        const paid = Store.all('receipt_voucher').filter(r => r.customer_id === c.id).reduce((s, r) => s + U.num(r.amount), 0);
        let left = paid; const age = B.map(() => 0);
        items.forEach(x => { const use = Math.min(left, x.amt); left -= use; const rest = x.amt - use; if (rest <= 0) return; const over = dd(today, x.date) - days; age[B.findIndex(b => b[1](over))] += rest; });
        return { c, days, owed, paid, debt: owed - paid, age };
      }).filter(r => r.owed || r.paid).sort((a, b) => b.debt - a.debt);
      const T = k => rows.reduce((s, r) => s + r[k], 0); const TA = i => rows.reduce((s, r) => s + r.age[i], 0);
      const overdue = rows.reduce((s, r) => s + r.age.slice(1).reduce((a, b) => a + b, 0), 0);
      el.innerHTML = head('Công nợ khách hàng', `Tính đến ${U.date(today)}. Phát sinh = doanh thu hình thức "Công nợ" đã xác nhận (sau VAT). Phiếu thu trừ vào khoản phát sinh cũ nhất trước.`, `<button class="btn" id="px">${ic('dl')} Xuất Excel</button>`) + `
        <div class="mini-kpis" style="margin-bottom:14px"><div><small>Tổng còn phải thu</small><b>${short(T('debt'))}</b></div><div><small>Đã quá hạn</small><b class="${overdue ? 'neg' : ''}">${short(overdue)}</b></div><div><small>Đã thu</small><b>${short(T('paid'))}</b></div></div>
        <div class="card" style="overflow:auto" id="rb"><table class="grid"><thead><tr><th class="nosort">Khách hàng</th><th class="num nosort">Hạn (ngày)</th><th class="num nosort">Phát sinh</th><th class="num nosort">Đã thu</th><th class="num nosort">Còn nợ</th>${B.map(b => `<th class="num nosort">${b[0]}</th>`).join('')}</tr></thead><tbody>
        ${rows.map(r => `<tr onclick="location.hash='#/m/customer?id=${r.c.id}'"><td>${esc(r.c.name)}</td><td class="num">${r.days}</td><td class="num">${U.money(r.owed)}</td><td class="num">${U.money(r.paid)}</td><td class="num"><b>${U.money(r.debt)}</b></td>${r.age.map((a, i) => `<td class="num ${i && a ? 'neg' : ''}">${a ? U.money(a) : ''}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${5 + B.length}"><div class="empty">Không có công nợ</div></td></tr>`}</tbody>
        <tfoot><tr><td>Tổng</td><td></td><td class="num">${U.money(T('owed'))}</td><td class="num">${U.money(T('paid'))}</td><td class="num">${U.money(T('debt'))}</td>${B.map((b, i) => `<td class="num">${U.money(TA(i))}</td>`).join('')}</tr></tfoot></table></div>`;
      $('#px', el).onclick = () => exportTable($('#rb table', el), 'cong_no_khach_hang_' + today);
    },

    // Quyết toán tạm ứng tài xế theo chuyến
    rptSettle(el) {
      rangePage(el, '_rs', 'Quyết toán tạm ứng tài xế', 'Theo từng chuyến hoàn thành: tạm ứng chuyến − chi phí tài xế đã ứng (đề nghị đã duyệt, chưa chi) − dầu tài xế tự trả. Số dương: tài xế hoàn lại; số âm: công ty trả thêm.', (st, redraw) => {
        const rows = Store.all('route').filter(r => r.status === 'Hoàn thành' && (r.pickup_date || '') >= st.from && (r.pickup_date || '') <= st.to)
          .map(rt => ({ rt, s: rt.settle === 'Đã quyết toán' ? null : settlement(rt) })).sort((a, b) => String(b.rt.pickup_date).localeCompare(String(a.rt.pickup_date)));
        const open = rows.filter(r => r.s);
        const byDrv = Object.entries(open.reduce((a, r) => { const k = r.rt.driver_id || ''; a[k] = (a[k] || 0) + r.s.balance; return a; }, {})).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
        setTimeout(() => $$('[data-settle]', el).forEach(b => b.onclick = e => { e.stopPropagation(); ROW_ACTIONS.settleRoute.run(Store.get('route', b.dataset.settle), redraw); }));
        return `<div class="grid2" style="margin-bottom:14px"><div class="card"><div class="card-h"><h3>Theo tài xế (chưa quyết toán)</h3></div><div class="card-b"><div class="dl">${byDrv.map(([d, v]) => `<div>${esc(Store.label('driver', d) || '—')}</div><div class="num ${v < 0 ? 'neg' : ''}">${v >= 0 ? 'Hoàn lại ' + U.money(v) : 'Công ty trả ' + U.money(-v)} đ</div>`).join('') || '<div class="muted">Không còn chuyến chưa quyết toán</div>'}</div></div></div>
          <div class="card"><div class="card-b"><div class="mini-kpis"><div><small>Chuyến chưa quyết toán</small><b>${open.length}</b></div><div><small>Đã quyết toán</small><b>${rows.length - open.length}</b></div></div></div></div></div>
          <div class="card" style="overflow:auto"><table class="grid"><thead><tr><th class="nosort">Mã chuyến</th><th class="nosort">Ngày</th><th class="nosort">Tài xế</th><th class="nosort">Xe</th><th class="num nosort">Tạm ứng</th><th class="num nosort">Tài xế đã chi</th><th class="num nosort">Kết quả</th><th class="nosort">Trạng thái</th><th class="nosort"></th></tr></thead><tbody>
          ${rows.map(r => { const v = r.s ? r.s.balance : U.num(r.rt.settle_amount); return `<tr onclick="location.hash='#/m/route?id=${r.rt.id}'"><td class="code">${esc(r.rt.code)}</td><td>${U.date(r.rt.pickup_date)}</td><td>${esc(Store.label('driver', r.rt.driver_id))}</td><td>${esc(Store.label('vehicle', r.rt.vehicle_id, 'plate'))}</td><td class="num">${U.money(r.s ? r.s.advance : r.rt.advance)}</td><td class="num">${r.s ? U.money(r.s.spent) : ''}</td><td class="num ${v < 0 ? 'neg' : ''}">${v >= 0 ? 'Hoàn lại ' : 'Trả thêm '}${U.money(Math.abs(v))}</td><td>${chip(r.s ? 'Chưa quyết toán' : 'Đã quyết toán')}${r.s && r.s.pending.length ? ' ' + chip(r.s.pending.length + ' chờ duyệt', 'warn') : ''}</td><td>${r.s ? `<button class="btn sm ok" data-settle="${r.rt.id}">Quyết toán</button>` : ''}</td></tr>`; }).join('') || '<tr><td colspan="9"><div class="empty">Không có chuyến hoàn thành trong khoảng ngày</div></td></tr>'}</tbody></table></div>`;
      });
    },

    settings(el) {
      const s = Store.settings();
      el.innerHTML = head('Thiết lập công ty') + `<form class="card" id="sf" style="max-width:760px"><div class="card-b"><div class="form-grid">
        ${[['company', 'Tên công ty'], ['tax_code', 'Mã số thuế'], ['address', 'Địa chỉ'], ['phone', 'Điện thoại'], ['email', 'Email'], ['bank', 'Tài khoản ngân hàng']].map(([k, l]) => `<div class="field"><label>${l}</label><input name="${k}" value="${esc(s[k] || '')}"></div>`).join('')}
        <div class="field"><label>Giá dầu tham chiếu (đ/lít)</label><input name="fuel_price" type="number" value="${esc(s.fuel_price || '')}"></div></div>
        <button class="btn primary">${ic('check')} Lưu thiết lập</button></div></form>`;
      $('#sf', el).onsubmit = e => { e.preventDefault(); Store.saveSettings(Object.fromEntries(new FormData(e.target))); toast('Đã lưu thiết lập'); };
    },

    async backup(el) {
      const kb = n => (n / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' KB';
      const dlFile = async () => download('tmg_tms_backup_' + U.today() + '.json', await Store.exportJSON(), 'application/json');
      const list = await Store.Backups.list();
      el.innerHTML = head('Sao lưu / Khôi phục dữ liệu', 'Dữ liệu đang lưu trên trình duyệt của máy này.') + `<div class="stack">
        ${Store.isLegacy() ? '<div class="card"><div class="card-b" style="color:var(--bad)"><b>Trình duyệt này không hỗ trợ IndexedDB</b> — đang chạy chế độ dự phòng, không có sao lưu tự động. Hãy tải file sao lưu thường xuyên.</div></div>' : ''}
        <div class="grid2">
          <div class="card"><div class="card-h"><h3>Tải file sao lưu</h3></div><div class="card-b"><p class="muted" style="margin-top:0">Dữ liệu chữ dùng ${kb(Store.usage())}; ảnh chứng từ lưu riêng trong IndexedDB. File tải về gồm cả ảnh.</p><button class="btn primary" id="ex">${ic('dl')} Tải file sao lưu (.json)</button></div></div>
          <div class="card"><div class="card-h"><h3>Khôi phục từ file</h3></div><div class="card-b"><p class="muted" style="margin-top:0">Thay thế dữ liệu hiện tại (tự sao lưu bản hiện tại trước). Nhận cả file của phiên bản cũ.</p><input type="file" accept=".json" id="im"></div></div>
        </div>
        <div class="card"><div class="card-h"><h3>Bản sao lưu tự động trên máy này</h3><span class="grow"></span><button class="btn sm" id="snap">${ic('plus')} Tạo bản sao lưu ngay</button></div>
          <div class="card-b"><p class="muted" style="margin-top:0">Tự lưu 1 bản mỗi ngày (giữ 10 bản) và trước mọi thao tác ghi đè (khôi phục, khởi tạo lại, xoá sạch, nâng cấp dữ liệu).</p>
          <table class="grid"><thead><tr><th class="nosort">Thời điểm</th><th class="nosort">Lý do</th><th class="num nosort">Kích thước</th><th class="nosort"></th></tr></thead><tbody>
          ${list.map(b => `<tr><td>${U.date(b.at)}</td><td>${esc(b.reason)}</td><td class="num">${kb(b.size)}</td><td style="text-align:right"><button class="btn sm" data-dl="${b.id}">${ic('dl')} Tải</button> <button class="btn sm" data-rs="${b.id}">${ic('undo')} Khôi phục</button></td></tr>`).join('') || '<tr><td colspan="4"><div class="empty">Chưa có bản sao lưu</div></td></tr>'}</tbody></table></div></div>
        ${CLOUD ? '<div class="card"><div class="card-b muted">Đang chạy trên máy chủ: khôi phục từ file sẽ <b>gộp</b> dữ liệu trong file lên máy chủ (bản ghi cùng mã bị ghi đè), không xoá bản ghi khác. Các thao tác khởi tạo lại / xoá sạch bị tắt để bảo vệ dữ liệu dùng chung.</div></div>' : ''}
        <div class="card" ${CLOUD ? 'hidden' : ''}><div class="card-h"><h3>Dữ liệu mẫu</h3></div><div class="card-b"><p class="muted" style="margin-top:0">Hai thao tác dưới <b>bắt buộc tải file sao lưu</b> về máy trước khi thực hiện.</p><button class="btn danger" id="rs">Khởi tạo lại dữ liệu mẫu</button> <button class="btn danger" id="clr">Xoá sạch, bắt đầu dữ liệu thật</button></div></div></div>`;
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
      el.innerHTML = head('Thùng rác', 'Bản ghi bị xoá được giữ ở đây và không tính vào báo cáo. "Xoá vĩnh viễn" không thể hoàn tác.') + `<div class="card" style="overflow:auto"><table class="grid"><thead><tr><th class="nosort">Module</th><th class="nosort">Bản ghi</th><th class="nosort">Xoá lúc</th><th class="nosort">Người xoá</th><th class="nosort"></th></tr></thead><tbody>
        ${items.map(({ col, rec }) => `<tr><td>${esc(M[col] ? M[col].title : col)}</td><td class="code">${esc(titleOf(rec) || rec.id)}</td><td>${U.date(rec._deleted)}</td><td>${esc(rec._deleted_by)}</td><td style="text-align:right"><button class="btn sm" data-r="${col}|${rec.id}">${ic('undo')} Khôi phục</button> <button class="btn sm danger" data-p="${col}|${rec.id}">Xoá vĩnh viễn</button></td></tr>`).join('') || `<tr><td colspan="5"><div class="empty">${ic('trash')}Thùng rác trống</div></td></tr>`}</tbody></table></div>`;
      $$('[data-r]', el).forEach(a => a.onclick = () => { const [c, id] = a.dataset.r.split('|'); Store.restore(c, id); toast('Đã khôi phục'); PAGES.trash(el); refreshBell(); });
      $$('[data-p]', el).forEach(a => a.onclick = () => { const [c, id] = a.dataset.p.split('|'); if (confirm('Xoá vĩnh viễn bản ghi này? Không thể hoàn tác (trừ khi khôi phục từ bản sao lưu).')) { Store.purge(c, id); toast('Đã xoá vĩnh viễn'); PAGES.trash(el); } });
    }
  };
  /* ---------- Máy chủ dữ liệu & tài khoản (Supabase) ---------- */
  PAGES.cloud = async (el) => {
    const C = Store.cloud;
    if (!CLOUD) {
      el.innerHTML = head('Máy chủ dữ liệu', 'Đang chạy trên máy: dữ liệu chỉ nằm trên trình duyệt này.') + `<div class="card"><div class="card-b">Để văn phòng và điện thoại tài xế dùng chung dữ liệu: cấu hình <code>js/config.js</code> (địa chỉ + khoá anon Supabase), chạy <code>supabase/setup.sql</code>, rồi mở trang không kèm <code>?local=1</code>.</div></div>`;
      return;
    }
    const st = C.state(); const failed = C.failedList();
    const src = C.localSource(); const isAdmin = session().role === 'admin';
    el.innerHTML = head('Máy chủ dữ liệu', 'Dữ liệu dùng chung giữa văn phòng và App tài xế. Mọi thay đổi được lưu ngay trên máy, rồi tự gửi lên máy chủ (kể cả khi vừa mất mạng).', `<button class="btn primary" id="sn">${ic('refresh')} Đồng bộ ngay</button>`) + `<div class="stack">
      <div class="card"><div class="card-b"><div class="dl">
        <div>Kết nối</div><div>${st.online ? chip('Có mạng', 'ok') : chip('Mất mạng', 'bad')} ${st.realtime === 'SUBSCRIBED' ? chip('Cập nhật tức thời', 'ok') : chip('Cập nhật định kỳ 60 giây', 'warn')}</div>
        <div>Tài khoản</div><div>${esc(st.user || '')} · ${esc(ROLE_LABEL[st.role] || st.role || '')}</div>
        <div>Chờ gửi lên máy chủ</div><div>${st.pending ? chip(st.pending + ' thay đổi', 'warn') : chip('Không có', 'ok')}</div>
        <div>Đồng bộ lần cuối</div><div>${U.date(st.lastSync) || '—'}</div>
        ${st.error ? `<div>Lỗi gần nhất</div><div style="color:var(--bad)">${esc(st.error)}</div>` : ''}
      </div></div></div>
      ${failed.length ? `<div class="card"><div class="card-h"><h3>Thay đổi bị máy chủ từ chối</h3></div><div class="card-b"><table class="grid"><thead><tr><th class="nosort">Lúc</th><th class="nosort">Module</th><th class="nosort">Lý do</th></tr></thead><tbody>${failed.slice().reverse().map(f => `<tr><td>${U.date(f.at)}</td><td>${esc(M[f.col] ? M[f.col].title : f.col)}</td><td style="white-space:normal">${esc(f.msg)}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
      ${isAdmin ? `<div class="card"><div class="card-h"><h3>Đưa dữ liệu từ trình duyệt này lên máy chủ</h3></div><div class="card-b">
        ${src ? `<p class="muted" style="margin-top:0">Trình duyệt này có <b>${src.total.toLocaleString('vi-VN')}</b> bản ghi từ bản chạy trên máy (${Object.entries(src.counts).filter(([, n]) => n).slice(0, 8).map(([c, n]) => `${esc(M[c] ? M[c].title : c)}: ${n}`).join(', ')}…). Bản ghi cùng mã trên máy chủ sẽ bị ghi đè; mật khẩu và PIN dạng chữ <b>không</b> được gửi lên. Dữ liệu trên máy vẫn được giữ nguyên.</p>
          <button class="btn" id="up">${ic('dl', 'style="transform:rotate(180deg)"')} Đưa ${src.total.toLocaleString('vi-VN')} bản ghi lên máy chủ</button> <span id="upst" class="muted"></span>` : '<p class="muted" style="margin:0">Trình duyệt này không có dữ liệu chạy trên máy.</p>'}
      </div></div>` : ''}</div>`;
    $('#sn', el).onclick = async () => { await C.sync(); toast(C.state().error || 'Đã đồng bộ'); PAGES.cloud(el); };
    const up = $('#up', el);
    if (up) up.onclick = async () => {
      if (!confirm(`Đưa ${src.total} bản ghi từ trình duyệt này lên máy chủ dùng chung?`)) return;
      up.disabled = true;
      try { const n = await C.uploadLocal(k => { $('#upst', el).textContent = `Đã xử lý ${k.toLocaleString('vi-VN')}…`; }); toast(`Đã đưa ${n} bản ghi lên máy chủ`); PAGES.cloud(el); }
      catch (e) { alert('Lỗi: ' + e.message); up.disabled = false; }
    };
  };
  PAGES.accounts = async (el) => {
    const C = Store.cloud;
    if (!CLOUD) { location.hash = '#/m/admin'; return; }
    if (session().role !== 'admin') { el.innerHTML = head('Tài khoản đăng nhập') + '<div class="card"><div class="card-b muted">Chỉ quản trị viên được quản lý tài khoản.</div></div>'; return; }
    el.innerHTML = head('Tài khoản đăng nhập') + '<div class="muted">Đang tải…</div>';
    let users; try { users = await C.users.list(); } catch (e) { el.innerHTML = head('Tài khoản đăng nhập') + `<div class="card"><div class="card-b" style="color:var(--bad)">${esc(e.message)}</div></div>`; return; }
    const me = session().id; const drivers = Store.all('driver');
    const ts = v => { if (!v) return '—'; const d = new Date(v); return U.date(new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16)); }; // giờ máy chủ (UTC) -> giờ địa phương
    const redraw = () => PAGES.accounts(el);
    const act = async (fn, ok) => { try { await fn(); toast(ok); redraw(); } catch (e) { alert('Lỗi: ' + e.message); } };
    el.innerHTML = head('Tài khoản đăng nhập', 'Tài khoản do máy chủ quản lý. Mật khẩu được mã hoá, không ai xem được — chỉ đặt lại được.', `<button class="btn primary" id="nu">${ic('plus')} Thêm tài khoản văn phòng</button>`) + `<div class="stack">
      <div class="card" style="overflow:auto"><div class="card-h"><h3>Văn phòng</h3></div><div class="card-b"><table class="grid"><thead><tr><th class="nosort">Họ tên</th><th class="nosort">Email</th><th class="nosort">Vai trò</th><th class="nosort">Đăng nhập gần nhất</th><th class="nosort"></th></tr></thead><tbody>
        ${users.filter(u => u.role !== 'driver').map(u => `<tr><td class="code">${esc(u.name)}</td><td>${esc(u.email)}</td><td>${chip(ROLE_LABEL[u.role], u.role === 'admin' ? 'info' : '')}</td><td>${ts(u.last_sign_in_at)}</td><td style="text-align:right"><button class="btn sm" data-pw="${u.user_id}">Đặt lại mật khẩu</button> ${u.user_id === me ? '' : `<button class="btn sm danger" data-rm="${u.user_id}">Xoá</button>`}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card" style="overflow:auto"><div class="card-h"><h3>Tài xế</h3><span class="grow"></span><span class="muted" style="font-size:13px">Tài xế đăng nhập App bằng số điện thoại + mã PIN</span></div><div class="card-b"><table class="grid"><thead><tr><th class="nosort">Tài xế</th><th class="nosort">Số điện thoại</th><th class="nosort">Xe phụ trách</th><th class="nosort">Tài khoản</th><th class="nosort"></th></tr></thead><tbody>
        ${drivers.map(d => { const u = users.find(x => x.driver_id === d.id); return `<tr><td class="code">${esc(d.name)}</td><td>${esc(d.phone)}</td><td>${esc(Store.label('vehicle', d.vehicle_id))}</td><td>${u ? chip('Đã cấp', 'ok') + (u.last_sign_in_at ? ` <span class="muted">· ${ts(u.last_sign_in_at)}</span>` : '') : chip('Chưa cấp', 'warn')}</td><td style="text-align:right">${u ? `<button class="btn sm" data-pin="${u.user_id}">Đặt lại PIN</button> <button class="btn sm danger" data-rm="${u.user_id}">Thu hồi</button>` : `<button class="btn sm primary" data-give="${d.id}" ${d.phone ? '' : 'disabled title="Chưa có số điện thoại"'}>Cấp tài khoản</button>`}</td></tr>`; }).join('') || '<tr><td colspan="5"><div class="empty">Chưa có tài xế</div></td></tr>'}</tbody></table></div></div></div>`;
    const askPw = (title, label, min, pattern, done) => overlay(`<form class="modal sm" id="pf"><div class="m-h"><h3>${title}</h3><button type="button" class="btn ghost icon" data-close>${ic('x')}</button></div><div class="m-b"><div class="field"><label>${label}</label><input name="p" type="password" minlength="${min}" ${pattern ? `pattern="${pattern}" inputmode="numeric"` : ''} required autocomplete="new-password"></div></div><div class="m-f"><button type="button" class="btn" data-close>Huỷ</button><button class="btn primary">Lưu</button></div></form>`, (layer, close) => { $('#pf', layer).onsubmit = e => { e.preventDefault(); const v = new FormData(e.target).get('p'); close(); done(v); }; });
    $$('[data-pw]', el).forEach(b => b.onclick = () => askPw('Đặt lại mật khẩu', 'Mật khẩu mới (tối thiểu 8 ký tự)', 8, '', v => act(() => C.users.setPassword(b.dataset.pw, v), 'Đã đặt lại mật khẩu')));
    $$('[data-pin]', el).forEach(b => b.onclick = () => askPw('Đặt lại PIN tài xế', 'PIN mới (4–8 chữ số)', 4, '\\d{4,8}', v => act(() => C.users.setPassword(b.dataset.pin, v), 'Đã đặt lại PIN')));
    $$('[data-rm]', el).forEach(b => b.onclick = () => { if (confirm('Xoá tài khoản này? Người dùng sẽ không đăng nhập được nữa (dữ liệu đã nhập vẫn giữ nguyên).')) act(() => C.users.remove(b.dataset.rm), 'Đã xoá tài khoản'); });
    $$('[data-give]', el).forEach(b => b.onclick = () => { const d = Store.get('driver', b.dataset.give); askPw('Cấp tài khoản cho ' + esc(d.name), `PIN đăng nhập (4–8 chữ số) — tài xế đăng nhập bằng SĐT ${esc(d.phone)}`, 4, '\\d{4,8}', v => act(() => C.users.create(C.driverEmail(d.phone), v, d.name, 'driver', d.id), 'Đã cấp tài khoản cho ' + d.name)); });
    $('#nu', el).onclick = () => overlay(`<form class="modal sm" id="uf"><div class="m-h"><h3>Thêm tài khoản văn phòng</h3><button type="button" class="btn ghost icon" data-close>${ic('x')}</button></div><div class="m-b">
        <div class="field"><label>Họ tên</label><input name="n" required></div><div class="field"><label>Email đăng nhập</label><input name="e" type="email" required></div>
        <div class="field"><label>Vai trò</label><select name="r">${['accountant', 'dispatcher', 'admin'].map(r => `<option value="${r}">${ROLE_LABEL[r]}</option>`).join('')}</select></div>
        <div class="field"><label>Mật khẩu ban đầu (tối thiểu 8 ký tự)</label><input name="p" type="password" minlength="8" required autocomplete="new-password"></div>
        <div class="hint">Điều vận: xem/sửa mọi dữ liệu nhưng không duyệt chi phí. Kế toán: được duyệt chi. Quản trị viên: toàn quyền, kể cả quản lý tài khoản.</div></div>
        <div class="m-f"><button type="button" class="btn" data-close>Huỷ</button><button class="btn primary">Tạo tài khoản</button></div></form>`, (layer, close) => {
      $('#uf', layer).onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); close(); act(() => C.users.create(f.get('e'), f.get('p'), f.get('n'), f.get('r')), 'Đã tạo tài khoản ' + f.get('e')); };
    });
  };
  PAGES.rpt_vehicle = PAGES.rptVehicle; PAGES.rpt_month = PAGES.rptMonth; PAGES.rpt_cat = PAGES.rptCat; PAGES.rpt_expiry = PAGES.rptExpiry; PAGES.rpt_trip = PAGES.rptTrip; PAGES.rpt_fuel = PAGES.rptFuel; PAGES.rpt_debt = PAGES.rptDebt; PAGES.rpt_settle = PAGES.rptSettle;

  // Tab khác (VD: App tài xế) vừa ghi dữ liệu -> vẽ lại nếu người dùng không đang thao tác
  Store.onChange = () => {
    refreshBell();
    const busy = $('#modal-root').children.length || $('.popover') || (document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName));
    if (!busy && session() && $('.app')) route();
  };
  Store.ready().then(route).catch(err => { $('#app').innerHTML = `<div class="empty">Không khởi động được dữ liệu: ${esc(err.message)}</div>`; console.error(err); });
})();
