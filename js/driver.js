/* TMG Driver - App cho tài xế, làm việc theo đầu xe */
(function () {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = U.esc;
  const SKEY = 'tmg_driver_session';
  const P = {
    truck: 'M1 5h14v11H1zM15 9h4l4 4v3h-8zM5.5 19a2 2 0 1 0 0-.1M18.5 19a2 2 0 1 0 0-.1', home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
    route: 'M6 19a2 2 0 1 0 0-.1M18 5a2 2 0 1 0 0-.1M6 17V9a4 4 0 0 1 4-4h6M18 7v8a4 4 0 0 1-4 4H8', plus: 'M12 5v14M5 12h14',
    wallet: 'M3 7h18v13H3zM3 7l3-4h12l3 4M16 13h2', user: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM3 22a9 9 0 0 1 18 0',
    fuel: 'M4 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17M3 21h12M6 8h6M14 9h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3',
    receipt: 'M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2zM9 7h6M9 11h6M9 15h4', dollar: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    alert: 'M12 2L1 21h22zM12 9v5M12 17.5v.01', logout: 'M9 21H4V3h5M16 17l5-5-5-5M21 12H9', camera: 'M3 7h4l2-3h6l2 3h4v13H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z'
  };
  const ic = n => `<svg class="i" viewBox="0 0 24 24"><path d="${P[n]}"/></svg>`;
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2400); };
  const CH = { ok: ['Hoàn thành', 'Đã duyệt', 'Đã chi', 'Đã xác nhận', 'Đã xử lý', 'Đã thanh toán'], warn: ['Chờ duyệt', 'Chờ xác nhận', 'Chưa bắt đầu', 'Chưa xử lý', 'Chưa thanh toán'], bad: ['Từ chối', 'Hủy'], info: ['Đang chạy', 'Đang xử lý'] };
  const chip = v => `<span class="chip ${Object.keys(CH).find(k => CH[k].includes(v)) || ''}">${esc(v)}</span>`;
  const short = v => { v = U.num(v); return Math.abs(v) >= 1e9 ? (v / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' tỷ' : Math.abs(v) >= 1e6 ? (v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tr' : U.money(v); };

  let S = null; try { S = JSON.parse(localStorage.getItem(SKEY)); } catch (e) {}
  let tab = 'home', sub = null;
  const me = () => Store.get('driver', S.driver_id);
  const car = () => Store.get('vehicle', S.vehicle_id);
  const ins = (col, rec) => Store.insert(col, Object.assign({ source: 'App' }, rec), me().name);

  /* ---------- Login ---------- */
  function login() {
    const vehs = Store.all('vehicle').filter(v => v.active !== 'Không hoạt động');
    $('#app').innerHTML = `<div class="login"><div class="hero"><div class="logo">${ic('truck')}</div><h1>TMG Driver</h1><div>App tài xế theo đầu xe</div></div>
      <form class="panel" id="lf">
        <div class="f"><label>Biển số xe</label><select name="v" required><option value="">— Chọn xe —</option>${vehs.map(v => `<option value="${v.id}">${esc(v.plate)}</option>`).join('')}</select></div>
        <div class="f"><label>Số điện thoại</label><input name="p" type="tel" inputmode="tel" required autocomplete="tel"></div>
        <div class="f"><label>Mã PIN</label><input name="pin" type="password" inputmode="numeric" required maxlength="8"></div>
        <div class="err" id="le"></div><button class="btn">Vào ca làm việc</button>
        <div class="hint">PIN do điều vận cấp trong mục Tài xế (mặc định dữ liệu mẫu: 1234).<br>Dùng trên điện thoại: Chia sẻ → "Thêm vào màn hình chính".</div>
      </form></div>`;
    $('#lf').onsubmit = e => {
      e.preventDefault(); const f = new FormData(e.target);
      const phone = String(f.get('p')).replace(/\D/g, '');
      const d = Store.all('driver').find(x => String(x.phone || '').replace(/\D/g, '') === phone && x.active !== 'Không');
      const v = Store.get('vehicle', f.get('v'));
      if (!d || String(d.pin || '') !== f.get('pin')) return ($('#le').textContent = 'Sai số điện thoại hoặc mã PIN');
      if (v.driver_id !== d.id && d.vehicle_id !== v.id && !confirm(`Bạn không phải tài xế được phân công cho xe ${v.plate}. Vẫn nhận xe này?`)) return;
      S = { driver_id: d.id, vehicle_id: v.id, at: U.now() }; localStorage.setItem(SKEY, JSON.stringify(S));
      render();
    };
  }

  /* ---------- Shell ---------- */
  function render() {
    if (!S || !me() || !car()) { localStorage.removeItem(SKEY); S = null; return login(); }
    const ym = U.today().slice(0, 7); const [y, m] = ym.split('-').map(Number);
    const fin = Store.finance({ from: ym + '-01', to: ym + '-' + new Date(y, m, 0).getDate(), vehicle: S.vehicle_id });
    const trips = Store.all('route').filter(r => r.vehicle_id === S.vehicle_id && U.month(r.pickup_date) === ym && r.status !== 'Hủy').length;
    $('#app').innerHTML = `<div class="wrap">
      <div class="hdr"><div class="row"><span class="plate">${esc(car().plate)}</span><div class="who"><b>${esc(me().name)}</b><br><small>${esc(Store.label('vehicle_group', car().group_id))}</small></div><button class="out" id="lo" title="Kết thúc ca">${ic('logout')}</button></div></div>
      <div class="stats"><div class="stat"><div class="l">Doanh thu T${m}</div><div class="v">${short(fin.revenue)}</div></div><div class="stat"><div class="l">Chi phí T${m}</div><div class="v">${short(fin.cost)}</div></div><div class="stat"><div class="l">Chuyến T${m}</div><div class="v">${trips}</div></div></div>
      <div id="view"></div></div>
      <nav class="nav"><div class="in">${[['home', 'home', 'Trang chủ'], ['trips', 'route', 'Chuyến'], ['new', 'plus', ''], ['money', 'wallet', 'Thu chi'], ['me', 'user', 'Cá nhân']].map(([k, i, l]) => k === 'new' ? `<button class="fab" data-t="new"><span>${ic('plus')}</span></button>` : `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${ic(i)}${l}</button>`).join('')}</div></nav>`;
    $('#lo').onclick = () => { if (confirm('Kết thúc ca và đăng xuất?')) { localStorage.removeItem(SKEY); S = null; render(); } };
    $$('.nav button').forEach(b => b.onclick = () => { if (b.dataset.t === 'new') return newMenu(); tab = b.dataset.t; sub = null; render(); });
    VIEWS[tab]($('#view'));
  }

  const QA = [
    ['cost', 'receipt', 'Đề nghị chi phí', '#eb6834'], ['fuel', 'fuel', 'Đổ nhiên liệu', '#1f5fae'],
    ['rev', 'dollar', 'Nhập doanh thu', '#0a8a3a'], ['inc', 'alert', 'Báo sự cố', '#c62828']
  ];
  const quick = () => `<div class="grid4">${QA.map(([k, i, l, c]) => `<button class="qa" data-qa="${k}"><span class="ic" style="background:${c}">${ic(i)}</span>${l}</button>`).join('')}</div>`;
  const bindQuick = el => $$('[data-qa]', el).forEach(b => b.onclick = () => FORMS[b.dataset.qa]());
  function newMenu() {
    sheet('Tạo mới', `<div class="grid4" style="margin:0">${QA.map(([k, i, l, c]) => `<button class="qa" data-qa="${k}"><span class="ic" style="background:${c}">${ic(i)}</span>${l}</button>`).join('')}</div>`, (root, close) => $$('[data-qa]', root).forEach(b => b.onclick = () => { close(); FORMS[b.dataset.qa](); }));
  }

  /* ---------- Views ---------- */
  const myRoutes = () => Store.all('route').filter(r => r.vehicle_id === S.vehicle_id);
  function routeCard(r) {
    const ords = (r.order_ids || []).map(id => Store.get('order', id)).filter(Boolean);
    return `<div class="card" data-r="${r.id}"><div class="t"><div><b>${esc(r.code)}</b> · <small>${U.date(r.pickup_date)}</small></div>${chip(r.status)}</div>
      <div class="route-line"><div class="dots"><i></i><s></s><i class="e"></i></div><div style="flex:1"><div>${esc(Store.label('location', r.from_location) || '—')}</div><div style="height:10px"></div><div>${esc(Store.label('location', r.to_location) || '—')}</div></div></div>
      ${ords.length ? `<div class="m">Đơn: ${ords.map(o => esc(o.order_no) + ' · ' + esc(Store.label('customer', o.customer_id))).join('; ')}</div>` : ''}
      <div class="m">Km: ${r.km_start || '—'} → ${r.km_end || '—'}${r.advance ? ` · Tạm ứng ${U.money(r.advance)}` : ''}</div>
      <div class="acts">${r.status === 'Chưa bắt đầu' ? `<button class="btn sm" data-go="start">Bắt đầu chuyến</button>` : ''}${r.status === 'Đang chạy' ? `<button class="btn sm ok" data-go="end">Hoàn thành chuyến</button><button class="btn sm ghost" data-go="cost">+ Chi phí</button>` : ''}</div></div>`;
  }
  function bindRoutes(el) {
    $$('[data-r] [data-go]', el).forEach(b => b.onclick = () => { const r = Store.get('route', b.closest('[data-r]').dataset.r); ({ start: () => FORMS.start(r), end: () => FORMS.end(r), cost: () => FORMS.cost(r) })[b.dataset.go](); });
  }
  function itemCard(x) {
    return `<div class="card"><div class="t"><div><b>${esc(x.title)}</b><div class="m">${U.date(x.date)} · ${esc(x.code || '')}${x.sub ? ' · ' + esc(x.sub) : ''}</div></div><div style="text-align:right"><div class="amt" style="color:${x.sign > 0 ? 'var(--ok)' : 'var(--ink)'}">${x.sign > 0 ? '+' : '−'}${U.money(x.amount)}</div>${x.status ? chip(x.status) : ''}</div></div>${x.reason ? `<div class="m" style="color:var(--bad)">${esc(x.reason)}</div>` : ''}</div>`;
  }
  function myMoney() {
    const v = S.vehicle_id; const out = [];
    Store.all('cost_request').filter(r => r.vehicle_id === v).forEach(r => out.push({ k: 'cost', title: Store.label('cost_category', r.category_id) || 'Chi phí', date: r.date, code: r.code, amount: r.amount, sign: -1, status: r.status, sub: r.description, reason: r.reject_reason ? 'Lý do: ' + r.reject_reason : '' }));
    Store.all('route_fuel').filter(r => r.vehicle_id === v).forEach(r => out.push({ k: 'fuel', title: 'Nhiên liệu ' + (r.liters || '') + ' lít', date: r.date, code: r.code, amount: r.total, sign: -1, status: r.pay_status, sub: r.fuel_type }));
    Store.all('revenue').filter(r => r.vehicle_id === v).forEach(r => out.push({ k: 'rev', title: r.type, date: r.date, code: r.code, amount: r.amount, sign: 1, status: r.status, sub: Store.label('customer', r.customer_id) }));
    return out.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }
  const VIEWS = {
    home(el) {
      const act = myRoutes().filter(r => r.status === 'Đang chạy' || r.status === 'Chưa bắt đầu').sort((a, b) => (a.status === 'Đang chạy' ? -1 : 1));
      const pend = Store.all('cost_request').filter(r => r.vehicle_id === S.vehicle_id && r.status === 'Chờ duyệt');
      el.innerHTML = `<div class="sec"><h2>Thao tác nhanh</h2></div>${quick()}
        <div class="sec"><h2>Chuyến hiện tại</h2><a data-tab="trips">Tất cả</a></div>
        ${act.length ? act.slice(0, 3).map(routeCard).join('') : `<div class="card empty">Chưa có chuyến được giao<br><button class="btn sm ghost" style="margin:10px auto 0" id="selfroute">+ Tự tạo chuyến</button></div>`}
        ${pend.length ? `<div class="sec"><h2>Đang chờ duyệt (${pend.length})</h2><a data-tab="money">Xem</a></div><div class="card"><div class="t"><span>${pend.length} đề nghị chi phí</span><b class="amt">${U.money(pend.reduce((s, r) => s + U.num(r.amount), 0))} đ</b></div></div>` : ''}
        <div class="sec"><h2>Gần đây</h2></div>${myMoney().slice(0, 5).map(itemCard).join('') || '<div class="empty">Chưa có giao dịch</div>'}`;
      bindQuick(el); bindRoutes(el);
      $$('[data-tab]', el).forEach(a => a.onclick = () => { tab = a.dataset.tab; render(); });
      const sr = $('#selfroute', el); if (sr) sr.onclick = () => FORMS.route();
    },
    trips(el) {
      sub = sub || 'active';
      const all = myRoutes();
      const list = sub === 'active' ? all.filter(r => ['Đang chạy', 'Chưa bắt đầu'].includes(r.status)) : all.filter(r => r.status === 'Hoàn thành' || r.status === 'Hủy');
      el.innerHTML = `<div class="sec"><h2>Chuyến xe</h2><a id="nr">+ Tạo chuyến</a></div>
        <div class="tabs"><button data-s="active" class="${sub === 'active' ? 'on' : ''}">Đang thực hiện</button><button data-s="done" class="${sub === 'done' ? 'on' : ''}">Đã xong</button></div>
        ${list.slice(0, 60).map(routeCard).join('') || '<div class="empty">Không có chuyến</div>'}`;
      $$('[data-s]', el).forEach(b => b.onclick = () => { sub = b.dataset.s; VIEWS.trips(el); });
      $('#nr', el).onclick = () => FORMS.route(); bindRoutes(el);
    },
    money(el) {
      sub = sub || 'all';
      const items = myMoney().filter(x => sub === 'all' || x.k === sub);
      el.innerHTML = `<div class="sec"><h2>Thu chi của xe</h2></div>
        <div class="tabs">${[['all', 'Tất cả'], ['cost', 'Đề nghị chi phí'], ['fuel', 'Nhiên liệu'], ['rev', 'Doanh thu']].map(([k, l]) => `<button data-s="${k}" class="${sub === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        ${items.slice(0, 100).map(itemCard).join('') || '<div class="empty">Chưa có dữ liệu</div>'}`;
      $$('[data-s]', el).forEach(b => b.onclick = () => { sub = b.dataset.s; VIEWS.money(el); });
    },
    me(el) {
      const d = me(), v = car();
      const sal = Store.all('salary').filter(s => s.driver_id === d.id).slice(0, 6);
      const adv = Store.all('cost_request').filter(r => r.driver_id === d.id && r.pay_method === 'Tài xế ứng trước' && r.status === 'Đã duyệt').reduce((s, r) => s + U.num(r.amount), 0);
      const row = (l, val) => `<div class="t" style="padding:6px 0;border-bottom:1px solid var(--line)"><span style="color:var(--ink-2)">${l}</span><b>${val || '—'}</b></div>`;
      el.innerHTML = `<div class="sec"><h2>Tài xế</h2></div><div class="card">${row('Họ tên', esc(d.name))}${row('Mã', esc(d.code))}${row('Điện thoại', esc(d.phone))}${row('Bằng lái', esc(d.license_class))}${row('Hạn GPLX', U.date(d.license_exp))}</div>
        <div class="card"><div class="t"><span>Công ty còn nợ bạn (đã duyệt, chưa chi)</span><b class="amt">${U.money(adv)} đ</b></div></div>
        <div class="sec"><h2>Xe ${esc(v.plate)}</h2></div><div class="card">${row('Chủng loại', esc(Store.label('vehicle_group', v.group_id)))}${row('Số km', U.money(v.odometer))}${row('Hạn đăng kiểm', U.date(v.inspection_exp))}${row('Hạn bảo hiểm', U.date(v.insurance_exp))}${row('Định mức dầu', v.fuel_norm ? v.fuel_norm + ' L/100km' : '')}</div>
        <div class="sec"><h2>Bảng lương</h2></div>${sal.map(s => `<div class="card"><div class="t"><span>Tháng ${esc(s.month)}</span><div style="text-align:right"><b class="amt">${U.money(s.total)}</b><br>${chip(s.status)}</div></div>${s.status === 'Gửi tài xế' ? `<div class="acts"><button class="btn sm ok" data-sal="${s.id}">Xác nhận lương</button></div>` : ''}</div>`).join('') || '<div class="empty">Chưa có bảng lương</div>'}
        <div style="margin:16px 12px"><button class="btn ghost" id="pin">Đổi mã PIN</button></div>`;
      $$('[data-sal]', el).forEach(b => b.onclick = () => { Store.update('salary', b.dataset.sal, { status: 'Đã xác nhận' }, d.name); toast('Đã xác nhận bảng lương'); render(); });
      $('#pin', el).onclick = () => sheet('Đổi mã PIN', `<form id="pf"><div class="f"><label>PIN hiện tại</label><input name="o" type="password" inputmode="numeric" required></div><div class="f"><label>PIN mới (4-8 số)</label><input name="n" type="password" inputmode="numeric" pattern="\\d{4,8}" required></div><button class="btn">Lưu</button></form>`, (root, close) => {
        $('#pf', root).onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); if (f.get('o') !== String(d.pin)) return toast('PIN hiện tại không đúng'); Store.update('driver', d.id, { pin: f.get('n') }, d.name); close(); toast('Đã đổi PIN'); };
      });
    }
  };

  /* ---------- Sheet + forms ---------- */
  function sheet(title, body, onOpen) {
    const root = $('#sheet-root');
    root.innerHTML = `<div class="sheet-bg"><div class="sheet"><div class="sheet-h"><h3>${title}</h3><button data-x>×</button></div><div class="sheet-b">${body}</div></div></div>`;
    const close = () => { root.innerHTML = ''; };
    $('[data-x]', root).onclick = close; $('.sheet-bg', root).addEventListener('mousedown', e => { if (e.target.classList.contains('sheet-bg')) close(); });
    // money inputs
    $$('input.money', root).forEach(i => i.addEventListener('input', () => { const n = U.num(i.value); i.value = i.value === '' ? '' : U.money(n); }));
    // photo
    $$('.photo input', root).forEach(i => i.onchange = async () => { const f = i.files[0]; if (!f) return; const url = await U.resizeImage(f); i.closest('.photo').dataset.v = url; i.closest('.photo').querySelector('.pv').innerHTML = `<img src="${url}">`; });
    onOpen && onOpen(root, close);
    return close;
  }
  const photo = (label = 'Chụp ảnh hoá đơn / chứng từ') => `<div class="f"><label class="photo" data-photo><input type="file" accept="image/*" capture="environment"><div class="pv">${ic('camera')}<br>${label}</div></label></div>`;
  const routeSelect = (sel) => { const rs = myRoutes().filter(r => r.status !== 'Hủy').slice(0, 20); return `<div class="f"><label>Chuyến xe</label><select name="route"><option value="">— Không gắn chuyến —</option>${rs.map(r => `<option value="${r.id}" ${(sel ? sel.id === r.id : r.status === 'Đang chạy') ? 'selected' : ''}>${esc(r.code)} · ${U.date(r.pickup_date)} · ${esc(Store.label('location', r.to_location))}</option>`).join('')}</select></div>`; };
  const photoVal = root => ($('[data-photo]', root) || {}).dataset?.v || '';
  const done = (close, msg) => { close(); toast(msg); render(); };

  const FORMS = {
    cost(route) {
      const cats = Store.all('cost_category').filter(c => c.driver_app !== 'Không');
      sheet('Đề nghị chi phí', `<form id="f">
        <div class="f"><label>Khoản chi</label><div class="chips">${cats.map((c, i) => `<label><input type="radio" name="cat" value="${c.id}" ${i === 0 ? 'checked' : ''}><span>${esc(c.name)}</span></label>`).join('')}</div></div>
        <div class="f"><label>Số tiền (đ)</label><input class="money" name="amt" inputmode="numeric" required placeholder="0"></div>
        <div class="two"><div class="f"><label>Ngày</label><input type="date" name="date" value="${U.today()}" required></div>
        <div class="f"><label>Hình thức</label><select name="pm"><option>Tài xế ứng trước</option><option>Đề nghị tạm ứng</option></select></div></div>
        ${routeSelect(route)}
        <div class="f"><label>Nội dung</label><textarea name="desc" rows="2" placeholder="VD: Vé BOT Pháp Vân, bốc xếp tại kho..."></textarea></div>
        ${photo()}<button class="btn">Gửi đề nghị</button></form>`, (root, close) => {
        $('#f', root).onsubmit = e => {
          e.preventDefault(); const f = new FormData(e.target); const amt = U.num(f.get('amt')); if (!amt) return toast('Nhập số tiền');
          ins('cost_request', { code: Store.nextCode('cost_request', 'DN'), date: f.get('date'), vehicle_id: S.vehicle_id, driver_id: S.driver_id, route_id: f.get('route'), category_id: f.get('cat'), amount: amt, pay_method: f.get('pm'), description: f.get('desc') || Store.label('cost_category', f.get('cat')), image: photoVal(root), status: 'Chờ duyệt', approver: '' });
          done(close, 'Đã gửi đề nghị — chờ duyệt');
        };
      });
    },
    fuel() {
      const v = car(); const price = Store.settings().fuel_price || '';
      sheet('Đổ nhiên liệu', `<form id="f">
        <div class="f"><label>Loại nhiên liệu</label><select name="t">${['Dầu Diesel 0,05S-II', 'Dầu Diesel 0,001S-V', 'Xăng A95', 'Xăng E5 RON92', 'Khí thải Ure'].map(x => `<option>${x}</option>`).join('')}</select></div>
        <div class="two"><div class="f"><label>Số lít</label><input name="l" type="number" step="0.01" inputmode="decimal" required></div><div class="f"><label>Đơn giá (đ/lít)</label><input name="p" class="money" inputmode="numeric" value="${price ? U.money(price) : ''}" required></div></div>
        <div class="f"><label>Thành tiền</label><input id="tt" class="money" readonly></div>
        <div class="two"><div class="f"><label>Km đồng hồ</label><input name="km" type="number" inputmode="numeric" value="${v.odometer || ''}" required></div><div class="f"><label>Thanh toán</label><select name="pt"><option>Công ty thanh toán</option><option>Tự thanh toán</option></select></div></div>
        <div class="f"><label>Cây xăng</label><input name="st" placeholder="Tên cây xăng / địa điểm"></div>
        ${routeSelect()}${photo('Chụp hoá đơn đổ dầu')}<button class="btn">Lưu</button></form>`, (root, close) => {
        const form = $('#f', root); const calc = () => { $('#tt', root).value = U.money(Math.round((Number(form.l.value) || 0) * U.num(form.p.value))); };
        form.addEventListener('input', calc); calc();
        form.onsubmit = e => {
          e.preventDefault(); const f = new FormData(form); const km = Number(f.get('km')); const liters = Number(f.get('l')); const p = U.num(f.get('p'));
          ins('route_fuel', { code: Store.nextCode('route_fuel', 'NL'), pay_type: f.get('pt'), pay_status: f.get('pt') === 'Tự thanh toán' ? 'Chưa thanh toán' : 'Đã thanh toán', date: U.today(), fuel_type: f.get('t'), liters, price: p, total: Math.round(liters * p), route_id: f.get('route'), vehicle_id: S.vehicle_id, driver_id: S.driver_id, km_old: v.odometer || '', km_now: km, station: f.get('st'), image: photoVal(root) });
          if (km > U.num(v.odometer)) Store.update('vehicle', v.id, { odometer: km }, me().name);
          done(close, 'Đã ghi nhận đổ nhiên liệu');
        };
      });
    },
    rev() {
      const custs = Store.all('customer');
      sheet('Nhập doanh thu', `<form id="f">
        <div class="f"><label>Loại</label><div class="chips">${['Cước vận chuyển', 'Phụ phí', 'Bốc xếp', 'Lưu ca / lưu đêm', 'Doanh thu khác'].map((t, i) => `<label><input type="radio" name="t" value="${t}" ${i === 0 ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div></div>
        <div class="f"><label>Khách hàng</label><select name="c"><option value="">—</option>${custs.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
        <div class="f"><label>Số tiền (đ)</label><input class="money" name="a" inputmode="numeric" required placeholder="0"></div>
        <div class="two"><div class="f"><label>Hình thức thu</label><select name="h"><option>Tài xế thu tiền mặt</option><option>Chuyển khoản</option><option>Công nợ</option></select></div><div class="f"><label>Ngày</label><input type="date" name="d" value="${U.today()}"></div></div>
        ${routeSelect()}<div class="f"><label>Ghi chú</label><input name="n"></div>${photo('Chụp biên nhận / phiếu giao hàng')}
        <button class="btn ok">Gửi xác nhận</button></form>`, (root, close) => {
        $('#f', root).onsubmit = e => {
          e.preventDefault(); const f = new FormData(e.target); const a = U.num(f.get('a')); if (!a) return toast('Nhập số tiền');
          ins('revenue', { code: Store.nextCode('revenue', 'DT'), date: f.get('d'), type: f.get('t'), vehicle_id: S.vehicle_id, driver_id: S.driver_id, customer_id: f.get('c'), route_id: f.get('route'), amount: a, vat: 'Không chịu thuế', total: a, collect: f.get('h'), status: 'Chờ xác nhận', note: f.get('n'), image: photoVal(root) });
          done(close, 'Đã gửi doanh thu — chờ kế toán xác nhận');
        };
      });
    },
    inc() {
      sheet('Báo sự cố', `<form id="f">
        <div class="f"><label>Loại sự cố</label><div class="chips">${['Hỏng xe dọc đường', 'Tai nạn giao thông', 'Hư hỏng hàng hóa', 'Bị phạt / CSGT giữ'].map((t, i) => `<label><input type="radio" name="k" value="${t}" ${i === 0 ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div></div>
        <div class="f"><label>Nơi xảy ra</label><input name="p" required placeholder="VD: QL5 km 32"></div>
        <div class="f"><label>Mô tả</label><textarea name="d" rows="3" required></textarea></div>
        <div class="f"><label>Thiệt hại ước tính (đ)</label><input class="money" name="a" inputmode="numeric"></div>
        ${photo('Chụp ảnh hiện trường')}<button class="btn">Gửi báo cáo</button></form>`, (root, close) => {
        $('#f', root).onsubmit = e => {
          e.preventDefault(); const f = new FormData(e.target);
          ins('incident', { code: Store.nextCode('incident', 'SC'), kind: f.get('k'), status: 'Chưa xử lý', target: f.get('k') === 'Hư hỏng hàng hóa' ? 'Hàng hóa' : 'Phương tiện', driver_id: S.driver_id, vehicle_id: S.vehicle_id, date: U.now(), place: f.get('p'), insurance: 'Không', damage: U.num(f.get('a')), description: f.get('d'), image: photoVal(root) });
          if (f.get('k') === 'Hỏng xe dọc đường') Store.update('vehicle', S.vehicle_id, { state: 'Xe hỏng' }, me().name);
          if (f.get('k') === 'Bị phạt / CSGT giữ') Store.update('vehicle', S.vehicle_id, { state: 'Xe công an giữ' }, me().name);
          done(close, 'Đã báo sự cố cho điều vận');
        };
      });
    },
    start(r) {
      sheet('Bắt đầu chuyến ' + esc(r.code), `<form id="f"><div class="f"><label>Km đồng hồ lúc xuất phát</label><input name="km" type="number" inputmode="numeric" value="${car().odometer || ''}" required></div><button class="btn">Bắt đầu</button></form>`, (root, close) => {
        $('#f', root).onsubmit = e => {
          e.preventDefault(); const km = Number(new FormData(e.target).get('km'));
          Store.update('route', r.id, { status: 'Đang chạy', km_start: km, actual_start: U.now() }, me().name);
          Store.update('vehicle', S.vehicle_id, { state: 'Xe đang vận chuyển', odometer: Math.max(km, U.num(car().odometer)) }, me().name);
          (r.order_ids || []).forEach(id => Store.update('order', id, { status: 'Đang vận chuyển' }, me().name));
          done(close, 'Chúc thượng lộ bình an!');
        };
      });
    },
    end(r) {
      sheet('Hoàn thành chuyến ' + esc(r.code), `<form id="f"><div class="f"><label>Km đồng hồ khi kết thúc</label><input name="km" type="number" inputmode="numeric" required min="${r.km_start || 0}"></div>
        <div class="f"><label>Ghi chú giao hàng</label><input name="n"></div>${photo('Chụp biên bản giao hàng / POD')}<button class="btn ok">Hoàn thành</button></form>`, (root, close) => {
        $('#f', root).onsubmit = e => {
          e.preventDefault(); const f = new FormData(e.target); const km = Number(f.get('km'));
          Store.update('route', r.id, { status: 'Hoàn thành', km_end: km, km_actual: Math.max(0, km - U.num(r.km_start)), actual_end: U.now(), drop_date: U.today(), note: [r.note, f.get('n')].filter(Boolean).join(' | ') }, me().name);
          Store.update('vehicle', S.vehicle_id, { state: 'Xe trống', odometer: Math.max(km, U.num(car().odometer)) }, me().name);
          (r.order_ids || []).forEach(id => Store.update('order', id, { status: 'Hoàn thành', drop_date: U.today() }, me().name));
          const pod = photoVal(root); if (pod) (r.order_ids || []).forEach(id => ins('document', { code: Store.nextCode('document', 'CT'), order_id: id, name: 'POD chuyến ' + r.code, date: U.today(), image: pod }));
          done(close, 'Đã hoàn thành chuyến');
        };
      });
    },
    route() {
      const locs = Store.all('location');
      const opt = locs.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
      sheet('Tạo chuyến mới', `<form id="f"><div class="f"><label>Loại chuyến</label><select name="t"><option>Chuyến có hàng</option><option>Chuyến rỗng</option></select></div>
        <div class="f"><label>Điểm đầu</label><select name="a" required><option value=""></option>${opt}</select></div><div class="f"><label>Điểm cuối</label><select name="b" required><option value=""></option>${opt}</select></div>
        <div class="f"><label>Ngày</label><input type="date" name="d" value="${U.today()}"></div><button class="btn">Tạo chuyến</button></form>`, (root, close) => {
        $('#f', root).onsubmit = e => {
          e.preventDefault(); const f = new FormData(e.target);
          ins('route', { code: Store.nextCode('route', 'CX'), type: f.get('t'), status: 'Chưa bắt đầu', approve: 'Chưa phê duyệt', vehicle_id: S.vehicle_id, driver_id: S.driver_id, order_ids: [], from_location: f.get('a'), to_location: f.get('b'), pickup_date: f.get('d') });
          tab = 'trips'; sub = 'active'; done(close, 'Đã tạo chuyến');
        };
      });
    }
  };

  window.addEventListener('storage', () => { if (S && !$('.sheet-bg')) render(); });
  render();
})();
