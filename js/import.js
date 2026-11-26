/* TMG TMS - Nhập "Bảng tổng hợp tháng" từ file Excel (.xlsx)
   - Đọc .xlsx trực tiếp trên trình duyệt (zip + XML), không cần thư viện ngoài
   - Mỗi dòng container  -> Đơn hàng + Doanh thu cước (tách VAT) + Thu chi hộ nâng/hạ & Chi phí chi hộ (bù trừ, không ảnh hưởng lãi)
   - Các khoản (1)…(9) cuối bảng -> Chi phí vận hành của tháng, chia đều cho các xe chạy trong tháng
   - Mọi bản ghi được gắn import_batch để gỡ lại cả đợt (chuyển vào thùng rác, khôi phục được) */
(function (global) {
  'use strict';

  /* ---------- Đọc file .xlsx ---------- */
  const T = (node, name) => [...node.getElementsByTagNameNS('*', name)];
  const xml = s => new DOMParser().parseFromString(s, 'application/xml');
  async function inflate(bytes) {
    const ds = new DecompressionStream('deflate-raw');
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer());
  }
  async function unzip(buf) {
    const u8 = new Uint8Array(buf), dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), td = new TextDecoder();
    let e = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error('File không phải Excel .xlsx (hãy lưu lại dạng .xlsx rồi thử lại)');
    const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const files = {};
    for (let k = 0; k < n && dv.getUint32(p, true) === 0x02014b50; k++) {
      const method = dv.getUint16(p + 10, true), size = dv.getUint32(p + 20, true);
      const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const name = td.decode(u8.subarray(p + 46, p + 46 + nl));
      const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
      files[name] = { method, data: u8.subarray(start, start + size) };
      p += 46 + nl + xl + cl;
    }
    return async name => {
      const f = files[name]; if (!f) return null;
      if (f.method === 0) return td.decode(f.data);
      if (f.method === 8) return td.decode(await inflate(f.data));
      throw new Error('Kiểu nén trong file Excel không hỗ trợ');
    };
  }
  async function readXlsx(buf) {
    if (typeof DecompressionStream === 'undefined') throw new Error('Trình duyệt quá cũ, hãy dùng Chrome / Edge / Safari bản mới');
    const get = await unzip(buf);
    const wbTxt = await get('xl/workbook.xml'); if (!wbTxt) throw new Error('Không đọc được danh sách sheet trong file');
    const rels = {}; const relTxt = await get('xl/_rels/workbook.xml.rels');
    if (relTxt) T(xml(relTxt), 'Relationship').forEach(r => { rels[r.getAttribute('Id')] = r.getAttribute('Target'); });
    const ssTxt = await get('xl/sharedStrings.xml');
    const ss = ssTxt ? T(xml(ssTxt), 'si').map(si => T(si, 't').filter(t => t.parentNode.localName !== 'rPh').map(t => t.textContent).join('')) : [];
    const sheets = [];
    for (const s of T(xml(wbTxt), 'sheet')) {
      const rid = s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || s.getAttribute('r:id');
      let tg = rels[rid]; if (!tg) continue;
      tg = tg.startsWith('/') ? tg.slice(1) : 'xl/' + tg.replace(/^\.\//, '');
      const txt = await get(tg); if (!txt) continue;
      const rows = {};
      T(xml(txt), 'c').forEach(c => {
        const m = /^([A-Z]+)(\d+)$/.exec(c.getAttribute('r') || ''); if (!m) return;
        const t = c.getAttribute('t'), v = T(c, 'v')[0]; let val;
        if (t === 's') val = v ? ss[+v.textContent] : '';
        else if (t === 'inlineStr') val = T(c, 't').map(x => x.textContent).join('');
        else if (t === 'str' || t === 'e' || t === 'b') val = v ? v.textContent : '';
        else val = v && v.textContent !== '' ? Number(v.textContent) : '';
        if (val === '' || val == null || (typeof val === 'number' && isNaN(val))) return;
        (rows[+m[2]] = rows[+m[2]] || {})[m[1]] = val;
      });
      sheets.push({ name: s.getAttribute('name') || '', rows });
    }
    return sheets;
  }

  /* ---------- Hiểu "Bảng tổng hợp tháng" ---------- */
  const low = s => String(s ?? '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
  const txt = v => typeof v === 'number' ? String(v) : String(v ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
  const money = v => typeof v === 'number' ? Math.round(v) : Number(String(v ?? '').replace(/[^\d-]/g, '')) || 0;
  const colIdx = c => [...c].reduce((s, ch) => s * 26 + ch.charCodeAt(0) - 64, 0);
  const colName = n => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  function toDate(v) {
    if (typeof v === 'number' && v > 20000 && v < 80000) return new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10);
    const s = String(v ?? '').trim(); let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/.exec(s);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); return m ? m[0] : '';
  }
  const isCont = s => /^[A-Z]{3}[UJZ]?\d{6,7}$/.test(String(s).replace(/\s+/g, '').toUpperCase());

  function parseSheet(sh) {
    const R = sh.rows, nums = Object.keys(R).map(Number).sort((a, b) => a - b);
    const hr = nums.find(n => Object.values(R[n]).some(v => /số container/.test(low(v))));
    if (!hr) return null;
    const H = R[hr], col = re => Object.keys(H).find(k => re.test(low(H[k]))) || null;
    const C = {
      no: col(/^(số|stt)$/) || 'A', cont: col(/số container/), booking: col(/booking|bill/), plate: col(/số xe|biển số/), date: col(/ngày/),
      size: col(/^cont$|loại cont/), pick: col(/pick ?up|cảng nâng/), place: col(/đóng hàng|rút hàng/), drop: col(/drop|cảng hạ/),
      lolo: col(/lolo|n\/h/), dep: col(/^cược/), freight: col(/^cước/), inv: col(/hd số|hđ số|hóa đơn|hoá đơn/), total: col(/tổng tiền/), q: col(/xuất|nhập|thanh toán/), cust: col(/khách/)
    };
    if (!C.cont || !C.plate || !C.freight) return null;
    const qIsMove = C.q && /xuất|nhập/.test(low(H[C.q]));
    const lolo2 = C.lolo ? colName(colIdx(C.lolo) + 1) : null; // cột "HẠ" ngay sau cột "NÂNG"
    const sizes = {};
    nums.filter(n => n > hr && n <= hr + 3).forEach(n => Object.entries(R[n]).forEach(([k, v]) => { if (v === 20 || v === 40 || v === 45 || /^(20|40|45)('|ft)?$/i.test(txt(v))) sizes[k] = parseInt(txt(v)) + "'"; }));
    const known = new Set(Object.values(C).concat(lolo2, Object.keys(sizes)).filter(Boolean));
    // Tháng / năm
    let month = 0;
    for (const n of nums.filter(n => n <= hr)) for (const v of Object.values(R[n])) { const m = /tháng\s*(\d{1,2})/.exec(low(v)); if (m) { month = +m[1]; break; } }
    if (!month) { const m = /(\d{1,2})/.exec(sh.name); if (m) month = +m[1]; }
    const trips = [], costs = [], warn = []; let total = null, last = { inv: '', cust: '' };
    for (const n of nums) {
      if (n <= hr) continue;
      const r = R[n], a = low(r[C.no] ?? r.A);
      if (/^total/.test(a)) { if (!total) total = { freight: money(r[C.freight]), lolo: money(r[C.lolo]), dep: money(r[C.dep]), sum: money(r[C.total]) }; continue; }
      const cm = /^\((\d+)\)\s*(.+)$/.exec(txt(r.A));
      if (cm) { costs.push({ row: n, no: +cm[1], label: cm[2], amount: money(r[C.freight]), note: Object.keys(r).filter(k => k !== 'A' && k !== C.freight && typeof r[k] === 'string' && !/cần xử lý|ghi chú|nhận xét/i.test(r[k])).map(k => txt(r[k])).join(' ') }); continue; }
      if (total || !isCont(r[C.cont])) continue;
      const inv = C.inv ? txt(r[C.inv]) : '', tot = C.total ? money(r[C.total]) : 0, cu = C.cust ? txt(r[C.cust]) : '';
      if (inv || tot || cu) last = { inv, cust: cu || last.cust };
      const q = C.q ? txt(r[C.q]) : '', place = C.place ? txt(r[C.place]) : '';
      const mv = qIsMove && /xuất/i.test(q) ? 'Xuất' : qIsMove && /nhập/i.test(q) ? 'Nhập' : (qIsMove && /rỗng/i.test(q)) || /trả rỗng|lấy rỗng/i.test(place) ? 'Rỗng' : '';
      const sz = Object.keys(sizes).find(k => r[k] != null && r[k] !== '');
      const t = {
        row: n, cont: txt(r[C.cont]).replace(/\s+/g, '').toUpperCase(), booking: C.booking ? txt(r[C.booking]) : '', plate: /[a-z]/i.test(txt(r[C.plate])) ? txt(r[C.plate]) : '', date: toDate(r[C.date]),
        size: sz ? sizes[sz] : '', pick: C.pick ? txt(r[C.pick]) : '', place, drop: C.drop ? txt(r[C.drop]) : '',
        lift: C.lolo ? money(r[C.lolo]) : 0, dropFee: lolo2 ? money(r[lolo2]) : 0, dep: C.dep ? money(r[C.dep]) : 0, freight: money(r[C.freight]),
        inv: inv || last.inv, cust: cu || last.cust, move: mv,
        note: [!qIsMove && q ? 'Thanh toán: ' + q : '', ...Object.keys(r).filter(k => !known.has(k) && k !== 'A').map(k => txt(r[k]))].filter(Boolean).join(' · ')
      };
      if (!t.date) warn.push(`Dòng ${n} (${t.cont}): thiếu ngày vận chuyển`);
      if (!t.plate) warn.push(`Dòng ${n} (${t.cont}): thiếu số xe${C.plate && r[C.plate] != null ? ` (ghi "${txt(r[C.plate])}")` : ''} — gán cho xe chọn ở ô "Dòng thiếu số xe"`);
      if (!t.freight) warn.push(`Dòng ${n} (${t.cont}): chưa có cước`);
      trips.push(t);
    }
    // Năm: năm xuất hiện nhiều nhất trong ngày vận chuyển
    const yc = {}; trips.forEach(t => { if (t.date) yc[t.date.slice(0, 4)] = (yc[t.date.slice(0, 4)] || 0) + 1; });
    const year = Object.entries(yc).sort((a, b) => b[1] - a[1])[0];
    const y = year ? year[0] : String(new Date().getFullYear());
    if (!month) { const mc = {}; trips.forEach(t => { if (t.date) mc[t.date.slice(5, 7)] = (mc[t.date.slice(5, 7)] || 0) + 1; }); const top = Object.entries(mc).sort((a, b) => b[1] - a[1])[0]; month = top ? +top[0] : 0; }
    if (!month) return null;
    const ym = y + '-' + String(month).padStart(2, '0');
    // Ngày gõ ngược kiểu tháng/ngày (VD "09/04/2026" trong sheet tháng 9 = 04/09): đảo lại nếu đảo xong mới đúng tháng của sheet
    trips.forEach(t => {
      if (!t.date || t.date.slice(0, 7) === ym) return;
      const [yy, mm, dd] = t.date.split('-'), sw = `${yy}-${dd}-${mm}`;
      if (+dd <= 12 && sw.slice(0, 7) === ym) { t.date = sw; t.swapped = true; }
    });
    const nsw = trips.filter(t => t.swapped).length;
    if (nsw) warn.push(`${nsw} ngày được hiểu theo kiểu tháng/ngày và đã đảo lại cho đúng tháng ${month} (VD dòng ${trips.find(t => t.swapped).row}: ${trips.find(t => t.swapped).date.split('-').reverse().join('/')})`);
    trips.forEach(t => { if (t.date && t.date.slice(0, 7) !== ym) warn.push(`Dòng ${t.row} (${t.cont}): ngày ${t.date.split('-').reverse().join('/')} không thuộc tháng ${month}/${y}`); });
    const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
    const got = { freight: sum(trips, t => t.freight), lolo: sum(trips, t => t.lift + t.dropFee), cost: sum(costs, c => c.amount) };
    return { name: sh.name, ym, trips, costs, total, got, warn };
  }

  /* ---------- Ghi vào TMG ---------- */
  const CAT_MAP = [
    [/lương/, 'Lương tài xế', 'Chi phí cố định (theo xe)'], [/vetc|cầu đường|bot/, 'Phí cầu đường / BOT', 'Chi phí biến đổi (theo chuyến)'],
    [/cont đẹp/, 'Phí chọn cont (cont đẹp)', 'Chi phí biến đổi (theo chuyến)'], [/săm|lốp|vá vỏ/, 'Săm lốp, vá vỏ', 'Chi phí biến đổi (theo chuyến)'],
    [/sửa xe|sửa chữa/, 'Sửa chữa, bảo dưỡng', 'Chi phí cố định (theo xe)'], [/bảo hiểm/, 'Bảo hiểm xe', 'Chi phí cố định (theo xe)'],
    [/dầu|nhiên liệu/, 'Nhiên liệu', 'Chi phí biến đổi (theo chuyến)'], [/kế toán/, 'Phí kế toán dịch vụ', 'Chi phí khác'], [/khác/, 'Chi phí khác', 'Chi phí khác']
  ];
  const LOLO_CAT = ['Phí nâng hạ (chi hộ)', 'Chi phí biến đổi (theo chuyến)'];
  const nameKey = s => low(s).replace(/[.,]/g, '');
  const plateKey = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const tripKey = (ym, t) => `${ym}|${t.cont}|${t.date}|${plateKey(t.plate)}`;
  const BATCH_COLS = ['order', 'revenue', 'cost_request', 'op_cost'];
  const batchOf = ym => 'TH-' + ym;

  // Số chuyến trong sheet đã có sẵn trong TMG (đã nhập trước đó)
  function existing(p) {
    const keys = new Set(global.Store.all('order').map(o => o.import_key).filter(Boolean));
    return p.trips.filter(t => keys.has(tripKey(p.ym, t))).length;
  }

  async function apply(p, opts) {
    const S = global.Store, U = global.U, o = opts || {};
    const vat = o.vat || '8%', rate = global.TMG_vatRate(vat), user = o.user || S.userName(), batch = batchOf(p.ym);
    const add = { vehicle: [], customer: [], location: [], cost_category: [], order: [], revenue: [], cost_request: [], op_cost: [] }, pre = {};
    const mk = (c, rec, prefix) => { const r = Object.assign({ id: U.uid() }, rec); if (prefix) pre[c] = prefix; add[c].push(r); return r; };
    // Danh mục: tìm theo tên / biển số, chưa có thì tạo
    const vmap = new Map(S.all('vehicle').map(v => [plateKey(v.plate), v.id]));
    const veh = plate => { const k = plateKey(plate); if (!k) return ''; if (!vmap.has(k)) vmap.set(k, mk('vehicle', { plate: plate.trim(), note: 'Tạo khi nhập bảng tổng hợp ' + p.name }).id); return vmap.get(k); };
    const cmap = new Map(S.all('customer').map(c => [nameKey(c.name), c.id]));
    const cust = name => { const nm = name || 'Khách chưa ghi tên'; const k = nameKey(nm); if (!cmap.has(k)) cmap.set(k, mk('customer', { name: nm, type: 'Khách hàng doanh nghiệp' }, 'KH').id); return cmap.get(k); };
    const lmap = new Map(S.all('location').map(l => [nameKey(l.name), l.id]));
    const loc = name => {
      if (!name || /trả rỗng|lấy rỗng/i.test(name)) return ''; const k = nameKey(name);
      if (!lmap.has(k)) lmap.set(k, mk('location', { name, type: /cảng|icd|depot|cát lái|tân cảng|sotrans|solog|g-fortune|logistics|bãi/i.test(name) ? 'Cảng' : /nhà máy|công ty|cty|tnhh/i.test(name) ? 'Nhà máy' : 'Khác' }, 'DD').id);
      return lmap.get(k);
    };
    const catmap = new Map(S.all('cost_category').map(c => [nameKey(c.name), c.id]));
    const cat = (name, group) => { const k = nameKey(name); if (!catmap.has(k)) catmap.set(k, mk('cost_category', { name, group, driver_app: 'Không', note: 'Tạo khi nhập bảng tổng hợp' }).id); return catmap.get(k); };

    const have = new Set(S.all('order').map(r => r.import_key).filter(Boolean));
    const res = { sheet: p.name, ym: p.ym, trips: 0, skipped: 0, revenue: 0, lolo: 0, costs: 0 };
    p.trips.forEach(t => {
      const key = tripKey(p.ym, t); if (have.has(key)) { res.skipped++; return; } have.add(key);
      const fb = !t.plate && o.fallbackPlate; // dòng thiếu số xe -> gán cho xe được chọn
      const vehicle_id = veh(t.plate || o.fallbackPlate || ''), customer_id = cust(t.cust), date = t.date || p.ym + '-01';
      if (fb) t.note = [t.note, `File không ghi số xe, gán cho xe ${o.fallbackPlate}`].filter(Boolean).join(' · ');
      const amt = rate ? Math.round(t.freight / (1 + rate)) : t.freight;
      const od = mk('order', {
        status: 'Hoàn thành', order_no: t.cont, customer_id, vehicle_id, pickup_location: loc(t.pick), drop_location: loc(t.drop), pickup_date: date, drop_date: date,
        freight: amt, extra_fee: 0, vat, revenue: amt, booking: t.booking, cont_size: t.size, move_type: t.move, stuff_place: t.place,
        lift_fee: t.lift, drop_fee: t.dropFee, deposit: t.dep, invoice_ref: t.inv, note: t.note, import_key: key, import_batch: batch
      }, 'DH');
      const base = { date, vehicle_id, customer_id, order_id: od.id, collect: 'Công nợ', status: 'Đã xác nhận', source: 'Web', import_key: key, import_batch: batch };
      if (t.freight) { mk('revenue', Object.assign({ type: 'Cước vận chuyển', amount: amt, vat, total: amt + Math.round(amt * rate), note: `Cont ${t.cont}${t.inv ? ' · HĐ số ' + t.inv : ''}` }, base), 'DT'); res.revenue += amt; }
      const lolo = t.lift + t.dropFee;
      if (lolo) {
        const d = `Chi hộ nâng ${U.money(t.lift)} + hạ ${U.money(t.dropFee)} · cont ${t.cont}`;
        mk('revenue', Object.assign({ type: 'Thu chi hộ (nâng/hạ)', amount: lolo, vat: 'Không chịu thuế', total: lolo, note: d }, base), 'DT');
        mk('cost_request', { date, vehicle_id, category_id: cat(LOLO_CAT[0], LOLO_CAT[1]), amount: lolo, pay_method: 'Công ty chi trực tiếp', description: d, status: 'Đã chi', approver: user, approved_at: U.now(), paid_at: date, source: 'Web', import_key: key, import_batch: batch }, 'DN');
        res.lolo += lolo;
      }
      res.trips++;
    });
    // Chi phí tháng: phân bổ cho các xe theo số chuyến trong tháng (xe thuê ngoài chạy 1-2 chuyến chỉ gánh phần nhỏ)
    const tc = {}; p.trips.forEach(t => { const v = veh(t.plate || o.fallbackPlate || ''); if (v) tc[v] = (tc[v] || 0) + 1; });
    let vids = Object.keys(tc).sort((a, b) => tc[b] - tc[a]);
    if (!vids.length) { const v0 = S.all('vehicle')[0]; if (v0) { vids = [v0.id]; tc[v0.id] = 1; } }
    const nT = vids.reduce((s, v) => s + tc[v], 0);
    const haveC = new Set(S.all('op_cost').map(r => r.import_key).filter(Boolean));
    p.costs.filter(c => c.amount > 0 && vids.length).forEach(c => {
      const l = low(c.label), m = CAT_MAP.find(x => x[0].test(l)) || [null, c.label.replace(/\(.*?\)/g, '').trim(), 'Chi phí khác'];
      const category_id = cat(m[1], m[2]);
      const share = vids.map(v => Math.floor(c.amount * tc[v] / nT)); share[0] += c.amount - share.reduce((s, x) => s + x, 0); // phần lẻ dồn cho xe chạy nhiều nhất
      vids.forEach((vid, i) => {
        const key = `${p.ym}|C${c.no}|${vid}`; if (haveC.has(key) || !share[i]) return; haveC.add(key);
        mk('op_cost', { date: p.ym + '-01', vehicle_id: vid, category_id, amount: share[i], period: 'Một lần', description: `(${c.no}) ${c.label} — tổng ${U.money(c.amount)} đ${vids.length > 1 ? `, phân bổ theo số chuyến (${tc[vid]}/${nT} chuyến)` : ''}${c.note ? ' · ' + c.note : ''}`, import_key: key, import_batch: batch }, 'CP');
        res.costs += share[i];
      });
    });
    // Cấp mã liền dải cho từng bảng, rồi ghi (danh mục trước, giao dịch sau)
    for (const c of Object.keys(pre)) { const cs = await S.codes(c, pre[c], add[c].length); add[c].forEach((r, i) => { r.code = cs[i]; }); }
    const note = 'Nhập bảng tổng hợp ' + p.name;
    Object.keys(add).forEach(c => S.insertMany(c, add[c], user, note));
    res.created = Object.fromEntries(Object.entries(add).map(([c, a]) => [c, a.length]));
    return res;
  }

  // Các đợt đã nhập (để xem / gỡ)
  function batches() {
    const S = global.Store, out = {};
    BATCH_COLS.forEach(c => S.all(c).forEach(r => { if (!r.import_batch) return; const b = out[r.import_batch] = out[r.import_batch] || { batch: r.import_batch, ym: r.import_batch.slice(3), counts: {}, at: '' }; b.counts[c] = (b.counts[c] || 0) + 1; if ((r.created_at || '') > b.at) b.at = r.created_at; }));
    return Object.values(out).sort((a, b) => b.ym.localeCompare(a.ym));
  }
  function undo(batch, user) {
    const S = global.Store; let n = 0;
    BATCH_COLS.forEach(c => { n += S.removeMany(c, S.all(c).filter(r => r.import_batch === batch).map(r => r.id), user, 'Gỡ đợt nhập ' + batch); });
    return n;
  }

  global.TMG_Import = { readXlsx, parseSheet, apply, existing, batches, undo, toDate };
})(window);
