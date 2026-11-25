# TMG TMS — Hệ thống quản lý xe vận tải

Ứng dụng web quản lý vận tải theo đầu xe, cấu trúc menu dựa trên hệ thống CETA/OneLog, gồm:

- **Trang quản trị** (`index.html`) cho điều vận, kế toán, ban giám đốc
- **App tài xế** (`driver.html`) chạy trên điện thoại, đăng nhập theo **biển số xe + SĐT + mã PIN**

Không cần cài đặt, không cần máy chủ: chỉ là HTML/CSS/JavaScript thuần, chạy được trên GitHub Pages.

## Chức năng

| Nhóm | Chức năng |
|---|---|
| Tổng quan | Doanh thu, chi phí, lợi nhuận tháng; biểu đồ 6 tháng; hiệu quả từng xe; việc cần xử lý; trạng thái xe |
| Đơn hàng | Đơn hàng, đơn đặt hàng, bảng kê (tạo tự động từ đơn hoàn thành), chứng từ/POD |
| Vận hành | Chuyến xe (phê duyệt chuyến, km thực tế, tổng CP), lệnh vận chuyển, tuyến đường, lịch trình tuyến, quản lý nhiên liệu, bảng điều vận kéo-thả |
| **Doanh thu & Chi phí** | **Nhập doanh thu** (xác nhận doanh thu tài xế gửi), **Đề nghị chi phí** (duyệt / từ chối / đánh dấu đã chi), **Chi phí vận hành** (khấu hao, bảo hiểm, lương, phí đường bộ… theo đầu xe), phiếu thu, phiếu chi |
| Báo cáo | Lãi lỗ theo đầu xe (chi tiết từng xe: cơ cấu chi phí, chi phí/km, lít/100km), doanh thu - chi phí theo tháng, chi phí theo khoản mục × xe, cảnh báo hạn giấy tờ |
| Tài xế | Tài xế, đội, lương tạm ứng, chấm công, bảng lương, lương khoán, sự cố |
| Xe | Xe, chủng loại, nhà thầu, rơ moóc, container, phiếu sửa chữa, phụ tùng, lốp, tài sản |
| Khách hàng | Khách hàng, dự án, hợp đồng, danh bạ, nhóm KH |
| Định mức | Báo giá, định mức chi phí, định mức dầu, định mức lương, chi phí qua trạm |
| Danh mục / Quản trị | Địa điểm, hàng hoá, khoản mục thu chi, người dùng, vai trò (quyền duyệt chi), nhật ký, thiết lập, sao lưu/khôi phục |

Mọi danh sách đều có: lọc theo từng cột (số hỗ trợ `>=`, `<`…), sắp xếp, phân trang, chọn nhiều để xoá, sửa / sao chép / xoá từng dòng, dòng tổng, xuất Excel (CSV), in.

### App tài xế
- Trang chủ: doanh thu / chi phí / số chuyến của xe trong tháng, chuyến hiện tại
- Chuyến: bắt đầu chuyến (nhập km), hoàn thành chuyến (km cuối, chụp POD) → tự cập nhật trạng thái đơn hàng và xe
- **Đề nghị chi phí** có chụp ảnh hoá đơn → chờ duyệt trên web
- Đổ nhiên liệu (tự tính thành tiền, cập nhật km xe)
- **Nhập doanh thu** (tiền mặt/chuyển khoản thu hộ) → kế toán xác nhận
- Báo sự cố, xem/ xác nhận bảng lương, đổi PIN
- Có thể "Thêm vào màn hình chính" như một app

## Cách tính lãi lỗ theo đầu xe
- **Doanh thu** = các phiếu *Nhập doanh thu* ở trạng thái *Đã xác nhận*
- **Chi phí** = Nhiên liệu + Đề nghị chi phí *Đã duyệt/Đã chi* + Phiếu sửa chữa *đã phê duyệt* + Chi phí vận hành

## Chạy thử trên máy
Mở `index.html` bằng trình duyệt, hoặc chạy máy chủ tĩnh kèm theo:

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```

rồi mở http://localhost:8080 (quản trị) và http://localhost:8080/driver.html (tài xế).

Tài khoản mẫu: `admin / admin123`, `ketoan / ketoan123`, `dieuvan / dieuvan123`. Tài xế mẫu: chọn xe `15C-123.45`, SĐT `0987654320`, PIN `1234`.
**Hãy đổi mật khẩu/PIN trước khi dùng thật.** Vào *Thiết lập → Sao lưu / Khôi phục → Xoá sạch* để bắt đầu nhập dữ liệu thật.

## Lưu ý quan trọng về dữ liệu
Phiên bản này lưu dữ liệu trong **localStorage của trình duyệt** trên từng máy. Nghĩa là:
- Trang quản trị và App tài xế chỉ thấy chung dữ liệu khi mở **trên cùng một trình duyệt/máy**.
- Để tài xế dùng điện thoại riêng và văn phòng thấy ngay, cần nối với một backend dùng chung (VD: Supabase / Firebase / máy chủ riêng). Lớp dữ liệu nằm gọn trong `js/store.js` nên có thể thay thế mà không phải sửa giao diện.
- Đăng nhập hiện chỉ kiểm tra phía trình duyệt, chưa phải bảo mật thật — không đưa dữ liệu nhạy cảm lên bản công khai.
- Sao lưu thường xuyên bằng *Thiết lập → Sao lưu*.

## Cấu trúc
```
index.html          trang quản trị
driver.html         app tài xế
css/app.css         giao diện quản trị
css/driver.css      giao diện app tài xế
js/store.js         lưu trữ dữ liệu + tính toán tài chính
js/schema.js        định nghĩa toàn bộ module, menu, dữ liệu mẫu
js/admin.js         giao diện quản trị (danh sách, form, duyệt, báo cáo)
js/driver.js        app tài xế
serve.ps1           máy chủ tĩnh để chạy thử
```
Thêm một module mới chỉ cần khai báo trường trong `js/schema.js` — danh sách, bộ lọc, form, xuất CSV được tạo tự động.
