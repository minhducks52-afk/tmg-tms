/* TMG TMS - lớp lưu trữ dữ liệu (localStorage) + tiện ích chung */
(function (global) {
  'use strict';
  const KEY = 'tmg_tms_db_v1';
  const SESSION_KEY = 'tmg_tms_session';

  const U = {
    uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },
    today() { return new Date().toISOString().slice(0, 10); },
    now() { return new Date().toISOString().slice(0, 16); },
    money(v) { const n = Number(v) || 0; return n.toLocaleString('vi-VN'); },
    // Số kiểu VN: "1.250.000" hoặc "12,5" -> 1250000 / 12.5
    num(v) { if (typeof v === 'number') return isFinite(v) ? v : 0; return Number(String(v ?? '').replace(/[^\d,-]/g, '').replace(',', '.')) || 0; },
    date(v) { if (!v) return ''; const s = String(v); const d = s.slice(0, 10).split('-'); return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` + (s.length > 10 ? ' ' + s.slice(11, 16) : '') : s; },
    month(v) { return String(v || '').slice(0, 7); },
    esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
    pad(n, l = 4) { return String(n).padStart(l, '0'); },
    addMonths(ym, k) { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); },
    resizeImage(file, max = 1000) {
      return new Promise((res, rej) => {
        const r = new FileReader();
        r.onerror = rej;
        r.onload = () => {
          const img = new Image();
          img.onload = () => {
            const k = Math.min(1, max / Math.max(img.width, img.height));
            const c = document.createElement('canvas');
            c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            res(c.toDataURL('image/jpeg', 0.7));
          };
          img.onerror = rej; img.src = r.result;
        };
        r.readAsDataURL(file);
      });
    }
  };

  let db = null;

  function load() {
    if (db) return db;
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db || !db.__v) { db = global.TMG_SEED ? global.TMG_SEED() : { __v: 1 }; save(); }
    return db;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { alert('Bộ nhớ trình duyệt đã đầy. Hãy sao lưu và xoá bớt ảnh chứng từ.'); throw e; }
  }

  const Store = {
    U,
    all(col) { load(); return (db[col] = db[col] || []); },
    get(col, id) { return Store.all(col).find(r => r.id === id); },
    nextCode(col, prefix) {
      load(); db.__seq = db.__seq || {};
      db.__seq[col] = (db.__seq[col] || Store.all(col).length) + 1;
      return prefix + U.pad(db.__seq[col]);
    },
    insert(col, rec, user) {
      const r = Object.assign({ id: U.uid() }, rec, { created_at: U.now(), created_by: user || Store.userName(), updated_at: '', updated_by: '' });
      Store.all(col).unshift(r); Store.log('Thêm', col, r.id); save(); return r;
    },
    update(col, id, patch, user) {
      const r = Store.get(col, id); if (!r) return null;
      Object.assign(r, patch, { updated_at: U.now(), updated_by: user || Store.userName() });
      Store.log('Sửa', col, id); save(); return r;
    },
    remove(col, id) {
      const list = Store.all(col); const i = list.findIndex(r => r.id === id);
      if (i >= 0) { list.splice(i, 1); Store.log('Xoá', col, id); save(); }
    },
    log(action, col, id) {
      if (col === 'activity_log') return;
      load(); db.activity_log = db.activity_log || [];
      db.activity_log.unshift({ id: U.uid(), time: U.now(), user: Store.userName(), action, module: col, record: id });
      if (db.activity_log.length > 2000) db.activity_log.length = 2000;
    },
    settings() { load(); return (db.settings = db.settings || {}); },
    saveSettings(s) { load(); db.settings = Object.assign(Store.settings(), s); save(); },
    exportJSON() { load(); return JSON.stringify(db, null, 1); },
    importJSON(txt) { const d = JSON.parse(txt); if (!d.__v) throw new Error('File không hợp lệ'); db = d; save(); },
    reset() { localStorage.removeItem(KEY); db = null; load(); },
    // Phiên đăng nhập
    session() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)); } catch (e) { return null; } },
    setSession(s, remember) { const t = JSON.stringify(s); sessionStorage.setItem(SESSION_KEY, t); if (remember) localStorage.setItem(SESSION_KEY, t); },
    clearSession() { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); },
    userName() { const s = Store.session(); return s ? s.name : 'Hệ thống'; },
    label(col, id, field) {
      const r = id && Store.get(col, id); if (!r) return '';
      return r[field || 'name'] || r.plate || r.code || '';
    }
  };

  /* ---- Tính toán tài chính dùng chung cho Admin & App tài xế ---- */
  Store.finance = function (opts) {
    const { from, to, vehicle } = opts || {}; // from/to: YYYY-MM-DD
    const inRange = d => { const x = String(d || '').slice(0, 10); return (!from || x >= from) && (!to || x <= to); };
    const vOk = v => !vehicle || v === vehicle;
    const rows = [];
    // Doanh thu (chỉ tính đã xác nhận)
    Store.all('revenue').forEach(r => { if (r.status !== 'Đã xác nhận' || !inRange(r.date) || !vOk(r.vehicle_id)) return; rows.push({ kind: 'rev', vehicle: r.vehicle_id, date: r.date, cat: r.type || 'Cước vận chuyển', amount: U.num(r.amount) }); });
    // Chi phí: đề nghị chi phí đã duyệt/đã chi
    Store.all('cost_request').forEach(r => { if (!['Đã duyệt', 'Đã chi'].includes(r.status) || !inRange(r.date) || !vOk(r.vehicle_id)) return; rows.push({ kind: 'cost', src: 'Đề nghị chi phí', vehicle: r.vehicle_id, date: r.date, cat: Store.label('cost_category', r.category_id) || 'Khác', amount: U.num(r.amount) }); });
    // Chi phí vận hành
    Store.all('op_cost').forEach(r => { if (!inRange(r.date) || !vOk(r.vehicle_id)) return; rows.push({ kind: 'cost', src: 'Chi phí vận hành', vehicle: r.vehicle_id, date: r.date, cat: Store.label('cost_category', r.category_id) || 'Khác', amount: U.num(r.amount) }); });
    // Nhiên liệu
    Store.all('route_fuel').forEach(r => { if (!inRange(r.date) || !vOk(r.vehicle_id)) return; rows.push({ kind: 'cost', src: 'Nhiên liệu', vehicle: r.vehicle_id, date: r.date, cat: 'Nhiên liệu', amount: U.num(r.total) }); });
    // Sửa chữa đã duyệt
    Store.all('repair_ticket').forEach(r => { if (r.approved !== 'Có' || !inRange(r.start_date) || !vOk(r.vehicle_id)) return; rows.push({ kind: 'cost', src: 'Sửa chữa', vehicle: r.vehicle_id, date: r.start_date, cat: 'Sửa chữa, bảo dưỡng', amount: U.num(r.total) }); });
    const revenue = rows.filter(r => r.kind === 'rev').reduce((s, r) => s + r.amount, 0);
    const cost = rows.filter(r => r.kind === 'cost').reduce((s, r) => s + r.amount, 0);
    return { rows, revenue, cost, profit: revenue - cost };
  };

  // Đồng bộ khi tab khác (VD: App tài xế) thay đổi dữ liệu
  global.addEventListener('storage', e => { if (e.key === KEY) db = null; });

  global.Store = Store;
  global.U = U;
})(window);
