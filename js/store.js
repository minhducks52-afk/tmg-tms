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
  // Chế độ máy chủ (Supabase): bật khi có js/config.js; ?local=1 hoặc vùng thử nghiệm (?db=) luôn chạy trên máy
  const CLOUD_CFG = global.TMG_CLOUD || null;
  const CLOUD_ON = !!(CLOUD_CFG && CLOUD_CFG.url && CLOUD_CFG.anonKey && !NS && qs.get('local') !== '1');
  const LOCAL_P = 'tmg_tms_v2' + SUF + ':';   // dữ liệu chạy trên máy
  // App tài xế có phiên đăng nhập + bản sao riêng => mở song song với trang quản trị trên cùng trình duyệt được
  const IS_DRIVER_APP = global.TMG_APP === 'driver';
  const AUTH_KEY = IS_DRIVER_APP ? 'tmg_drv_auth' : 'tmg_tms_auth';
  const P = CLOUD_ON ? (IS_DRIVER_APP ? 'tmg_drv_cloud:' : 'tmg_tms_cloud:') : LOCAL_P;  // bản sao (cache) dữ liệu máy chủ
  const CP = P + 'c:';
  const MKEY = P + 'meta';
  const OKEY = P + 'outbox';
  const LEGACY_KEY = 'tmg_tms_db_v1' + SUF;
  const SESSION_KEY = 'tmg_tms_session' + SUF;
  const LOCAL_IDB = 'tmg_tms' + SUF;
  const IDB_NAME = CLOUD_ON ? 'tmg_tms_cloud' : LOCAL_IDB;
  const BUCKET = 'tmg-files';

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
  const idbs = {};
  function idb(name = IDB_NAME) {
    if (!idbs[name]) idbs[name] = new Promise((res, rej) => {
      if (!global.indexedDB) return rej(new Error('Trình duyệt không hỗ trợ IndexedDB'));
      let r; try { r = indexedDB.open(name, 1); } catch (e) { return rej(e); }
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains('files')) d.createObjectStore('files');
        if (!d.objectStoreNames.contains('backups')) d.createObjectStore('backups', { keyPath: 'id' });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error('IndexedDB bị chặn'));
    });
    return idbs[name];
  }
  function tx(store, mode, fn, dbName) {
    return idb(dbName).then(d => new Promise((res, rej) => {
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
      fileCache.set(ref, dataUrl);
      if (CLOUD_ON) enqueue([{ k: 'f|' + ref, t: 'file', ref }]);
      return ref;
    },
    async putAs(ref, dataUrl, dbName) { await tx('files', 'readwrite', s => s.put(dataUrl, ref), dbName); if (!dbName) fileCache.set(ref, dataUrl); },
    async get(ref, dbName) {
      if (!ref) return '';
      if (!Files.isRef(ref)) return ref;
      if (!dbName && fileCache.has(ref)) return fileCache.get(ref);
      let v = '';
      try { v = await tx('files', 'readonly', s => s.get(ref), dbName) || ''; } catch (e) { v = ''; }
      if (!v && CLOUD_ON && !dbName) v = await Cloud.download(ref); // máy khác chụp: tải từ máy chủ
      if (v && !dbName) fileCache.set(ref, v);
      return v;
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
  function persist(c, changed, purged, opts) {
    if (legacy) { const list = col(c); changed.forEach(r => { if (!list.includes(r)) list.unshift(r); }); if (purged) mem.cols[c] = list.filter(r => !purged.includes(r.id)); bump(c); return saveLegacy(); }
    if (CLOUD_ON && !(opts && opts.remote)) enqueue(changed.map(r => ({ k: 'r|' + c + '|' + r.id, t: 'up', col: c, id: r.id, data: r })).concat((purged || []).map(id => ({ k: 'r|' + c + '|' + id, t: 'del', col: c, id }))));
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

  /* ---------------- Máy chủ Supabase: hàng đợi gửi + đồng bộ ---------------- */
  // Mọi thay đổi ghi ngay vào máy (dùng được khi mất mạng), rồi xếp hàng gửi lên máy chủ
  function enqueue(ops) {
    if (!ops.length) return;
    const ob = readJSON(OKEY, []);
    ops.forEach(op => { op.ts = U.stamp() + Math.random().toString(36).slice(2, 5); const i = ob.findIndex(x => x.k === op.k); if (i >= 0) ob.splice(i, 1); ob.push(op); });
    writeJSON(OKEY, ob); Cloud.emit();
    clearTimeout(Cloud._ft); Cloud._ft = setTimeout(() => Cloud.flush(), 300);
  }
  const dequeue = sent => { const keep = readJSON(OKEY, []).filter(o => !sent.some(s => s.k === o.k && s.ts === o.ts)); writeJSON(OKEY, keep); };
  const isNetErr = e => !e || /fetch|network|Failed to|timeout|load failed/i.test(String(e.message || e)) || e.code === '' ;
  // Ghi dữ liệu nhận từ máy chủ vào bản sao trên máy (không xếp hàng gửi lại)
  function applyRemote(rows, deletes) {
    const pend = new Set(readJSON(OKEY, []).map(o => o.k));
    const byCol = {};
    rows.forEach(r => { if (!pend.has('r|' + r.col + '|' + r.id)) (byCol[r.col] = byCol[r.col] || { up: [], del: [] }).up.push(Object.assign({}, r.data, { id: r.id })); });
    (deletes || []).forEach(d => { if (!pend.has('r|' + d.col + '|' + d.id)) (byCol[d.col] = byCol[d.col] || { up: [], del: [] }).del.push(d.id); });
    Object.entries(byCol).forEach(([c, x]) => persist(c, x.up, x.del, { remote: true }));
    return Object.keys(byCol).length > 0;
  }
  const dataUrlToBlob = d => fetch(d).then(r => r.blob());
  const blobToDataUrl = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
  const CODE_COLS = () => { const s = new Set(['revenue', 'cost_request', 'route_fuel', 'incident', 'document', 'route', 'order']); Object.values(global.TMG_MODULES || {}).forEach(m => m.fields.some(f => f.type === 'code') && s.add(m.key)); return [...s]; };

  const Cloud = {
    on: CLOUD_ON, client: null, user: null, profile: null, error: '', realtime: '', lastSync: '', syncing: false, listeners: [],
    emit() { Cloud.listeners.forEach(f => { try { f(Cloud.state()); } catch (e) { } }); },
    onStatus(f) { Cloud.listeners.push(f); },
    onError: null,
    state() { return { on: CLOUD_ON, user: Cloud.user && Cloud.user.email, role: Cloud.profile && Cloud.profile.role, pending: readJSON(OKEY, []).length, failed: (mem && mem.meta.failed || []).length, online: global.navigator ? navigator.onLine : true, realtime: Cloud.realtime, lastSync: Cloud.lastSync, syncing: Cloud.syncing, error: Cloud.error }; },
    failedList() { return (mem && mem.meta.failed) || []; },
    driverEmail(phone) { return 'tx' + String(phone || '').replace(/\D/g, '') + '@taixe.tmgtms.vn'; },
    async rpc(fn, args) { const { data, error } = await Cloud.client.rpc(fn, args || {}); if (error) throw new Error(error.message); return data; },
    async status() { return Cloud.rpc('tmg_status'); },
    async signIn(email, password) {
      if (!Cloud.client) throw new Error(Cloud.error || 'Chưa kết nối được máy chủ');
      const { data, error } = await Cloud.client.auth.signInWithPassword({ email: String(email).trim().toLowerCase(), password });
      if (error) throw new Error(/invalid/i.test(error.message) ? 'Sai tài khoản hoặc mật khẩu' : error.message);
      await Cloud.afterLogin(data.user, false);
    },
    signOut() { try { Object.keys(localStorage).filter(k => k.startsWith(AUTH_KEY)).forEach(k => localStorage.removeItem(k)); } catch (e) { } if (Cloud.client) Cloud.client.auth.signOut().catch(() => { }); Cloud.user = Cloud.profile = null; Cloud.emit(); },
    async afterLogin(user, background) {
      const st = await Cloud.status();
      if (!st || !st.role) { Cloud.signOut(); throw new Error('Tài khoản chưa được cấp quyền sử dụng hệ thống'); }
      const prev = readJSON(MKEY, {});
      if (prev.owner && prev.owner !== user.id) { // máy dùng chung: xoá bản sao của người trước
        colKeys().forEach(c => localStorage.removeItem(CP + c)); localStorage.removeItem(OKEY);
        mem = { meta: { __v: SCHEMA_VERSION, __seq: {}, settings: {} }, cols: {} }; writeJSON(MKEY, mem.meta); Object.keys(views).forEach(bump);
      }
      saveMeta(m => { m.owner = user.id; m.profile = st; });
      Cloud.user = user; Cloud.profile = st; Cloud.error = '';
      Cloud.subscribe();
      const first = !mem.meta.lastPull;
      const p = Cloud.sync().then(() => Cloud.reserve(CODE_COLS(), true)).catch(e => { Cloud.error = e.message; Cloud.emit(); });
      if (first || !background) await p;
      Cloud.emit();
    },
    async sync() {
      if (!Cloud.user || Cloud.syncing) return;
      Cloud.syncing = true; Cloud.emit();
      try { await Cloud.flush(); await Cloud.pull(); Cloud.lastSync = U.stamp(); Cloud.error = ''; }
      catch (e) { Cloud.error = isNetErr(e) ? 'Mất kết nối máy chủ — dữ liệu được lưu tạm trên máy' : e.message; }
      finally { Cloud.syncing = false; Cloud.emit(); }
    },
    async pull() {
      // PULL_V tăng khi quyền đọc trên máy chủ mở rộng (VD: tài xế được đọc phiếu chi tạm ứng) -> lấy lại toàn bộ 1 lần
      const PULL_V = 2; const full = mem.meta.pullV !== PULL_V;
      const last = (!full && mem.meta.lastPull) || '1970-01-01T00:00:00+00:00'; let off = 0, max = last, changed = false;
      for (;;) {
        const { data, error } = await Cloud.client.from('tmg_records').select('col,id,data,updated_at').gt('updated_at', last).order('updated_at').order('col').order('id').range(off, off + 999);
        if (error) throw new Error(error.message);
        if (applyRemote(data)) changed = true;
        data.forEach(r => { if (r.updated_at > max) max = r.updated_at; });
        off += data.length; if (data.length < 1000) break;
      }
      saveMeta(m => { m.lastPull = max; m.pullV = PULL_V; });
      if (changed && Store.onChange) Store.onChange('cloud');
    },
    subscribe() {
      if (Cloud._ch || !Cloud.client) return;
      Cloud._ch = Cloud.client.channel('tmg-records').on('postgres_changes', { event: '*', schema: 'public', table: 'tmg_records' }, p => {
        const ch = p.eventType === 'DELETE' ? applyRemote([], [p.old]) : applyRemote([p.new]);
        if (ch && Store.onChange) Store.onChange('cloud');
      }).subscribe(s => { Cloud.realtime = s; Cloud.emit(); });
    },
    async flush() {
      if (!Cloud.client || !Cloud.user || Cloud._flushing) return;
      Cloud._flushing = true;
      try {
        let ob = readJSON(OKEY, []);
        // ảnh trước, để bản ghi tới máy khác là có ảnh
        for (const op of ob.filter(o => o.t === 'file')) {
          const d = await Files.get(op.ref); if (!d) { dequeue([op]); continue; }
          const { error } = await Cloud.client.storage.from(BUCKET).upload(op.ref.slice(4) + '.jpg', await dataUrlToBlob(d), { upsert: true, contentType: 'image/jpeg' });
          if (error && !/exists/i.test(error.message)) throw new Error(error.message);
          dequeue([op]); Cloud.emit();
        }
        ob = readJSON(OKEY, []).filter(o => o.t !== 'file');
        for (let i = 0; i < ob.length; i += 200) {
          const batch = ob.slice(i, i + 200), ups = batch.filter(o => o.t === 'up'), dels = batch.filter(o => o.t === 'del');
          if (ups.length) {
            const { error } = await Cloud.client.from('tmg_records').upsert(ups.map(o => ({ col: o.col, id: o.id, data: o.data })), { onConflict: 'col,id', returning: 'minimal' });
            if (error) { if (isNetErr(error)) throw error; for (const o of ups) await Cloud.sendOne(o); } else dequeue(ups);
          }
          for (const o of dels) { const { error } = await Cloud.client.from('tmg_records').delete().eq('col', o.col).eq('id', o.id); if (error && isNetErr(error)) throw error; dequeue([o]); }
          Cloud.emit();
        }
      } finally { Cloud._flushing = false; Cloud.emit(); }
    },
    // Gửi từng bản ghi khi cả lô bị từ chối, để tách bản ghi lỗi (VD: không có quyền)
    async sendOne(o) {
      const { error } = await Cloud.client.from('tmg_records').upsert([{ col: o.col, id: o.id, data: o.data }], { onConflict: 'col,id', returning: 'minimal' });
      if (error && isNetErr(error)) throw error;
      dequeue([o]);
      if (error) {
        saveMeta(m => { m.failed = (m.failed || []).concat([{ at: U.stamp(), col: o.col, id: o.id, msg: error.message }]).slice(-50); m.lastPull = ''; }); // lấy lại bản đúng từ máy chủ
        if (Cloud.onError) Cloud.onError('Máy chủ từ chối lưu ' + o.col + ': ' + error.message);
      }
    },
    async download(ref) {
      if (!Cloud.client || !Cloud.user) return '';
      try {
        const { data, error } = await Cloud.client.storage.from(BUCKET).download(ref.slice(4) + '.jpg');
        if (error || !data) return '';
        const d = await blobToDataUrl(data); await Files.putAs(ref, d); return d;
      } catch (e) { return ''; }
    },
    async reserve(cols, onlyMissing) {
      const need = cols.filter(c => { const b = (mem.meta.codes || {})[c]; return !onlyMissing || !b || b.end - b.next < 3; });
      if (!need.length || !Cloud.user) return;
      const res = await Cloud.rpc('tmg_reserve_many', { p_cols: need, p_n: 20 });
      saveMeta(m => { m.codes = m.codes || {}; Object.entries(res).forEach(([c, start]) => { m.codes[c] = { next: Number(start), end: Number(start) + 19 }; }); });
    },
    users: {
      list: () => Cloud.rpc('tmg_list_users'),
      create: (email, password, name, role, driverId) => Cloud.rpc('tmg_create_user', { p_email: email, p_password: password, p_name: name, p_role: role, p_driver_id: driverId || null }),
      setPassword: (userId, password) => Cloud.rpc('tmg_set_password', { p_user: userId, p_password: password }),
      remove: userId => Cloud.rpc('tmg_delete_user', { p_user: userId })
    },
    bootstrapAdmin: (email, password, name) => Cloud.rpc('tmg_bootstrap_admin', { p_email: email, p_password: password, p_name: name }),
    // Dữ liệu đang có trên trình duyệt này (bản chạy trên máy, v2 hoặc v1)
    localSource() {
      const meta = readJSON(LOCAL_P + 'meta', null); const blob = { __seq: {}, settings: {} };
      if (meta) { blob.__seq = meta.__seq || {}; blob.settings = meta.settings || {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(LOCAL_P + 'c:')) blob[k.slice(LOCAL_P.length + 2)] = readJSON(k, []); } }
      else { const old = readJSON(LEGACY_KEY, null); if (!old) return null; Object.assign(blob, old); }
      const counts = {}; let total = 0; Object.entries(blob).forEach(([k, v]) => { if (isCol(k, v) && k !== 'activity_log') { counts[k] = v.length; total += v.length; } });
      return { blob, counts, total };
    },
    async uploadLocal(progress) {
      const src = Cloud.localSource(); if (!src) throw new Error('Trình duyệt này không có dữ liệu chạy trên máy');
      const { blob } = src; let n = 0;
      for (const [c, list] of Object.entries(blob)) {
        if (!isCol(c, list) || c === 'activity_log') continue;
        for (const r of list) {
          if (c === 'admin') delete r.password; // không đưa mật khẩu dạng chữ lên máy chủ
          if (c === 'driver') delete r.pin;
          for (const [f, v] of Object.entries(r)) {
            if (Files.isRef(v)) { const d = await Files.get(v, LOCAL_IDB); if (d) { await Files.putAs(v, d); enqueue([{ k: 'f|' + v, t: 'file', ref: v }]); } }
            else if (Files.isData(v)) r[f] = await Files.put(v);
          }
        }
        persist(c, list); n += list.length; progress && progress(n);
      }
      if (blob.settings && Object.keys(blob.settings).length) persist('_settings', [Object.assign({}, Store.settings(), blob.settings, { id: 'main' })]);
      await Cloud.rpc('tmg_seq_floor', { p_vals: blob.__seq || {} });
      saveMeta(m => { m.codes = {}; });
      await Cloud.flush(); await Cloud.reserve(CODE_COLS());
      return n;
    }
  };

  async function bootCloud() {
    try { await idb(); } catch (e) { console.warn('Không có IndexedDB — ảnh chỉ xem được khi có mạng'); }
    mem = { meta: readJSON(MKEY, null) || { __v: SCHEMA_VERSION, __seq: {}, settings: {} }, cols: {} };
    if (!readJSON(MKEY, null)) writeJSON(MKEY, mem.meta);
    if (!global.supabase || !global.supabase.createClient) { Cloud.error = 'Không tải được thư viện kết nối máy chủ (kiểm tra mạng)'; return; }
    Cloud.client = global.supabase.createClient(CLOUD_CFG.url, CLOUD_CFG.anonKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: AUTH_KEY } });
    global.addEventListener('online', () => Cloud.sync());
    global.addEventListener('offline', () => Cloud.emit());
    setInterval(() => { if (Cloud.user) Cloud.sync(); }, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && Cloud.user) Cloud.sync(); });
    try {
      const { data } = await Cloud.client.auth.getSession();
      if (data && data.session) await Cloud.afterLogin(data.session.user, true);
    } catch (e) {
      // Không có mạng: vẫn mở bằng dữ liệu đã lưu trên máy nếu đã đăng nhập trước đó
      Cloud.error = e.message;
      if (isNetErr(e) && mem.meta.owner && mem.meta.profile) { Cloud.user = { id: mem.meta.owner, email: mem.meta.profile.email }; Cloud.profile = mem.meta.profile; }
    }
    if (Cloud.profile) saveMeta(m => { m.profile = Cloud.profile; });
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
    if (CLOUD_ON) return bootCloud();
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
      if (CLOUD_ON) { // lấy số từ dải đã giữ chỗ trên máy chủ => không trùng giữa các máy
        saveMeta(m => { const b = (m.codes || {})[c]; if (b && b.next <= b.end) { n = b.next; b.next++; } });
        Cloud.reserve([c], true).catch(() => { });
        return n != null ? prefix + U.pad(n) : prefix + '-' + Date.now().toString(36).toUpperCase().slice(-6); // mất mạng: mã tạm không trùng
      }
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
    // Lấy liền n mã cho nhập hàng loạt (trên máy chủ: giữ chỗ 1 dải riêng => không trùng giữa các máy)
    async codes(c, prefix, n) {
      if (!n) return [];
      if (CLOUD_ON) { const res = await Cloud.rpc('tmg_reserve_many', { p_cols: [c], p_n: n }); const s = Number(res[c]); return Array.from({ length: n }, (_, i) => prefix + U.pad(s + i)); }
      return Array.from({ length: n }, () => Store.nextCode(c, prefix));
    },
    // Ghi / xoá mềm hàng loạt (nhập file): ghi 1 lần cho cả bảng, 1 dòng nhật ký
    insertMany(c, recs, user, note) {
      if (!recs.length) return [];
      const by = user || Store.userName(), at = U.stamp();
      const out = recs.map(rec => Object.assign({ id: U.uid() }, rec, { created_at: at, created_by: by, updated_at: '', updated_by: '' }));
      persist(c, out); log(note || 'Nhập file', c, { code: out.length + ' bản ghi' }, user); return out;
    },
    removeMany(c, ids, user, note) {
      refresh(c); const set = new Set(ids), at = U.stamp(), by = user || Store.userName();
      const rs = col(c).filter(r => set.has(r.id) && !r._deleted); if (!rs.length) return 0;
      rs.forEach(r => Object.assign(r, { _deleted: at, _deleted_by: by }));
      persist(c, rs); log(note || 'Xoá hàng loạt', c, { code: rs.length + ' bản ghi' }, user); return rs.length;
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
    settings() { ensure(); if (CLOUD_ON) { const r = Store.get('_settings', 'main'); return r ? Object.assign({}, r) : {}; } return (mem.meta.settings = mem.meta.settings || {}); },
    saveSettings(s) { if (CLOUD_ON) { persist('_settings', [Object.assign({}, Store.settings(), s, { id: 'main' })]); return; } saveMeta(m => { m.settings = Object.assign(m.settings || {}, s); }); },
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
      if (blob.__files) { for (const [ref, d] of Object.entries(blob.__files)) { await Files.putAs(ref, d); if (CLOUD_ON) enqueue([{ k: 'f|' + ref, t: 'file', ref }]); } delete blob.__files; }
      await migrateBlob(blob);
      if (CLOUD_ON) { // máy chủ: gộp theo mã bản ghi rồi gửi lên (không xoá bản ghi khác trên máy chủ)
        Object.entries(blob).forEach(([c, list]) => { if (isCol(c, list) && c !== 'activity_log') persist(c, list.map(r => { const x = Object.assign({}, r); delete x.password; return x; })); });
        await Cloud.flush(); return;
      }
      writeBlob(blob);
    },
    async restoreBackup(id) { const b = await Backups.get(id); if (!b) throw new Error('Không tìm thấy bản sao lưu'); await Store.importJSON(b.data, 'Tự động trước khi khôi phục bản ' + b.at); },
    async reset() { if (CLOUD_ON) throw new Error('Không dùng được khi chạy trên máy chủ'); await Backups.snapshot('Tự động trước khi khởi tạo lại dữ liệu mẫu'); writeBlob(await migrateBlob(global.TMG_SEED())); },
    async wipe(keep) { if (CLOUD_ON) throw new Error('Không dùng được khi chạy trên máy chủ'); await Backups.snapshot('Tự động trước khi xoá sạch dữ liệu'); const b = currentBlob(); Object.keys(b).forEach(k => { if (isCol(k, b[k]) && !keep.includes(k)) delete b[k]; }); b.__seq = {}; writeBlob(b); },
    usage() { let n = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && (k.startsWith(P) || k === LEGACY_KEY)) n += (localStorage.getItem(k) || '').length; } return n; },
    // Phiên đăng nhập quản trị
    session() {
      if (CLOUD_ON) { const p = Cloud.profile; return p && Cloud.user ? { id: Cloud.user.id, name: p.name || Cloud.user.email, username: p.email || Cloud.user.email, role: p.role, driver_id: p.driver_id } : null; }
      try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
    },
    setSession(s, remember) { const t = JSON.stringify(s); sessionStorage.setItem(SESSION_KEY, t); if (remember) localStorage.setItem(SESSION_KEY, t); },
    clearSession() { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); if (CLOUD_ON) Cloud.signOut(); },
    cloud: Cloud,
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
    Store.all('revenue').forEach(r => { if (r.status !== 'Đã xác nhận' || !inRange(r.date) || !vOk(r.vehicle_id)) return; rows.push({ kind: 'rev', vehicle: r.vehicle_id, date: r.date, cat: r.type || 'Cước vận chuyển', amount: Store.revValue(r) }); });
    // Chi hộ khách (nâng/hạ, cược…): theo dõi riêng, KHÔNG tính vào doanh thu / chi phí / lãi
    Store.all('chi_ho').forEach(r => { if (!inRange(r.date) || !vOk(r.vehicle_id)) return; rows.push({ kind: 'chiho', vehicle: r.vehicle_id, date: r.date, cat: r.kind || 'Chi hộ', amount: U.num(r.amount) }); });
    Store.all('cost_request').forEach(r => { if (!['Đã duyệt', 'Đã chi'].includes(r.status) || !inRange(r.date) || !vOk(r.vehicle_id)) return; rows.push({ kind: 'cost', src: 'Đề nghị chi phí', vehicle: r.vehicle_id, date: r.date, cat: Store.label('cost_category', r.category_id) || 'Khác', amount: U.num(r.amount) }); });
    // Chi phí vận hành kỳ Quý / Năm: chia đều 3 / 12 tháng kể từ tháng hạch toán (phần lẻ dồn vào tháng cuối)
    Store.all('op_cost').forEach(r => {
      if (!vOk(r.vehicle_id)) return;
      const n = { 'Quý': 3, 'Năm': 12 }[r.period] || 1; const total = U.num(r.amount); const each = Math.floor(total / n);
      const d0 = String(r.date || '').slice(0, 10); const cat = Store.label('cost_category', r.category_id) || 'Khác';
      for (let i = 0; i < n; i++) {
        const date = i === 0 ? d0 : U.addMonths(d0.slice(0, 7), i) + '-01';
        if ((n > 1 && !d0) || !inRange(date)) continue;
        rows.push({ kind: 'cost', src: 'Chi phí vận hành', vehicle: r.vehicle_id, date, cat, amount: i === n - 1 ? total - each * (n - 1) : each });
      }
    });
    Store.all('route_fuel').forEach(r => { if (!inRange(r.date) || !vOk(r.vehicle_id)) return; rows.push({ kind: 'cost', src: 'Nhiên liệu', vehicle: r.vehicle_id, date: r.date, cat: 'Nhiên liệu', amount: U.num(r.total) }); });
    Store.all('repair_ticket').forEach(r => { if (r.approved !== 'Có' || !inRange(r.start_date) || !vOk(r.vehicle_id)) return; rows.push({ kind: 'cost', src: 'Sửa chữa', vehicle: r.vehicle_id, date: r.start_date, cat: 'Sửa chữa, bảo dưỡng', amount: U.num(r.total) }); });
    const revenue = rows.filter(r => r.kind === 'rev').reduce((s, r) => s + r.amount, 0);
    const cost = rows.filter(r => r.kind === 'cost').reduce((s, r) => s + r.amount, 0);
    const chiho = rows.filter(r => r.kind === 'chiho').reduce((s, r) => s + r.amount, 0);
    return { rows, revenue, cost, chiho, profit: revenue - cost };
  };

  /* ---- Doanh thu tính theo cước GỒM VAT (mặc định) hoặc TRƯỚC VAT — chọn trong Thiết lập công ty ---- */
  Store.revBasis = () => Store.settings().rev_basis || 'Gồm VAT';
  Store.revValue = function (r) {
    const a = U.num(r.amount); if (Store.revBasis() === 'Trước VAT') return a;
    return U.num(r.total) || a + Math.round(a * (global.TMG_vatRate ? global.TMG_vatRate(r.vat) : 0));
  };

  /* ---- Công nợ khách: cước (doanh thu công nợ, gồm VAT) + chi hộ − khách thanh toán ----
     Mỗi lần thanh toán: trừ trước vào các khoản được chọn (alloc), phần còn lại tự trừ vào khoản CŨ NHẤT của khách. */
  let recMemo = null;
  Store.receivables = function () {
    const R = Store.all('revenue'), C = Store.all('chi_ho'), P = Store.all('customer_payment');
    if (recMemo && recMemo.R === R && recMemo.C === C && recMemo.P === P) return recMemo.out;
    const vr = global.TMG_vatRate || (() => 0);
    const items = [];
    R.forEach(r => { if (r.status !== 'Đã xác nhận' || r.collect !== 'Công nợ' || !r.customer_id) return; const a = U.num(r.amount); items.push({ t: 'revenue', id: r.id, rec: r, customer: r.customer_id, date: r.date || '', inv: r.invoice_ref || '', order: r.order_id || '', due: U.num(r.total) || a + Math.round(a * vr(r.vat)), paid: 0 }); });
    C.forEach(r => { if (!r.customer_id) return; items.push({ t: 'chi_ho', id: r.id, rec: r, customer: r.customer_id, date: r.date || '', inv: r.invoice_ref || '', order: r.order_id || '', due: U.num(r.amount), paid: 0 }); });
    items.sort((a, b) => a.date.localeCompare(b.date) || a.inv.localeCompare(b.inv) || (a.t === b.t ? 0 : a.t === 'revenue' ? -1 : 1));
    const byKey = new Map(items.map(x => [x.t + '|' + x.id, x]));
    const pays = P.slice().sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || String(a.created_at || '').localeCompare(String(b.created_at || '')));
    const payInfo = {};
    pays.forEach(p => {
      let left = U.num(p.amount); const used = [];
      const take = (x, want) => { const n = Math.max(0, Math.min(left, x.due - x.paid, want)); if (n > 0) { x.paid += n; left -= n; used.push({ t: x.t, id: x.id, a: n }); } };
      (p.alloc || []).forEach(a => { const x = byKey.get(a.t + '|' + a.id); if (x && x.customer === p.customer_id) take(x, U.num(a.a) || Infinity); });
      if (p.auto !== 'Không') items.forEach(x => { if (left > 0 && x.customer === p.customer_id) take(x, Infinity); });
      payInfo[p.id] = { used, left };
    });
    items.forEach(x => { x.remain = x.due - x.paid; x.status = x.remain <= 0 ? 'Đã thanh toán' : x.paid > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán'; });
    const out = { items, byKey, payInfo };
    recMemo = { R, C, P, out }; return out;
  };
  Store.paidOf = (t, id) => { const x = Store.receivables().byKey.get(t + '|' + id); return x ? x.paid : 0; };

  /* ---- Phiếu chi tạm ứng cho tài xế: trừ dần theo chi phí / dầu tài xế nhập "Trừ vào tạm ứng" ---- */
  Store.advanceUse = function (pv) {
    const reqs = Store.all('cost_request').filter(c => c.advance_id === pv.id && c.status !== 'Từ chối');
    const fuels = Store.all('route_fuel').filter(f => f.advance_id === pv.id);
    const pending = reqs.filter(c => !['Đã duyệt', 'Đã chi'].includes(c.status)).reduce((s, c) => s + U.num(c.amount), 0);
    const used = reqs.reduce((s, c) => s + U.num(c.amount), 0) + fuels.reduce((s, f) => s + U.num(f.total), 0);
    return { reqs, fuels, used, pending, remain: U.num(pv.amount) - used };
  };
  // Các phiếu tạm ứng còn hiệu lực của tài xế, cũ nhất trước
  Store.openAdvances = function (driverId) {
    return Store.all('payment_voucher').filter(p => p.driver_id === driverId && p.kind === 'Tạm ứng cho tài xế' && p.adv_status !== 'Đã quyết toán')
      .map(pv => Object.assign({ pv }, Store.advanceUse(pv))).sort((a, b) => String(a.pv.date).localeCompare(String(b.pv.date)));
  };
  // Chọn phiếu để trừ: phiếu cũ nhất còn đủ tiền, nếu không có thì phiếu cũ nhất còn tiền
  Store.pickAdvance = function (driverId, amount) {
    const open = Store.openAdvances(driverId).filter(a => a.remain > 0);
    const a = open.find(x => x.remain >= amount) || open[0];
    return a ? a.pv : null;
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
