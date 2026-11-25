/* TMG TMS - định nghĩa module (theo cấu trúc menu CETA) + dữ liệu mẫu */
(function (global) {
  'use strict';
  const f = (k, label, type = 'text', x = {}) => Object.assign({ k, label, type }, x);
  const YN = ['Có', 'Không'];
  const VAT = ['Không chịu thuế', '0%', '5%', '8%', '10%'];
  const vatRate = v => ({ '5%': 0.05, '8%': 0.08, '10%': 0.1 }[v] || 0);
  const refVehicle = (x = {}) => f('vehicle_id', 'Xe', 'ref', Object.assign({ ref: 'vehicle', show: 'plate' }, x));
  const refDriver = (x = {}) => f('driver_id', 'Tài xế', 'ref', Object.assign({ ref: 'driver' }, x));
  const refCustomer = (x = {}) => f('customer_id', 'Khách hàng', 'ref', Object.assign({ ref: 'customer' }, x));
  const refCat = (x = {}) => f('category_id', 'Khoản mục chi phí', 'ref', Object.assign({ ref: 'cost_category', required: true }, x));
  const fuelTypes = ['Dầu Diesel 0,05S-II', 'Dầu Diesel 0,001S-V', 'Xăng A95', 'Xăng E5 RON92', 'Khí thải Ure'];

  const M = {};
  const def = (key, title, group, fields, x = {}) => { M[key] = Object.assign({ key, title, group, fields }, x); };

  /* ===== ĐƠN HÀNG ===== */
  def('order', 'Đơn hàng', 'Đơn hàng', [
    f('code', 'Mã hệ thống', 'code', { prefix: 'DH' }),
    f('status', 'Trạng thái', 'select', { options: ['Khởi tạo', 'Sẵn sàng', 'Chờ tài xế xác nhận', 'Chờ nhận hàng', 'Đang vận chuyển', 'Hoàn thành', 'Hủy'], def: 'Khởi tạo', badge: true }),
    f('order_no', 'Số đơn hàng', 'text', { required: true }),
    refCustomer({ required: true }),
    f('trailer_no', 'Số rơ moóc'),
    refVehicle(), refDriver(),
    f('pickup_location', 'Điểm nhận hàng', 'ref', { ref: 'location' }),
    f('drop_location', 'Điểm trả hàng', 'ref', { ref: 'location' }),
    f('pickup_date', 'Ngày nhận hàng', 'date', { def: 'today' }),
    f('drop_date', 'Ngày trả hàng', 'date'),
    f('goods_type', 'Hàng hóa', 'ref', { ref: 'goods_type', list: false }),
    f('weight', 'Khối lượng (kg)', 'num', { list: false }),
    f('freight', 'Cước phí vận chuyển', 'money', { sum: true }),
    f('extra_fee', 'Phụ phí', 'money', { list: false }),
    f('vat', 'VAT', 'select', { options: VAT, def: '8%', list: false }),
    f('revenue', 'Doanh thu', 'money', { sum: true, readonly: true, calc: r => U.num(r.freight) + U.num(r.extra_fee) }),
    f('note', 'Ghi chú', 'textarea', { list: false })
  ], { icon: 'order', rowActions: ['toRevenue'] });

  def('order_customer', 'Đơn đặt hàng', 'Đơn hàng', [
    f('code', 'Mã đặt hàng', 'code', { prefix: 'DDH' }), refCustomer({ required: true }),
    f('status', 'Trạng thái', 'select', { options: ['Mới', 'Đã tiếp nhận', 'Đã tạo đơn', 'Hủy'], def: 'Mới', badge: true }),
    f('pickup_location', 'Điểm nhận', 'ref', { ref: 'location' }), f('drop_location', 'Điểm trả', 'ref', { ref: 'location' }),
    f('pickup_date', 'Ngày nhận', 'date', { def: 'today' }), f('vehicle_group', 'Loại xe yêu cầu', 'ref', { ref: 'vehicle_group' }),
    f('qty', 'Số lượng xe', 'num', { def: 1 }), f('note', 'Ghi chú', 'textarea')
  ]);

  def('invoice', 'Bảng kê', 'Đơn hàng', [
    f('code', 'Mã bảng kê', 'code', { prefix: 'BK' }), f('from', 'Từ ngày', 'date'), f('to', 'Đến ngày', 'date'), refCustomer({ required: true }),
    f('status', 'Trạng thái', 'select', { options: ['Khởi tạo', 'Tạo hóa đơn nháp', 'Đã cấp số hóa đơn', 'Đang xử lý', 'Đã xác nhận', 'Đã thu tiền', 'Đã hủy'], def: 'Khởi tạo', badge: true }),
    f('amount', 'Tổng tiền', 'money', { sum: true }), f('vat', 'VAT', 'select', { options: VAT, def: '8%' }),
    f('vat_amount', 'Tiền VAT', 'money', { readonly: true, calc: r => Math.round(U.num(r.amount) * vatRate(r.vat)) }),
    f('total', 'Tổng tiền sau VAT', 'money', { sum: true, readonly: true, calc: r => U.num(r.amount) + Math.round(U.num(r.amount) * vatRate(r.vat)) }),
    f('invoice_no', 'Số hóa đơn'), f('invoice_date', 'Ngày cấp hóa đơn', 'date'),
    f('pay_status', 'Trạng thái TT', 'select', { options: ['Chưa thanh toán', 'Đã thanh toán', 'Thanh toán chưa đủ'], def: 'Chưa thanh toán', badge: true })
  ], { headerActions: ['buildInvoice'] });

  def('document', 'Chứng từ', 'Đơn hàng', [
    f('code', 'Mã', 'code', { prefix: 'CT' }), f('order_id', 'Đơn hàng', 'ref', { ref: 'order', show: 'order_no' }),
    f('name', 'Tên chứng từ', 'text', { required: true }), f('date', 'Ngày', 'date', { def: 'today' }), f('image', 'Ảnh/scan', 'image'), f('note', 'Ghi chú', 'textarea')
  ]);

  /* ===== VẬN HÀNH ===== */
  def('route', 'Chuyến xe', 'Vận hành', [
    f('code', 'Mã chuyến', 'code', { prefix: 'CX' }),
    f('type', 'Loại chuyến', 'select', { options: ['Chuyến có hàng', 'Chuyến rỗng'], def: 'Chuyến có hàng' }),
    f('status', 'Trạng thái', 'select', { options: ['Chưa bắt đầu', 'Đang chạy', 'Hoàn thành', 'Hủy'], def: 'Chưa bắt đầu', badge: true }),
    f('approve', 'TT phê duyệt', 'select', { options: ['Chưa phê duyệt', 'Đã phê duyệt'], def: 'Chưa phê duyệt', badge: true }),
    refVehicle({ required: true }), refDriver({ required: true }),
    f('assistant_id', 'Tài phụ', 'ref', { ref: 'driver', list: false }),
    f('order_ids', 'Danh sách đơn hàng', 'refs', { ref: 'order', show: 'order_no' }),
    f('from_location', 'Điểm đầu', 'ref', { ref: 'location' }), f('to_location', 'Điểm cuối', 'ref', { ref: 'location' }),
    f('pickup_date', 'Ngày nhận hàng', 'date', { def: 'today' }), f('drop_date', 'Ngày trả hàng', 'date'),
    f('actual_start', 'Bắt đầu thực tế', 'datetime', { list: false }), f('actual_end', 'Kết thúc thực tế', 'datetime', { list: false }),
    f('km_start', 'Km đầu', 'num', { list: false }), f('km_end', 'Km cuối', 'num', { list: false }),
    f('km_actual', 'Số km thực tế', 'num', { readonly: true, calc: r => Math.max(0, U.num(r.km_end) - U.num(r.km_start)) || U.num(r.km_actual) }),
    f('km_quota', 'Số km theo định mức', 'num'),
    f('advance', 'Tiền tạm ứng chuyến', 'money', { sum: true }),
    f('total_cost', 'Tổng CP', 'money', { sum: true, readonly: true, virtual: r => Store.all('cost_request').filter(c => c.route_id === r.id && ['Đã duyệt', 'Đã chi'].includes(c.status)).reduce((s, c) => s + U.num(c.amount), 0) + Store.all('route_fuel').filter(c => c.route_id === r.id).reduce((s, c) => s + U.num(c.total), 0) }),
    f('note', 'Ghi chú', 'textarea', { list: false })
  ], { rowActions: ['approveRoute'] });

  def('shipping_order', 'Lệnh vận chuyển', 'Vận hành', [
    f('code', 'Số lệnh', 'code', { prefix: 'LVC' }), f('route_id', 'Chuyến xe', 'ref', { ref: 'route', show: 'code' }), refVehicle(), refDriver(),
    f('date', 'Ngày lệnh', 'date', { def: 'today' }), f('content', 'Nội dung', 'textarea'),
    f('status', 'Trạng thái', 'select', { options: ['Mới', 'Đã giao tài xế', 'Hoàn thành'], def: 'Mới', badge: true })
  ]);
  def('road', 'Tuyến đường', 'Vận hành', [
    f('code', 'Mã tuyến', 'code', { prefix: 'TD' }), f('name', 'Tên tuyến', 'text', { required: true }),
    f('from_location', 'Điểm đầu', 'ref', { ref: 'location' }), f('to_location', 'Điểm cuối', 'ref', { ref: 'location' }),
    f('distance', 'Khoảng cách (km)', 'num'), f('road_type', 'Loại tuyến', 'select', { options: ['Nội thành', 'Liên tỉnh', 'Bắc - Nam', 'Cửa khẩu'] }),
    f('hours', 'Thời gian dự kiến (giờ)', 'num')
  ]);
  def('road_schedule', 'Lịch trình tuyến', 'Vận hành', [
    f('road_id', 'Tuyến', 'ref', { ref: 'road', required: true }), refVehicle(), refDriver(),
    f('weekday', 'Ngày chạy', 'select', { options: ['Hằng ngày', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'] }),
    f('depart', 'Giờ xuất phát'), f('note', 'Ghi chú')
  ]);
  def('route_fuel', 'Quản lý nhiên liệu', 'Vận hành', [
    f('code', 'Mã hệ thống', 'code', { prefix: 'NL' }),
    f('pay_type', 'Loại TT', 'select', { options: ['Công ty thanh toán', 'Tự thanh toán'], def: 'Công ty thanh toán' }),
    f('pay_status', 'TT thanh toán', 'select', { options: ['Chưa thanh toán', 'Đã thanh toán', 'Thanh toán chưa đủ'], def: 'Chưa thanh toán', badge: true }),
    f('date', 'Ngày đổ nhiên liệu', 'date', { def: 'today' }),
    f('fuel_type', 'Loại nhiên liệu', 'select', { options: fuelTypes, def: fuelTypes[0] }),
    f('liters', 'Số lượng (lít)', 'num', { required: true }), f('price', 'Đơn giá', 'money', { required: true }),
    f('total', 'Tổng tiền', 'money', { sum: true, readonly: true, calc: r => Math.round(U.num(r.liters) * U.num(r.price)) }),
    f('route_id', 'Mã chuyến', 'ref', { ref: 'route', show: 'code' }), refVehicle({ required: true }), refDriver(),
    f('km_old', 'KM cũ', 'num'), f('km_now', 'KM hiện tại', 'num'),
    f('station', 'Cây xăng', 'text', { list: false }), f('invoice_no', 'Số hoá đơn', 'text', { list: false }),
    f('image', 'Ảnh hoá đơn', 'image', { list: false }),
    f('source', 'Nguồn tạo', 'select', { options: ['Web', 'App'], def: 'Web' })
  ]);

  /* ===== TÀI CHÍNH ===== */
  def('revenue', 'Nhập doanh thu', 'Tài chính', [
    f('code', 'Mã phiếu', 'code', { prefix: 'DT' }), f('date', 'Ngày', 'date', { def: 'today', required: true }),
    f('type', 'Loại doanh thu', 'select', { options: ['Cước vận chuyển', 'Phụ phí', 'Bốc xếp', 'Lưu ca / lưu đêm', 'Doanh thu khác'], def: 'Cước vận chuyển' }),
    refVehicle({ required: true }), refDriver(), refCustomer(),
    f('order_id', 'Đơn hàng', 'ref', { ref: 'order', show: 'order_no', list: false }),
    f('route_id', 'Chuyến xe', 'ref', { ref: 'route', show: 'code' }),
    f('amount', 'Số tiền (trước VAT)', 'money', { required: true, sum: true }),
    f('vat', 'VAT', 'select', { options: VAT, def: '8%' }),
    f('total', 'Tổng sau VAT', 'money', { sum: true, readonly: true, calc: r => U.num(r.amount) + Math.round(U.num(r.amount) * vatRate(r.vat)) }),
    f('collect', 'Hình thức thu', 'select', { options: ['Công nợ', 'Tài xế thu tiền mặt', 'Chuyển khoản'], def: 'Công nợ' }),
    f('status', 'Trạng thái', 'select', { options: ['Chờ xác nhận', 'Đã xác nhận', 'Từ chối'], def: 'Đã xác nhận', badge: true }),
    f('source', 'Nguồn', 'select', { options: ['Web', 'App'], def: 'Web' }),
    f('image', 'Chứng từ', 'image', { list: false }), f('note', 'Ghi chú', 'textarea', { list: false })
  ], { rowActions: ['confirmRevenue'], note: 'Chỉ doanh thu "Đã xác nhận" được tính vào báo cáo. Doanh thu do tài xế nhập trên App ở trạng thái "Chờ xác nhận".' });

  def('cost_request', 'Đề nghị chi phí', 'Tài chính', [
    f('code', 'Mã đề nghị', 'code', { prefix: 'DN' }), f('date', 'Ngày phát sinh', 'date', { def: 'today', required: true }),
    refVehicle({ required: true }), refDriver(), f('route_id', 'Chuyến xe', 'ref', { ref: 'route', show: 'code' }),
    refCat(), f('amount', 'Số tiền', 'money', { required: true, sum: true }),
    f('pay_method', 'Hình thức', 'select', { options: ['Tài xế ứng trước', 'Đề nghị tạm ứng', 'Công ty chi trực tiếp'], def: 'Tài xế ứng trước' }),
    f('description', 'Nội dung', 'textarea', { required: true }),
    f('image', 'Ảnh chứng từ', 'image'),
    f('status', 'Trạng thái', 'select', { options: ['Chờ duyệt', 'Đã duyệt', 'Từ chối', 'Đã chi'], def: 'Chờ duyệt', badge: true }),
    f('approver', 'Người duyệt', 'text', { readonly: true }), f('approved_at', 'Ngày duyệt', 'datetime', { readonly: true, list: false }),
    f('reject_reason', 'Lý do từ chối', 'text', { list: false }),
    f('source', 'Nguồn', 'select', { options: ['Web', 'App'], def: 'Web' })
  ], { rowActions: ['approveCost'], note: 'Đề nghị "Đã duyệt" / "Đã chi" được tính vào chi phí vận hành của xe.' });

  def('op_cost', 'Chi phí vận hành', 'Tài chính', [
    f('code', 'Mã', 'code', { prefix: 'CP' }), f('date', 'Ngày hạch toán', 'date', { def: 'today', required: true }),
    refVehicle({ required: true }), refCat(),
    f('amount', 'Số tiền', 'money', { required: true, sum: true }),
    f('period', 'Kỳ phân bổ', 'select', { options: ['Một lần', 'Tháng', 'Quý', 'Năm'], def: 'Một lần' }),
    f('supplier', 'Nhà cung cấp'), f('invoice_no', 'Số hóa đơn'), f('description', 'Diễn giải', 'textarea'),
    f('image', 'Chứng từ', 'image', { list: false })
  ], { note: 'Chi phí cố định/định kỳ theo đầu xe: khấu hao, bảo hiểm, đăng kiểm, phí đường bộ, lương, GPS, lãi vay...' });

  def('receipt_voucher', 'Phiếu thu', 'Tài chính', [
    f('code', 'Mã phiếu thu', 'code', { prefix: 'PT' }), refCustomer({ required: true }), f('date', 'Ngày thu', 'date', { def: 'today' }),
    f('invoice_id', 'Bảng kê', 'ref', { ref: 'invoice', show: 'code' }), f('amount', 'Tổng tiền', 'money', { sum: true, required: true }),
    f('method', 'Hình thức', 'select', { options: ['Tiền mặt', 'Chuyển khoản'] }), f('note', 'Ghi chú')
  ]);
  def('payment_voucher', 'Phiếu chi', 'Tài chính', [
    f('code', 'Mã', 'code', { prefix: 'PC' }), f('contractor_id', 'Nhà thầu', 'ref', { ref: 'contractor' }), refDriver(), refVehicle(),
    f('date', 'Ngày chi', 'date', { def: 'today' }), f('amount', 'Tổng tiền', 'money', { sum: true, required: true }),
    f('method', 'Hình thức', 'select', { options: ['Tiền mặt', 'Chuyển khoản'] }), f('note', 'Ghi chú')
  ]);

  /* ===== TÀI XẾ ===== */
  def('driver', 'Tài xế', 'Tài xế', [
    f('code', 'Mã tài xế', 'code', { prefix: 'TX' }), f('name', 'Họ tên', 'text', { required: true }),
    f('phone', 'Số điện thoại', 'text', { required: true }), f('pin', 'Mã PIN đăng nhập App', 'text', { def: '1234', list: false }),
    f('vehicle_id', 'Xe phụ trách', 'ref', { ref: 'vehicle', show: 'plate' }),
    f('team_id', 'Đội tài xế', 'ref', { ref: 'vehicle_team', list: false }),
    f('external', 'Là tài xế ngoài', 'select', { options: YN, def: 'Không' }),
    f('license_class', 'Bằng lái', 'select', { options: ['B2', 'C', 'D', 'E', 'FC', 'FE'] }), f('license_no', 'Giấy phép lái xe'),
    f('license_exp', 'Hạn GPLX', 'date'), f('id_no', 'Số CCCD'), f('birthday', 'Ngày sinh', 'date', { list: false }),
    f('base_salary', 'Lương cơ bản', 'money', { list: false }),
    f('active', 'Kích hoạt', 'select', { options: YN, def: 'Có' })
  ]);
  def('vehicle_team', 'Đội tài xế', 'Tài xế', [f('name', 'Tên đội', 'text', { required: true }), f('leader_id', 'Đội trưởng', 'ref', { ref: 'driver' }), f('note', 'Ghi chú')]);
  def('advance_salary', 'Lương tạm ứng', 'Tài xế', [
    f('code', 'Mã', 'code', { prefix: 'TU' }), refDriver({ required: true }), f('month', 'Tháng', 'select', { options: [...Array(12)].map((_, i) => String(i + 1)) }),
    f('year', 'Năm', 'num', { def: new Date().getFullYear() }), f('amount', 'Tổng tiền', 'money', { sum: true }), f('content', 'Nội dung')
  ]);
  def('time_sheet', 'Bảng chấm công', 'Tài xế', [
    refDriver({ required: true }), f('month', 'Tháng (YYYY-MM)', 'text', { def: () => U.today().slice(0, 7) }),
    f('work_days', 'Ngày công', 'num'), f('off_days', 'Ngày nghỉ', 'num'), f('trips', 'Số chuyến', 'num'), f('note', 'Ghi chú')
  ]);
  def('salary', 'Bảng lương', 'Tài xế', [
    f('code', 'Mã', 'code', { prefix: 'BL' }), refDriver({ required: true }), f('month', 'Tháng (YYYY-MM)', 'text', { def: () => U.today().slice(0, 7) }),
    f('status', 'Trạng thái', 'select', { options: ['Tạo mới', 'Gửi tài xế', 'Chờ xác nhận', 'Đã xác nhận', 'Đã duyệt', 'Đã hủy'], def: 'Tạo mới', badge: true }),
    f('base', 'Lương cơ bản', 'money'), f('trip_salary', 'Lương chuyến', 'money'), f('allowance', 'Phụ cấp', 'money'),
    f('deduct', 'Khấu trừ / tạm ứng', 'money'),
    f('total', 'Thực lĩnh', 'money', { sum: true, readonly: true, calc: r => U.num(r.base) + U.num(r.trip_salary) + U.num(r.allowance) - U.num(r.deduct) })
  ]);
  def('contract_salary', 'Lương khoán', 'Tài xế', [f('road_id', 'Tuyến', 'ref', { ref: 'road' }), f('vehicle_group', 'Chủng loại xe', 'ref', { ref: 'vehicle_group' }), f('amount', 'Lương khoán / chuyến', 'money'), f('note', 'Ghi chú')]);
  def('incident', 'Sự cố', 'Tài xế', [
    f('code', 'Mã', 'code', { prefix: 'SC' }), f('kind', 'Loại', 'select', { options: ['Tai nạn giao thông', 'Hỏng xe dọc đường', 'Hư hỏng hàng hóa', 'Vi phạm kỷ luật', 'Bị phạt / CSGT giữ'] }),
    f('status', 'Trạng thái', 'select', { options: ['Chưa xử lý', 'Đang xử lý', 'Đã xử lý', 'Đã chuyển hồ sơ cho bảo hiểm'], def: 'Chưa xử lý', badge: true }),
    f('target', 'Loại sự cố', 'select', { options: ['Phương tiện', 'Hàng hóa', 'Con người'] }),
    refDriver(), refVehicle(), f('date', 'Ngày xảy ra', 'datetime', { def: 'now' }), f('place', 'Nơi xảy ra'),
    f('insurance', 'Bảo hiểm chi trả', 'select', { options: YN, def: 'Không' }), f('damage', 'Tổng thiệt hại', 'money', { sum: true }),
    f('description', 'Mô tả', 'textarea', { list: false }), f('image', 'Hình ảnh', 'image', { list: false }), f('source', 'Nguồn', 'select', { options: ['Web', 'App'], def: 'Web' })
  ]);

  /* ===== XE ===== */
  def('vehicle', 'Xe', 'Xe', [
    f('plate', 'Biển số', 'text', { required: true }), f('group_id', 'Chủng loại xe', 'ref', { ref: 'vehicle_group' }),
    f('driver_id', 'Tài xế chính', 'ref', { ref: 'driver' }),
    f('state', 'Trạng thái', 'select', { options: ['Xe trống', 'Xe đang vận chuyển', 'Xe hỏng', 'Xe công an giữ'], def: 'Xe trống', badge: true }),
    f('subcontract', 'Là xe thầu phụ', 'select', { options: YN, def: 'Không' }), f('contractor_id', 'Nhà thầu', 'ref', { ref: 'contractor' }),
    f('trailer_id', 'Rơ mooc', 'ref', { ref: 'trailer', show: 'plate' }),
    f('payload', 'Tải trọng (kg)', 'num'), f('year', 'Năm sản xuất', 'num', { list: false }),
    f('odometer', 'Số km hiện tại', 'num'), f('fuel_norm', 'Định mức dầu (lít/100km)', 'num', { list: false }),
    f('inspection_exp', 'Hạn đăng kiểm', 'date'), f('insurance_exp', 'Hạn bảo hiểm', 'date'), f('road_fee_exp', 'Hạn phí đường bộ', 'date', { list: false }),
    f('price', 'Nguyên giá', 'money', { list: false }),
    f('active', 'Tình trạng', 'select', { options: ['Hoạt động', 'Không hoạt động'], def: 'Hoạt động' })
  ], { rowActions: ['vehiclePL'] });
  def('vehicle_group', 'Chủng loại xe', 'Xe', [f('name', 'Tên chủng loại', 'text', { required: true }), f('payload', 'Tải trọng (kg)', 'num'), f('note', 'Ghi chú')]);
  def('contractor', 'Nhà thầu', 'Xe', [f('code', 'Mã', 'code', { prefix: 'NT' }), f('name', 'Tên nhà thầu', 'text', { required: true }), f('phone', 'Điện thoại'), f('tax_code', 'MST'), f('address', 'Địa chỉ')]);
  def('trailer', 'Rơ moóc', 'Xe', [f('plate', 'Biển số', 'text', { required: true }), f('type', 'Loại', 'select', { options: ['Sàn', 'Xương', 'Ben', 'Lồng'] }), f('inspection_exp', 'Hạn đăng kiểm', 'date'), f('note', 'Ghi chú')]);
  def('container', 'Container', 'Xe', [f('code', 'Số container', 'text', { required: true }), f('size', 'Loại', 'select', { options: ["20'DC", "40'DC", "40'HC", "45'HC", "20'RF", "40'RF"] }), f('shipping_line', 'Hãng tàu'), f('note', 'Ghi chú')]);
  def('repair_ticket', 'Phiếu sửa chữa', 'Xe', [
    f('code', 'Mã phiếu', 'code', { prefix: 'SC' }), f('name', 'Tên phiếu', 'text', { required: true }), refDriver(), refVehicle({ required: true }),
    f('start_date', 'Ngày bắt đầu sửa chữa', 'date', { def: 'today' }), f('end_date', 'Ngày kết thúc', 'date'),
    f('description', 'Mô tả', 'textarea'), f('total', 'Tổng tiền', 'money', { sum: true }), f('km', 'Số km hiện tại', 'num'),
    f('garage', 'Nơi sửa chữa'), f('approved', 'Đã phê duyệt', 'select', { options: YN, def: 'Không', badge: true })
  ]);
  def('accessory', 'Phụ tùng', 'Xe', [f('code', 'Mã', 'code', { prefix: 'PT' }), f('name', 'Tên phụ tùng', 'text', { required: true }), f('unit', 'Đơn vị'), f('stock', 'Tồn kho', 'num'), f('price', 'Đơn giá', 'money')]);
  def('vehicle_tire', 'Lốp xe', 'Xe', [f('serial', 'Số seri', 'text', { required: true }), refVehicle(), f('position', 'Vị trí lắp'), f('install_date', 'Ngày lắp', 'date'), f('install_km', 'Km lắp', 'num'), f('brand', 'Hãng'), f('status', 'Trạng thái', 'select', { options: ['Đang sử dụng', 'Trong kho', 'Đã thanh lý'] })]);
  def('assets', 'Tài sản', 'Xe', [f('name', 'Tên tài sản', 'text', { required: true }), refVehicle(), f('value', 'Giá trị', 'money'), f('date', 'Ngày cấp', 'date'), f('note', 'Ghi chú')]);

  /* ===== KHÁCH HÀNG ===== */
  def('customer', 'Khách hàng', 'Khách hàng', [
    f('code', 'Mã khách hàng', 'code', { prefix: 'KH' }), f('name', 'Tên khách hàng', 'text', { required: true }),
    f('group_id', 'Nhóm khách hàng', 'ref', { ref: 'customer_group' }), f('phone', 'Số điện thoại'),
    f('type', 'Loại khách hàng', 'select', { options: ['Khách hàng doanh nghiệp', 'Khách hàng cá nhân'], def: 'Khách hàng doanh nghiệp' }),
    f('tax_code', 'MST'), f('address', 'Địa chỉ', 'text', { list: false }), f('debt_days', 'Hạn công nợ (ngày)', 'num', { list: false })
  ]);
  def('project', 'Dự án', 'Khách hàng', [f('name', 'Tên dự án', 'text', { required: true }), refCustomer(), f('from', 'Từ ngày', 'date'), f('to', 'Đến ngày', 'date'), f('note', 'Ghi chú')]);
  def('contract', 'Hợp đồng', 'Khách hàng', [f('code', 'Số hợp đồng', 'text', { required: true }), refCustomer(), f('type', 'Loại hợp đồng', 'select', { options: ['Hợp đồng nguyên tắc', 'Hợp đồng chuyến', 'Hợp đồng thuê xe'] }), f('sign_date', 'Ngày ký', 'date'), f('exp_date', 'Ngày hết hạn', 'date'), f('value', 'Giá trị', 'money'), f('file', 'File scan', 'image', { list: false })]);
  def('contact', 'Danh bạ', 'Khách hàng', [f('name', 'Họ tên', 'text', { required: true }), refCustomer(), f('position', 'Chức vụ'), f('phone', 'Điện thoại'), f('email', 'Email')]);
  def('customer_group', 'Nhóm khách hàng', 'Khách hàng', [f('name', 'Tên nhóm', 'text', { required: true }), f('note', 'Ghi chú')]);

  /* ===== ĐỊNH MỨC ===== */
  def('price_quote', 'Báo giá', 'Định mức', [f('code', 'Mã báo giá', 'code', { prefix: 'BG' }), refCustomer(), f('road_id', 'Tuyến', 'ref', { ref: 'road' }), f('vehicle_group', 'Chủng loại xe', 'ref', { ref: 'vehicle_group' }), f('price', 'Đơn giá cước', 'money'), f('from', 'Hiệu lực từ', 'date'), f('to', 'Đến', 'date')]);
  def('quota', 'Định mức chi phí', 'Định mức', [
    f('code', 'Mã định mức', 'code', { prefix: 'DM' }), f('name', 'Tên', 'text', { required: true }),
    f('type', 'Loại định mức', 'select', { options: ['Định mức xe nhà', 'Định mức xe thầu phụ'] }),
    f('road_id', 'Tuyến', 'ref', { ref: 'road' }), f('vehicle_group', 'Chủng loại xe', 'ref', { ref: 'vehicle_group' }),
    refCat({ required: false }), f('amount', 'Tổng chi phí (VND)', 'money'), f('distance', 'Khoảng cách (km)', 'num')
  ]);
  def('fuel_quota', 'Định mức dầu', 'Định mức', [f('vehicle_group', 'Chủng loại xe', 'ref', { ref: 'vehicle_group', required: true }), f('loaded', 'Có hàng (lít/100km)', 'num'), f('empty', 'Không hàng (lít/100km)', 'num'), f('note', 'Ghi chú')]);
  def('payroll', 'Định mức lương tài xế', 'Định mức', [f('road_id', 'Tuyến', 'ref', { ref: 'road' }), f('vehicle_group', 'Chủng loại xe', 'ref', { ref: 'vehicle_group' }), f('amount', 'Lương / chuyến', 'money')]);
  def('route_tolls', 'Chi phí qua trạm', 'Định mức', [f('name', 'Tên trạm', 'text', { required: true }), f('road_id', 'Tuyến', 'ref', { ref: 'road' }), f('vehicle_group', 'Chủng loại xe', 'ref', { ref: 'vehicle_group' }), f('price', 'Giá vé', 'money')]);

  /* ===== DANH MỤC ===== */
  def('location', 'Địa điểm', 'Danh mục', [f('code', 'Mã', 'code', { prefix: 'DD' }), f('name', 'Tên địa điểm', 'text', { required: true }), f('type', 'Loại địa điểm', 'select', { options: ['Kho', 'Cảng', 'Nhà máy', 'Cửa khẩu', 'Bãi xe', 'Khác'] }), f('province', 'Tỉnh/TP'), f('address', 'Địa chỉ')]);
  def('goods_type', 'Hàng hóa', 'Danh mục', [f('name', 'Tên hàng hóa', 'text', { required: true }), f('unit', 'Đơn vị', 'select', { options: ['Tấn', 'Kg', 'Khối', 'Kiện', 'Pallet', 'Container'] }), f('note', 'Ghi chú')]);
  def('cost_category', 'Thu chi (khoản mục)', 'Danh mục', [
    f('name', 'Tên khoản mục', 'text', { required: true }),
    f('group', 'Nhóm chi phí', 'select', { options: ['Chi phí biến đổi (theo chuyến)', 'Chi phí cố định (theo xe)', 'Chi phí khác'], def: 'Chi phí biến đổi (theo chuyến)' }),
    f('driver_app', 'Hiện trên App tài xế', 'select', { options: YN, def: 'Có' }), f('note', 'Ghi chú')
  ]);
  def('transportation_type', 'Loại hình vận tải', 'Danh mục', [f('name', 'Tên', 'text', { required: true }), f('note', 'Ghi chú')]);
  def('department', 'Cơ cấu tổ chức', 'Danh mục', [f('name', 'Phòng ban', 'text', { required: true }), f('manager', 'Trưởng phòng'), f('note', 'Ghi chú')]);

  /* ===== HỆ THỐNG ===== */
  def('admin', 'Người dùng', 'Hệ thống', [
    f('username', 'Tên đăng nhập', 'text', { required: true }), f('name', 'Họ tên', 'text', { required: true }), f('email', 'Email'),
    f('password', 'Mật khẩu', 'password', { list: false }), f('role_id', 'Quyền', 'ref', { ref: 'role' }),
    f('department_id', 'Cơ cấu tổ chức', 'ref', { ref: 'department' }), f('active', 'Trạng thái kích hoạt', 'select', { options: YN, def: 'Có' })
  ]);
  def('role', 'Vai trò', 'Hệ thống', [f('name', 'Tên vai trò', 'text', { required: true }), f('approve_cost', 'Được duyệt chi phí', 'select', { options: YN, def: 'Không' }), f('note', 'Mô tả')]);
  def('activity_log', 'Nhật ký', 'Hệ thống', [f('time', 'Thời gian', 'datetime'), f('user', 'Người dùng'), f('action', 'Hành động'), f('module', 'Module'), f('record', 'Bản ghi')], { readonlyModule: true });

  /* ===== MENU (theo sidebar CETA) ===== */
  const MENU = [
    { id: 'dashboard', title: 'Tổng quan', icon: 'home', page: 'dashboard' },
    { title: 'Đơn hàng', icon: 'doc', items: ['order', 'order_customer', 'invoice', 'document'] },
    { title: 'Vận hành', icon: 'truck', items: ['route', 'shipping_order', 'road', 'road_schedule', 'route_fuel', { id: 'board', title: 'Bảng điều vận', page: 'board' }] },
    { title: 'Doanh thu & Chi phí', icon: 'money', items: ['revenue', 'cost_request', 'op_cost', 'receipt_voucher', 'payment_voucher'] },
    { title: 'Báo cáo', icon: 'chart', items: [{ id: 'rpt_vehicle', title: 'Lãi lỗ theo đầu xe', page: 'rptVehicle' }, { id: 'rpt_month', title: 'Doanh thu - chi phí theo tháng', page: 'rptMonth' }, { id: 'rpt_cat', title: 'Chi phí theo khoản mục', page: 'rptCat' }, { id: 'rpt_expiry', title: 'Cảnh báo hạn giấy tờ', page: 'rptExpiry' }] },
    { title: 'Tài xế', icon: 'user', items: ['driver', 'vehicle_team', 'advance_salary', 'time_sheet', 'salary', 'contract_salary', 'incident'] },
    { title: 'Xe', icon: 'car', items: ['vehicle', 'vehicle_group', 'contractor', 'trailer', 'container', 'repair_ticket', 'accessory', 'vehicle_tire', 'assets'] },
    { title: 'Khách hàng', icon: 'id', items: ['customer', 'project', 'contract', 'contact', 'customer_group'] },
    { title: 'Định mức', icon: 'cash', items: ['price_quote', 'quota', 'fuel_quota', 'payroll', 'route_tolls'] },
    { title: 'Danh mục', icon: 'list', items: ['location', 'goods_type', 'cost_category', 'transportation_type', 'department'] },
    { title: 'Quản trị', icon: 'users', items: ['admin', 'role', 'activity_log'] },
    { title: 'Thiết lập', icon: 'gear', items: [{ id: 'settings', title: 'Thiết lập công ty', page: 'settings' }, { id: 'backup', title: 'Sao lưu / Khôi phục', page: 'backup' }] }
  ];

  /* ===== DỮ LIỆU MẪU ===== */
  function seed() {
    const U = global.U; const db = { __v: 1, __seq: {} };
    const now = U.now(); let n = 0;
    const id = () => 's' + (++n).toString(36);
    const put = (col, recs) => { db[col] = recs.map(r => Object.assign({ id: id(), created_at: now, created_by: 'Hệ thống', updated_at: '', updated_by: '' }, r)); db.__seq[col] = db[col].length; return db[col]; };
    const code = (p, i) => p + U.pad(i + 1);

    const roles = put('role', [{ name: 'Quản trị viên', approve_cost: 'Có' }, { name: 'Kế toán', approve_cost: 'Có' }, { name: 'Điều vận', approve_cost: 'Không' }]);
    put('department', [{ name: 'Ban giám đốc' }, { name: 'Phòng điều vận' }, { name: 'Phòng kế toán' }]);
    put('admin', [
      { username: 'admin', name: 'Quản trị hệ thống', email: '', password: 'admin123', role_id: roles[0].id, active: 'Có' },
      { username: 'ketoan', name: 'Kế toán', email: '', password: 'ketoan123', role_id: roles[1].id, active: 'Có' },
      { username: 'dieuvan', name: 'Điều vận', email: '', password: 'dieuvan123', role_id: roles[2].id, active: 'Có' }
    ]);
    const groups = put('vehicle_group', [{ name: 'Đầu kéo container', payload: 30000 }, { name: 'Tải 15 tấn', payload: 15000 }, { name: 'Tải 8 tấn', payload: 8000 }, { name: 'Tải 3.5 tấn', payload: 3500 }]);
    put('customer_group', [{ name: 'Khách hàng chiến lược' }, { name: 'Khách hàng thường' }]);
    const custs = put('customer', ['Công ty CP Thép Hòa Phát (mẫu)', 'Công ty TNHH Điện tử ABC (mẫu)', 'Công ty CP Thực phẩm XYZ (mẫu)', 'Công ty TNHH Logistics Đông Á (mẫu)'].map((name, i) => ({ code: code('KH', i), name, group_id: db.customer_group[i % 2].id, phone: '09' + (12345670 + i), type: 'Khách hàng doanh nghiệp', debt_days: 30 })));
    db.__seq.customer = custs.length;
    const locs = put('location', [['Cảng Hải Phòng', 'Cảng', 'Hải Phòng'], ['KCN Thăng Long', 'Nhà máy', 'Hà Nội'], ['Cảng Cát Lái', 'Cảng', 'TP.HCM'], ['KCN VSIP Bắc Ninh', 'Nhà máy', 'Bắc Ninh'], ['Cửa khẩu Hữu Nghị', 'Cửa khẩu', 'Lạng Sơn'], ['Kho Đà Nẵng', 'Kho', 'Đà Nẵng']].map((l, i) => ({ code: code('DD', i), name: l[0], type: l[1], province: l[2] })));
    put('goods_type', [{ name: 'Thép cuộn', unit: 'Tấn' }, { name: 'Linh kiện điện tử', unit: 'Kiện' }, { name: 'Hàng tiêu dùng', unit: 'Pallet' }, { name: 'Container hàng', unit: 'Container' }]);
    const cats = put('cost_category', [
      ['Nhiên liệu', 'Chi phí biến đổi (theo chuyến)', 'Có'], ['Phí cầu đường / BOT', 'Chi phí biến đổi (theo chuyến)', 'Có'], ['Bốc xếp', 'Chi phí biến đổi (theo chuyến)', 'Có'],
      ['Ăn ở, công tác phí', 'Chi phí biến đổi (theo chuyến)', 'Có'], ['Vé bến bãi, gửi xe', 'Chi phí biến đổi (theo chuyến)', 'Có'], ['Sửa chữa nhỏ dọc đường', 'Chi phí biến đổi (theo chuyến)', 'Có'],
      ['Rửa xe, vá lốp', 'Chi phí biến đổi (theo chuyến)', 'Có'], ['Chi phí khác', 'Chi phí khác', 'Có'],
      ['Lương tài xế', 'Chi phí cố định (theo xe)', 'Không'], ['Khấu hao xe', 'Chi phí cố định (theo xe)', 'Không'], ['Bảo hiểm xe', 'Chi phí cố định (theo xe)', 'Không'],
      ['Đăng kiểm', 'Chi phí cố định (theo xe)', 'Không'], ['Phí bảo trì đường bộ', 'Chi phí cố định (theo xe)', 'Không'], ['Lãi vay mua xe', 'Chi phí cố định (theo xe)', 'Không'], ['Phí GPS / camera', 'Chi phí cố định (theo xe)', 'Không']
    ].map(c => ({ name: c[0], group: c[1], driver_app: c[2] })));
    const C = name => cats.find(c => c.name === name).id;

    const plates = ['15C-123.45', '29H-678.90', '51D-246.80', '29C-135.79', '15H-864.20'];
    const vehs = put('vehicle', plates.map((p, i) => ({ plate: p, group_id: groups[i % 3].id, state: i === 3 ? 'Xe hỏng' : 'Xe trống', subcontract: 'Không', payload: groups[i % 3].payload, year: 2019 + i, odometer: 150000 + i * 23000, fuel_norm: [38, 28, 22][i % 3], inspection_exp: ['2026-12-10', '2027-03-01', '2026-12-28', '2027-06-15', '2027-01-20'][i], insurance_exp: ['2027-02-01', '2026-12-05', '2027-05-01', '2027-04-11', '2027-08-30'][i], price: [1450, 980, 750, 1450, 980][i] * 1e6, active: 'Hoạt động' })));
    const names = ['Nguyễn Văn An', 'Trần Văn Bình', 'Lê Văn Cường', 'Phạm Văn Dũng', 'Hoàng Văn Em'];
    const drvs = put('driver', names.map((name, i) => ({ code: code('TX', i), name, phone: '098' + (7654320 + i), pin: '1234', vehicle_id: vehs[i].id, external: 'Không', license_class: i % 3 === 0 ? 'FC' : 'C', license_no: '0102' + (34567 + i), license_exp: ['2027-05-01', '2026-12-20', '2028-01-01', '2029-03-03', '2027-10-10'][i], id_no: '0012030' + (45678 + i), base_salary: 9000000, active: 'Có' })));
    vehs.forEach((v, i) => { v.driver_id = drvs[i].id; });
    put('contractor', [{ code: 'NT0001', name: 'Nhà xe Minh Phát (mẫu)', phone: '0912000111' }]);
    put('road', [[0, 1, 110, 'Liên tỉnh'], [0, 3, 95, 'Liên tỉnh'], [1, 4, 170, 'Cửa khẩu'], [2, 5, 950, 'Bắc - Nam']].map((r, i) => ({ code: code('TD', i), name: locs[r[0]].name + ' - ' + locs[r[1]].name, from_location: locs[r[0]].id, to_location: locs[r[1]].id, distance: r[2], road_type: r[3], hours: Math.round(r[2] / 45) })));
    put('fuel_quota', groups.slice(0, 3).map((g, i) => ({ vehicle_group: g.id, loaded: [38, 28, 22][i], empty: [30, 22, 18][i] })));

    // Phát sinh 6 tháng dữ liệu
    const orders = [], routes = [], revs = [], reqs = [], fuels = [], ops = [], repairs = [];
    let rnd = 7; const R = () => (rnd = (rnd * 9301 + 49297) % 233280) / 233280;
    const thisMonth = U.today().slice(0, 7);
    for (let m = -5; m <= 0; m++) {
      const ym = U.addMonths(thisMonth, m);
      vehs.forEach((v, vi) => {
        const trips = 4 + Math.floor(R() * 4);
        for (let t = 0; t < trips; t++) {
          const day = Math.min(28, 2 + t * 4 + Math.floor(R() * 3));
          if (m === 0 && day > Number(U.today().slice(8, 10))) continue;
          const d = ym + '-' + String(day).padStart(2, '0');
          const road = db.road[(vi + t) % db.road.length];
          const freight = Math.round((road.distance * (vi % 3 === 0 ? 42000 : 30000) + 1500000) / 1e5) * 1e5;
          const cust = custs[(vi + t) % custs.length];
          const done = !(m === 0 && t === trips - 1);
          const o = { id: id(), code: code('DH', orders.length), status: done ? 'Hoàn thành' : 'Đang vận chuyển', order_no: 'SO' + ym.replace('-', '') + U.pad(orders.length + 1, 3), customer_id: cust.id, vehicle_id: v.id, driver_id: drvs[vi].id, pickup_location: road.from_location, drop_location: road.to_location, pickup_date: d, drop_date: d, freight, extra_fee: 0, vat: '8%', revenue: freight, created_at: d + 'T08:00', created_by: 'Điều vận' };
          orders.push(o);
          const kmS = v.odometer - (6 - m) * 4000 + t * 400;
          const rt = { id: id(), code: code('CX', routes.length), type: 'Chuyến có hàng', status: done ? 'Hoàn thành' : 'Đang chạy', approve: done && m < 0 ? 'Đã phê duyệt' : 'Chưa phê duyệt', vehicle_id: v.id, driver_id: drvs[vi].id, order_ids: [o.id], from_location: road.from_location, to_location: road.to_location, pickup_date: d, drop_date: d, km_start: kmS, km_end: done ? kmS + road.distance * 2 : '', km_actual: done ? road.distance * 2 : 0, km_quota: road.distance * 2, advance: 2000000, created_at: d + 'T07:00', created_by: 'Điều vận' };
          routes.push(rt);
          if (done) revs.push({ id: id(), code: code('DT', revs.length), date: d, type: 'Cước vận chuyển', vehicle_id: v.id, driver_id: drvs[vi].id, customer_id: cust.id, order_id: o.id, route_id: rt.id, amount: freight, vat: '8%', total: Math.round(freight * 1.08), collect: 'Công nợ', status: 'Đã xác nhận', source: 'Web', created_at: d + 'T18:00', created_by: 'Kế toán' });
          const liters = Math.round(road.distance * 2 * (v.fuel_norm || 28) / 100);
          fuels.push({ id: id(), code: code('NL', fuels.length), pay_type: 'Công ty thanh toán', pay_status: 'Đã thanh toán', date: d, fuel_type: fuelTypes[0], liters, price: 19800 + Math.round(R() * 8) * 100, route_id: rt.id, vehicle_id: v.id, driver_id: drvs[vi].id, km_old: kmS, km_now: kmS + 5, source: 'App', created_at: d + 'T06:30', created_by: drvs[vi].name });
          fuels[fuels.length - 1].total = Math.round(liters * fuels[fuels.length - 1].price);
          [['Phí cầu đường / BOT', 80000 + road.distance * 1500], ['Ăn ở, công tác phí', 250000], ['Bốc xếp', R() > 0.5 ? 400000 : 0], ['Vé bến bãi, gửi xe', R() > 0.6 ? 100000 : 0]].forEach(([cn, amt]) => {
            if (!amt) return;
            const pending = m === 0 && R() > 0.6;
            reqs.push({ id: id(), code: code('DN', reqs.length), date: d, vehicle_id: v.id, driver_id: drvs[vi].id, route_id: rt.id, category_id: C(cn), amount: Math.round(amt / 1000) * 1000, pay_method: 'Tài xế ứng trước', description: cn + ' chuyến ' + rt.code, status: pending ? 'Chờ duyệt' : (m < -1 ? 'Đã chi' : 'Đã duyệt'), approver: pending ? '' : 'Kế toán', approved_at: pending ? '' : d + 'T20:00', source: 'App', created_at: d + 'T19:00', created_by: drvs[vi].name });
          });
        }
        const first = ym + '-01';
        [['Lương tài xế', 12000000], ['Khấu hao xe', Math.round(v.price / 96 / 1e3) * 1e3], ['Bảo hiểm xe', 1500000], ['Phí bảo trì đường bộ', 1100000], ['Phí GPS / camera', 250000]].forEach(([cn, amt]) =>
          ops.push({ id: id(), code: code('CP', ops.length), date: first, vehicle_id: v.id, category_id: C(cn), amount: amt, period: 'Tháng', description: cn + ' tháng ' + ym, created_at: first + 'T09:00', created_by: 'Kế toán' }));
        if (R() > 0.55) repairs.push({ id: id(), code: code('SC', repairs.length), name: 'Bảo dưỡng định kỳ ' + v.plate, driver_id: drvs[vi].id, vehicle_id: v.id, start_date: ym + '-15', end_date: ym + '-15', description: 'Thay dầu máy, lọc dầu, kiểm tra phanh', total: 3500000 + Math.round(R() * 30) * 100000, km: v.odometer, garage: 'Garage Thành Công', approved: 'Có', created_at: ym + '-15T10:00', created_by: 'Điều vận' });
      });
    }
    // Mỗi xe có 1 chuyến được giao hôm nay (chưa bắt đầu) để thử App tài xế
    vehs.forEach((v, vi) => {
      if (v.state === 'Xe hỏng') return;
      const road = db.road[vi % db.road.length]; const cust = custs[vi % custs.length]; const d = U.today();
      const o = { id: id(), code: code('DH', orders.length), status: 'Chờ nhận hàng', order_no: 'SO' + d.replace(/-/g, '').slice(0, 6) + U.pad(orders.length + 1, 3), customer_id: cust.id, vehicle_id: v.id, driver_id: drvs[vi].id, pickup_location: road.from_location, drop_location: road.to_location, pickup_date: d, drop_date: d, freight: 5000000, extra_fee: 0, vat: '8%', revenue: 5000000, created_at: now, created_by: 'Điều vận' };
      orders.push(o);
      routes.push({ id: id(), code: code('CX', routes.length), type: 'Chuyến có hàng', status: 'Chưa bắt đầu', approve: 'Chưa phê duyệt', vehicle_id: v.id, driver_id: drvs[vi].id, order_ids: [o.id], from_location: road.from_location, to_location: road.to_location, pickup_date: d, drop_date: d, km_quota: road.distance * 2, advance: 2000000, created_at: now, created_by: 'Điều vận' });
    });
    // Vài doanh thu do tài xế nhập chờ xác nhận
    revs.push({ id: id(), code: code('DT', revs.length), date: U.today(), type: 'Phụ phí', vehicle_id: vehs[0].id, driver_id: drvs[0].id, customer_id: custs[0].id, amount: 500000, vat: 'Không chịu thuế', total: 500000, collect: 'Tài xế thu tiền mặt', status: 'Chờ xác nhận', source: 'App', note: 'Phí lưu ca tại cảng', created_at: now, created_by: drvs[0].name });
    const sorter = (a, b) => (b.created_at || '').localeCompare(a.created_at || '');
    [['order', orders], ['route', routes], ['revenue', revs], ['cost_request', reqs], ['route_fuel', fuels], ['op_cost', ops], ['repair_ticket', repairs]].forEach(([k, arr]) => {
      arr.forEach(r => { r.updated_at = ''; r.updated_by = ''; }); db[k] = arr.sort(sorter); db.__seq[k] = arr.length;
    });
    put('incident', [{ code: 'SC0001', kind: 'Hỏng xe dọc đường', status: 'Đã xử lý', target: 'Phương tiện', driver_id: drvs[3].id, vehicle_id: vehs[3].id, date: U.today() + 'T10:00', place: 'QL1A km 45', insurance: 'Không', damage: 2500000, description: 'Nổ lốp trục 2', source: 'App' }]);
    db.settings = { company: 'CÔNG TY TNHH TMG LOGISTICS', tax_code: '', address: '', phone: '', email: '', fuel_price: 20000 };
    db.activity_log = [];
    return db;
  }

  global.TMG_MODULES = M;
  global.TMG_MENU = MENU;
  global.TMG_SEED = seed;
  global.TMG_vatRate = vatRate;
})(window);
