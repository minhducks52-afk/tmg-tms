/* TMG TMS - lớp lưu trữ dữ liệu v2
 * - Mỗi bảng (collection) một khoá localStorage, ghi theo từng bản ghi (gộp với dữ liệu tab khác)
 * - Ảnh/chứng từ lưu trong IndexedDB (không còn giới hạn ~5MB của localStorage)
 * - Có phiên bản cấu trúc + chuyển đổi tự động, luôn sao lưu bản cũ trước khi chuyển đổi
 * - Xoá mềm (thùng rác) + sao lưu tự động hằng ngày
 */
(function (global) {
  'use strict';
  const SCHEMA_VERSION = 2;
  const qs = new URLSearchParams(global.location ? location.search : '');
  const NS = String(global.TMG_DB_NS || qs.get('db') || '').replace(/[^\w-]/g, '');
  const SUF = NS ? '_' + NS : '';
  const P = 'tmg_tms_v2' + SUF + ':';
  const CP = P + 'c:';
  const MKEY = P + 'meta';
  const LEGACY_KEY = 'tmg_tms_db_v1' + SUF;
  const SESSION_KEY = 'tmg_tms_session' + SUF;
  const IDB_NAME = 'tmg_tms' + SUF;

  const U = {
    uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },
    today() { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); },
    now() { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); },
    // Dấu thời gian bản ghi (giờ địa phương, tới giây)
    stamp() { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 19); },
    money(v) { const n = Number(v) || 0; return n.toLocaleString('vi-VN'); },
    // Số kiểu VN: "1.250.000" hoặc "12,5" -> 1250000 / 12.5
    num(v) { if (typeof v === 'number') return isFinite(v) ? v : 0; return Number(String(v ?? '').replace(/[^\d,-]/g, '').replace(',', '.')) || 0; },
    date(v) { if (!v) return ''; const s = String(v); const d = s.slice(0, 10).split('-'); return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` + (s.length > 10 ? ' ' + s.slice(11, 16) : '') : s; },
    month(v) { return String(v || '').slice(0, 7); },
    esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
    pad(n, l = 4) { return String(n).padStart(l, '0'); },
    addMonths(ym, k) { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); },
    monthEnd(ym) { const [y, m] = ym.split('-').map(Number); return ym + '-' + String(new Date(y, m, 0).getDate()).padStart(2, '0'); },
    resizeImage(file, max = 1280) {
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
            res(c.toDataURL('image/jpeg', 0.75));
          };
          img.onerror = rej; img.src = r.result;
        };
        r.readAsDataURL(file);
      });
    }
  };

  /* ---------------- IndexedDB (ảnh + bản sao lưu) ---------------- */
  let idbP = null;
  function idb() {
    if (!idbP) idbP = new Promise((res, rej) => {
      if (!global.indexedDB) return rej(new Error('Trình duyệt không hỗ trợ IndexedDB'));
      let r; try { r = indexedDB.open(IDB_NAME, 1); } catch (e) { return rej(e); }
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains('files')) d.createObjectStore('files');
        if (!d.objectStoreNames.contains('backups')) d.createObjectStore('backups', { keyPath: 'id' });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error('IndexedDB bị chặn'));
    });
    return idbP;
  }
  function tx(store, mode, fn) {
    return idb().then(d => new Promise((res, rej) => {
      const t = d.transaction(store, mode); const s = t.objectStore(store); let out;
      const r = fn(s); if (r) r.onsuccess = () => { out = r.result; };
      t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('abort'));
    }));
  }

  const fileCache = new Map();
  const Files = {
    isRef: v => typeof v === 'string' && v.startsWith('idb:'),
    isData: v => typeof v === 'string' && v.startsWith('data:'),
    async put(dataUrl) {
      if (!dataUrl || Files.isRef(dataUrl)) return dataUrl || '';
      if (legacy) return dataUrl; // không có IndexedDB: giữ ảnh trong bản ghi như cũ
      const ref = 'idb:' + U.uid();
      await tx('files', 'readwrite', s => s.put(dataUrl, ref));
      fileCache.set(ref, dataUrl); return ref;
    },
    async putAs(ref, dataUrl) { await tx('files', 'readwrite', s => s.put(dataUrl, ref)); fileCache.set(ref, dataUrl); },
    async get(ref) {
      if (!ref) return '';
      if (!Files.isRef(ref)) return ref;
      if (fileCache.has(ref)) return fileCache.get(ref);
      try { const v = await tx('files', 'readonly', s => s.get(ref)); if (v) fileCache.set(ref, v); return v || ''; } catch (e) { return ''; }
    }
  };
  // Tự nạp ảnh cho mọi <img data-file="idb:...">
  function hydrate(node) {
    if (!node || node.nodeType !== 1) return;
    const list = node.matches('img[data-file]') ? [node] : [...node.querySelectorAll('img[data-file]')];
    list.forEach(img => {
      const ref = img.getAttribute('data-file'); img.removeAttribute('data-file');
      Files.get(ref).then(src => { if (src) img.src = src; else { img.alt = 'Không tìm thấy ảnh'; img.classList.add('missing'); } });
    });
  }
  if (global.MutationObserver && global.document) {
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(hydrate))).observe(document.documentElement, { childList: true, subtree: true });
  }

  /* ---------------- Bộ nhớ + localStorage ---------------- */
  let mem = null;        // { meta: {__v, __seq, settings}, cols: {name: [records]} }
  let legacy = false;    // chế độ dự phòng khi không có IndexedDB: giữ định dạng v1
  const views = {};
  const bump = c => { delete views[c]; };
  const readJSON = (k, d) => { try { const t = localStorage.getItem(k); return t ? JSON.parse(t) : d; } catch (e) { return d; } };
  function writeJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); }
    catch (e) { alert('Bộ nhớ trình duyệt đã đầy — chưa lưu được thay đổi. Hãy vào Thiết lập → Sao lưu để tải bản sao lưu.'); throw e; }
  }
  const colKeys = () => { const out = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(CP)) out.push(k.slice(CP.length)); } return out; };
  function ensure() { if (!mem) throw new Error('Store chưa sẵn sàng — gọi Store.ready() trước'); }
  function col(c) { ensure(); if (!mem.cols[c]) mem.cols[c] = legacy ? [] : readJSON(CP + c, []); return mem.cols[c]; }
  function refresh(c) { if (!legacy) { mem.cols[c] = readJSON(CP + c, []); bump(c); } }
  function saveLegacy() {
    const blob = Object.assign({ __v: 1, __seq: mem.meta.__seq || {}, settings: mem.meta.settings || {} }, mem.cols);
    writeJSON(LEGACY_KEY, blob);
  }
  // Ghi theo bản ghi: gộp với bản đang lưu (có thể do tab khác vừa ghi)
  function persist(c, changed, purged) {
    if (legacy) { const list = col(c); changed.forEach(r => { if (!list.includes(r)) list.unshift(r); }); if (purged) mem.cols[c] = list.filter(r => !purged.includes(r.id)); bump(c); return saveLegacy(); }
    const stored = readJSON(CP + c, []);
    const idx = new Map(stored.map((r, i) => [r.id, i]));
    const fresh = [];
    changed.forEach(r => { if (idx.has(r.id)) stored[idx.get(r.id)] = r; else fresh.push(r); });
    let out = fresh.concat(stored);
    if (purged && purged.length) { const p = new Set(purged); out = out.filter(r => !p.has(r.id)); }
    if (c === 'activity_log' && out.length > 3000) out.length = 3000;
    writeJSON(CP + c, out);
    mem.cols[c] = out; bump(c);
  }
  function saveMeta(mut) {
    if (legacy) { mut(mem.meta); return saveLegacy(); }
    const m = readJSON(MKEY, mem.meta); mut(m); writeJSON(MKEY, m); mem.meta = m;
  }

  /* ---------------- Chuyển đổi / ghi toàn bộ ---------------- */
  const isCol = (k, v) => Array.isArray(v) && !k.startsWith('__');
  async function migrateBlob(blob) {
    // v1 -> v2: chuyển ảnh base64 trong bản ghi sang IndexedDB
    if (!blob.__v || blob.__v < 2) {
      for (const [k, list] of Object.entries(blob)) {
        if (!isCol(k, list)) continue;
        for (const r of list) for (const [f, v] of Object.entries(r)) if (Files.isData(v)) r[f] = await Files.put(v);
      }
      blob.__v = 2;
    }
    return blob;
  }
  function writeBlob(blob) {
    colKeys().forEach(c => localStorage.removeItem(CP + c));
    Object.entries(blob).forEach(([k, v]) => { if (isCol(k, v)) writeJSON(CP + k, v); });
    writeJSON(MKEY, { __v: SCHEMA_VERSION, __seq: blob.__seq || {}, settings: blob.settings || {} }); // ghi meta sau cùng = đánh dấu hoàn tất
    mem = { meta: readJSON(MKEY), cols: {} }; Object.keys(views).forEach(bump);
  }
  function currentBlob() {
    const blob = { __v: SCHEMA_VERSION, __seq: Object.assign({}, mem.meta.__seq), settings: Object.assign({}, mem.meta.settings) };
    (legacy ? Object.keys(mem.cols) : colKeys()).forEach(c => { blob[c] = legacy ? mem.cols[c] : readJSON(CP + c, []); });
    return blob;
  }
  async function migrateLegacy(oldText, fromPending) {
    const blob = JSON.parse(oldText);
    if (!fromPending) await Backups.add('Tự động trước khi nâng cấp dữ liệu v1 → v2', oldText, { pending: true, kind: 'migration' });
    await migrateBlob(blob);
    localStorage.removeItem(LEGACY_KEY); // đã có bản sao lưu trong IndexedDB — giải phóng chỗ trước khi ghi
    writeBlob(blob);
    await Backups.markDone();
  }

  /* ---------------- Sao lưu trong IndexedDB ---------------- */
  const Backups = {
    async add(reason, text, extra = {}) {
      if (legacy) return null;
      const rec = Object.assign({ id: 'bk_' + Date.now().toString(36) + U.uid().slice(-3), at: U.stamp(), reason, size: text.length, kind: 'manual', data: text }, extra);
      await tx('backups', 'readwrite', s => s.put(rec));
      await Backups.prune(); return rec;
    },
    async list() { if (legacy) return []; const all = await tx('backups', 'readonly', s => s.getAll()); return (all || []).map(b => Object.assign({}, b, { data: undefined })).sort((a, b) => b.id.localeCompare(a.id)); },
    async get(id) { return tx('backups', 'readonly', s => s.get(id)); },
    async markDone() { const all = await tx('backups', 'readonly', s => s.getAll()); for (const b of all || []) if (b.pending) { b.pending = false; await tx('backups', 'readwrite', s => s.put(b)); } },
    async pending() { const all = await tx('backups', 'readonly', s => s.getAll()); return (all || []).filter(b => b.pending).sort((a, b) => b.id.localeCompare(a.id))[0]; },
    async prune() {
      const all = (await tx('backups', 'readonly', s => s.getAll()) || []).sort((a, b) => b.id.localeCompare(a.id));
      const auto = all.filter(b => b.kind === 'auto'), other = all.filter(b => b.kind !== 'auto' && b.kind !== 'migration');
      const drop = auto.slice(10).concat(other.slice(30)); // bản nâng cấp dữ liệu không bao giờ tự xoá
      for (const b of drop) await tx('backups', 'readwrite', s => s.delete(b.id));
    },
    async snapshot(reason, kind = 'manual') { return Backups.add(reason, JSON.stringify(currentBlob()), { kind }); },
    async auto() {
      if (legacy) return;
      const last = (await Backups.list()).find(b => b.kind === 'auto');
      if (!last || last.at.slice(0, 10) !== U.today()) await Backups.snapshot('Tự động hằng ngày', 'auto');
    }
  };

  /* ---------------- Khởi động ---------------- */
  let readyP = null;
  async function boot() {
    let hasIDB = true; try { await idb(); } catch (e) { hasIDB = false; }
    const m = readJSON(MKEY, null);
    const old = localStorage.getItem(LEGACY_KEY);
    if (m && m.__v >= 2) {
      mem = { meta: m, cols: {} };
      if (old && hasIDB) localStorage.removeItem(LEGACY_KEY); // lần chuyển đổi trước đã sao lưu bản này
    } else if (!hasIDB) {
      legacy = true;
      const blob = old ? JSON.parse(old) : global.TMG_SEED();
      mem = { meta: { __v: 1, __seq: blob.__seq || {}, settings: blob.settings || {} }, cols: {} };
      Object.entries(blob).forEach(([k, v]) => { if (isCol(k, v)) mem.cols[k] = v; });
      if (!old) saveLegacy();
      console.warn('TMG: chạy chế độ dự phòng (không có IndexedDB)');
    } else if (old) {
      await migrateLegacy(old);
    } else {
      const pend = await Backups.pending(); // chuyển đổi trước đó bị ngắt giữa chừng
      if (pend) await migrateLegacy((await Backups.get(pend.id)).data, true);
      else writeBlob(await migrateBlob(global.TMG_SEED()));
    }
    try { await Backups.auto(); } catch (e) { console.warn('Không tạo được bản sao lưu tự động', e); }
  }

  /* ---------------- API ---------------- */
  const Store = {
    U, Files, Backups, SCHEMA_VERSION, NS,
    ready() { return readyP || (readyP = boot()); },
    isLegacy: () => legacy,
    all(c) { ensure(); return views[c] || (views[c] = col(c).filter(r => !r._deleted)); },
    get(c, id) { if (!id) return undefined; return col(c).find(r => r.id === id); }, // gồm cả bản ghi trong thùng rác (để hiển thị tên)
    cols() { ensure(); return legacy ? Object.keys(mem.cols) : colKeys(); },
    nextCode(c, prefix) {
      let n;
      saveMeta(m => { m.__seq = m.__seq || {}; const base = m.__seq[c] != null ? m.__seq[c] : col(c).length; n = base + 1; m.__seq[c] = n; });
      return prefix + U.pad(n);
    },
    insert(c, rec, user) {
      const r = Object.assign({ id: U.uid() }, rec, { created_at: U.stamp(), created_by: user || Store.userName(), updated_at: '', updated_by: '' });
      persist(c, [r]); log('Thêm', c, r, user); return r;
    },
    update(c, id, patch, user) {
      refresh(c);
      const r = col(c).find(x => x.id === id); if (!r) return null;
      Object.assign(r, patch, { updated_at: U.stamp(), updated_by: user || Store.userName() });
      persist(c, [r]); log('Sửa', c, r, user); return r;
    },
    remove(c, id, user) { // xoá mềm -> thùng rác
      refresh(c);
      const r = col(c).find(x => x.id === id); if (!r || r._deleted) return;
      Object.assign(r, { _deleted: U.stamp(), _deleted_by: user || Store.userName() });
      persist(c, [r]); log('Xoá', c, r, user);
    },
    restore(c, id, user) {
      refresh(c);
      const r = col(c).find(x => x.id === id); if (!r) return;
      delete r._deleted; delete r._deleted_by;
      persist(c, [r]); log('Khôi phục', c, r, user);
    },
    purge(c, id, user) { const r = Store.get(c, id); persist(c, [], [id]); log('Xoá vĩnh viễn', c, r || { id }, user); },
    trash() {
      const out = [];
      Store.cols().forEach(c => { if (c !== 'activity_log') col(c).forEach(r => { if (r._deleted) out.push({ col: c, rec: r }); }); });
      return out.sort((a, b) => String(b.rec._deleted).localeCompare(String(a.rec._deleted)));
    },
    settings() { ensure(); return (mem.meta.settings = mem.meta.settings || {}); },
    saveSettings(s) { saveMeta(m => { m.settings = Object.assign(m.settings || {}, s); }); },
    // Sao lưu ra file: gồm cả ảnh
    async exportJSON() {
      const blob = currentBlob(); const files = {};
      for (const [k, list] of Object.entries(blob)) if (isCol(k, list)) for (const r of list) for (const v of Object.values(r)) if (Files.isRef(v) && !files[v]) { const d = await Files.get(v); if (d) files[v] = d; }
      blob.__files = files;
      return JSON.stringify(blob);
    },
    async importJSON(txt, reason = 'Tự động trước khi khôi phục từ file') {
      const blob = JSON.parse(txt);
      if (!blob || typeof blob !== 'object' || !Object.entries(blob).some(([k, v]) => isCol(k, v))) throw new Error('File sao lưu không hợp lệ');
      if (legacy) throw new Error('Trình duyệt này không hỗ trợ khôi phục (thiếu IndexedDB)');
      await Backups.snapshot(reason);
      if (blob.__files) { for (const [ref, d] of Object.entries(blob.__files)) await Files.putAs(ref, d); delete blob.__files; }
      writeBlob(await migrateBlob(blob));
    },
    async restoreBackup(id) { const b = await Backups.get(id); if (!b) throw new Error('Không tìm thấy bản sao lưu'); await Store.importJSON(b.data, 'Tự động trước khi khôi phục bản ' + b.at); },
    async reset() { await Backups.snapshot('Tự động trước khi khởi tạo lại dữ liệu mẫu'); writeBlob(await migrateBlob(global.TMG_SEED())); },
    async wipe(keep) { await Backups.snapshot('Tự động trước khi xoá sạch dữ liệu'); const b = currentBlob(); Object.keys(b).forEach(k => { if (isCol(k, b[k]) && !keep.includes(k)) delete b[k]; }); b.__seq = {}; writeBlob(b); },
    usage() { let n = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && (k.startsWith(P) || k === LEGACY_KEY)) n += (localStorage.getItem(k) || '').length; } return n; },
    // Phiên đăng nhập quản trị
    session() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)); } catch (e) { return null; } },
    setSession(s, remember) { const t = JSON.stringify(s); sessionStorage.setItem(SESSION_KEY, t); if (remember) localStorage.setItem(SESSION_KEY, t); },
    clearSession() { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); },
    actor: null, // App tài xế đặt tên tài xế ở đây để nhật ký ghi đúng người
    userName() { if (Store.actor) return Store.actor; const s = Store.session(); return s ? s.name : 'Hệ thống'; },
    label(c, id, field) { const r = id && Store.get(c, id); if (!r) return ''; return r[field || 'name'] || r.plate || r.code || ''; },
    // HTML ảnh: tham chiếu IndexedDB được nạp tự động
    img(v, attrs = '') { if (!v) return ''; return Files.isRef(v) ? `<img data-file="${U.esc(v)}" ${attrs}>` : `<img src="${U.esc(v)}" ${attrs}>`; },
    onChange: null
  };
  function log(action, c, r, user) {
    if (c === 'activity_log') return;
    const e = { id: U.uid(), time: U.stamp(), user: user || Store.userName(), action, module: c, record: (r && (r.code || r.plate || r.name || r.order_no || r.id)) || '' };
    try { persist('activity_log', [e]); } catch (err) { /* nhật ký không được chặn thao tác chính */ }
  }

  /* ---- Tính toán tài chính dùng chung cho Admin & App tài xế ---- */
  Store.finance = function (opts) {
    const { from, to, vehicle } = opts || {}; // from/to: YYYY-MM-DD
    const inRange = d => { const x = String(d || '').slice(0, 10); return (!from || x >= from) && (!to || x <= to); };
    const vOk = v => !vehicle || v === vehicle;
    const rows = [];
    Store.all('revenue').forEach(r => { if (r.status !== 'Đã xác nhận' || !inRange(r.date) || !vOk(r.vehicle_id)) return; rows.push({ kind: 'rev', vehicle: r.vehicle_id, date: r.date, cat: r.type || 'Cước vận chuyển', amount: U.num(r.amount) }); });
    Store.all('cost_request').forEach(r => { if (!['Đã duyệt', 'Đã chi'].includes(r.status) || !inRange(r.date) || !vOk(r.vehicle_id)) return; rows.push({ kind: 'cost', src: 'Đề nghị chi phí', vehicle: r.vehicle_id, date: r.date, cat: Store.label('cost_category', r.category_id) || 'Khác', amount: U.num(r.amount) }); });
    Store.all('op_cost').forEach(r => { if (!inRange(r.date) || !vOk(r.vehicle_id)) return; rows.push({ kind: 'cost', src: 'Chi phí vận hành', vehicle: r.vehicle_id, date: r.date, cat: Store.label('cost_category', r.category_id) || 'Khác', amount: U.num(r.amount) }); });
    Store.all('route_fuel').forEach(r => { if (!inRange(r.date) || !vOk(r.vehicle_id)) return; rows.push({ kind: 'cost', src: 'Nhiên liệu', vehicle: r.vehicle_id, date: r.date, cat: 'Nhiên liệu', amount: U.num(r.total) }); });
    Store.all('repair_ticket').forEach(r => { if (r.approved !== 'Có' || !inRange(r.start_date) || !vOk(r.vehicle_id)) return; rows.push({ kind: 'cost', src: 'Sửa chữa', vehicle: r.vehicle_id, date: r.start_date, cat: 'Sửa chữa, bảo dưỡng', amount: U.num(r.total) }); });
    const revenue = rows.filter(r => r.kind === 'rev').reduce((s, r) => s + r.amount, 0);
    const cost = rows.filter(r => r.kind === 'cost').reduce((s, r) => s + r.amount, 0);
    return { rows, revenue, cost, profit: revenue - cost };
  };

  // Đồng bộ khi tab khác (VD: App tài xế) thay đổi dữ liệu
  global.addEventListener('storage', e => {
    if (!mem || legacy) return;
    if (e.key === null) { mem.cols = {}; Object.keys(views).forEach(bump); }
    else if (e.key === MKEY) mem.meta = readJSON(MKEY, mem.meta);
    else if (e.key.startsWith(CP)) { const c = e.key.slice(CP.length); delete mem.cols[c]; bump(c); }
    else return;
    if (Store.onChange) Store.onChange(e.key);
  });

  global.Store = Store;
  global.U = U;
})(window);
