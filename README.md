# TMG Logistics — Hệ thống quản lý xe vận tải

Ứng dụng web quản lý vận tải theo đầu xe, cấu trúc nghiệp vụ dựa trên hệ thống CETA/OneLog, gồm:

- **Trang quản trị** (`index.html`) cho điều vận, kế toán, ban giám đốc
- **App tài xế** (`driver.html`) chạy trên điện thoại, đăng nhập theo **biển số xe + SĐT + mã PIN**
- **Trang tự kiểm tra** (`tests.html`) chạy lại các luồng chính sau mỗi lần nâng cấp

Không cần cài đặt, không cần máy chủ: HTML/CSS/JavaScript thuần, chạy được trên GitHub Pages.

## Chức năng

| Nhóm | Chức năng |
|---|---|
| Tổng quan | Doanh thu, chi phí, lợi nhuận theo tháng/quý/năm (so với kỳ trước); biểu đồ 6 tháng; hiệu quả từng xe; việc cần xử lý; trạng thái xe |
| Đơn hàng | Đơn hàng, đơn đặt hàng, bảng kê (tạo tự động từ đơn hoàn thành), chứng từ/POD |
| Vận hành | Chuyến xe (phê duyệt chuyến, km thực tế, tổng CP), lệnh vận chuyển, tuyến đường, lịch trình tuyến, quản lý nhiên liệu, bảng điều vận kéo-thả |
| **Doanh thu & Chi phí** | **Nhập doanh thu** (xác nhận doanh thu tài xế gửi), **Đề nghị chi phí** (duyệt / từ chối / đánh dấu đã chi, duyệt hàng loạt), **Chi phí vận hành** theo đầu xe, phiếu thu, phiếu chi |
| Báo cáo | Lãi lỗ theo đầu xe (chi tiết từng xe), doanh thu - chi phí theo tháng, chi phí theo khoản mục × xe, **lãi lỗ theo chuyến**, **dầu định mức và thực tế**, **công nợ khách hàng (tuổi nợ)**, **quyết toán tạm ứng tài xế**, cảnh báo hạn giấy tờ |
| Tài xế / Xe / Khách hàng / Định mức / Danh mục | Đầy đủ danh mục như CETA (lương, chấm công, sự cố, rơ moóc, sửa chữa, lốp, hợp đồng, báo giá, định mức dầu…) |
| Quản trị | Người dùng, vai trò (quyền duyệt chi), nhật ký, **thùng rác**, thiết lập, **sao lưu / khôi phục** |

### Giao diện quản trị
- Menu trái có nhóm, thu gọn được; **tìm nhanh Ctrl + K** (trang, biển số, tài xế, khách hàng, mã đơn, mã phiếu)
- **Chế độ sáng / tối**
- Danh sách: tab trạng thái có đếm số, ô tìm kiếm, lọc theo khoảng ngày, lọc theo cột, **chọn cột hiển thị** (được ghi nhớ), sắp xếp, phân trang, dòng tổng, xuất Excel (CSV), in
- Chọn nhiều dòng → **duyệt / xác nhận / phê duyệt hàng loạt** hoặc xoá
- Bấm một dòng → **trang chi tiết** kèm các bản ghi liên quan (VD: xe → chuyến, doanh thu, chi phí, nhiên liệu) và lãi lỗ tháng của xe
- Form chia nhóm, ô chọn **gõ để tìm** (không dấu cũng tìm được)
- Màn hình điện thoại: danh sách tự chuyển sang dạng thẻ

### App tài xế
- Trang chủ: doanh thu / chi phí / số chuyến của xe trong tháng, chuyến hiện tại
- Chuyến: bắt đầu (nhập km), hoàn thành (km cuối, chụp POD) → tự cập nhật đơn hàng và trạng thái xe
- **Đề nghị chi phí** có chụp ảnh hoá đơn → chờ duyệt trên web
- Đổ nhiên liệu, **nhập doanh thu**, báo sự cố, xem/xác nhận bảng lương, đổi PIN
- **Thông báo** khi văn phòng duyệt / từ chối / xác nhận
- Giao diện sáng/tối theo điện thoại; "Thêm vào màn hình chính" để dùng như app

## Nghiệp vụ tài chính
- **Duyệt chi 2 cấp**: Kế toán duyệt (không giới hạn số tiền) → trạng thái *Kế toán đã duyệt* → **Quản trị viên xác nhận** → *Đã duyệt*. Quản trị viên duyệt trực tiếp thì đi thẳng tới *Đã duyệt*. Chỉ đề nghị *Đã duyệt / Đã chi* được tính vào chi phí. Trên máy chủ, quy tắc này được chặn ở cơ sở dữ liệu.
- **Đánh dấu Đã chi** tự tạo **phiếu chi** gắn với đề nghị.
- **Quyết toán chuyến**: tạm ứng chuyến − chi phí tài xế đã ứng (đã duyệt, chưa chi) − dầu tài xế tự trả → tài xế hoàn lại hoặc công ty trả thêm (tự tạo phiếu chi).
- **Phiếu thu** gắn bảng kê tự cập nhật trạng thái thanh toán; bảng kê có cột *Đã thu / Còn phải thu*.
- **Tính lương tháng**: lương cơ bản + số chuyến hoàn thành × định mức lương (hoặc lương khoán theo tuyến) − tạm ứng lương.
- **Chi phí vận hành kỳ Quý / Năm** được chia đều 3 / 12 tháng.
- **Cảnh báo trùng doanh thu** (cùng đơn hàng, hoặc cùng xe + ngày + số tiền).

## Nhập bảng tổng hợp tháng (Excel)
Menu *Doanh thu & Chi phí → Nhập bảng tổng hợp tháng (Excel)* (chỉ Quản trị viên). Đọc file .xlsx dạng "BẢNG TỔNG HỢP THÁNG" (mỗi sheet một tháng), đọc ngay trên trình duyệt, không gửi file đi đâu.
- Mỗi dòng container → **Đơn hàng** (Hoàn thành, kèm booking, loại cont, xuất/nhập/rỗng, phí nâng/hạ, số HĐ) + **Doanh thu cước** (tách VAT từ cột "CƯỚC gồm VAT").
- Phí nâng/hạ (LOLO) → **Thu chi hộ** + **Chi phí chi hộ** bằng nhau: không đổi lãi, nhưng vào công nợ khách (khớp cột "Tổng tiền cước + chi hộ").
- Các khoản (1)…(9) cuối bảng → **Chi phí vận hành** của tháng, phân bổ cho các xe theo số chuyến.
- Trước khi nhập: đối chiếu tổng đọc được với dòng TOTAL, cảnh báo dòng thiếu xe / ngày lệch tháng (tự sửa ngày gõ kiểu tháng/ngày).
- Nhập lại cùng file không tạo trùng; *Gỡ đợt nhập* chuyển cả tháng vào Thùng rác.
- Lãi trong TMG tính trên cước **trước VAT** nên thấp hơn số "lãi" trong file gốc (tính trên cước gồm VAT).

## Cách tính lãi lỗ theo đầu xe
- **Doanh thu** = phiếu *Nhập doanh thu* ở trạng thái *Đã xác nhận*
- **Chi phí** = Nhiên liệu + Đề nghị chi phí *Đã duyệt/Đã chi* + Phiếu sửa chữa *đã phê duyệt* + Chi phí vận hành (đã phân bổ theo kỳ)
- Bản ghi trong thùng rác không được tính

## Lưu trữ và an toàn dữ liệu
- Mỗi bảng dữ liệu lưu một khoá riêng trong `localStorage`, ghi theo từng bản ghi → mở nhiều tab không ghi đè lẫn nhau
- Ảnh chứng từ lưu trong **IndexedDB** (không bị giới hạn ~5MB như trước)
- **Xoá = chuyển vào thùng rác**, khôi phục được
- **Sao lưu tự động** mỗi ngày (giữ 10 bản) và trước mọi thao tác ghi đè; file sao lưu tải về gồm cả ảnh
- Dữ liệu định dạng cũ (v1) được **tự nâng cấp** lần đầu mở bản mới, sau khi đã sao lưu nguyên bản cũ

## Máy chủ dữ liệu dùng chung (Supabase)
Khi `js/config.js` có địa chỉ + khoá **anon** của Supabase, ứng dụng chạy ở chế độ máy chủ:
- Văn phòng và App tài xế **dùng chung dữ liệu**, cập nhật tức thời giữa các máy
- **Đăng nhập thật** (mật khẩu được mã hoá trên máy chủ): văn phòng đăng nhập bằng email; tài xế bằng **SĐT + PIN**
- **Phân quyền trên máy chủ**: tài xế chỉ thấy dữ liệu xe mình; chỉ Quản trị viên / Kế toán được duyệt chi; tài xế không tự xác nhận doanh thu hay phê duyệt chuyến
- Mất mạng vẫn nhập được: thay đổi lưu trên máy, tự gửi khi có mạng lại
- Mã chứng từ cấp từ máy chủ nên không trùng giữa các máy

Cài đặt (1 lần):
1. Supabase → **SQL Editor** → dán toàn bộ `supabase/setup.sql` → **Run**
2. Mở trang quản trị → tạo **tài khoản quản trị đầu tiên**
3. *Thiết lập → Máy chủ dữ liệu* → **Đưa dữ liệu từ trình duyệt này lên máy chủ** (nếu đã nhập dữ liệu ở bản chạy trên máy)
4. *Quản trị → Tài khoản đăng nhập* → tạo tài khoản kế toán/điều vận, **cấp tài khoản cho từng tài xế** (đặt PIN)

Thêm `?local=1` vào địa chỉ để chạy thử hoàn toàn trên máy. Không bao giờ đặt khoá `service_role` vào mã nguồn.

## Chạy thử trên máy
```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```
Mở http://localhost:8080 (quản trị), http://localhost:8080/driver.html (tài xế), http://localhost:8080/tests.html (tự kiểm tra).

Tài khoản mẫu: `admin / admin123`, `ketoan / ketoan123`, `dieuvan / dieuvan123`. Tài xế mẫu: xe `15C-123.45`, SĐT `0987654320`, PIN `1234`.
**Đổi mật khẩu/PIN trước khi dùng thật.** Vào *Thiết lập → Sao lưu / Khôi phục → Xoá sạch* để bắt đầu nhập dữ liệu thật.

## Cấu trúc
```
index.html          trang quản trị
driver.html         app tài xế
tests.html          tự kiểm tra (chạy trên vùng dữ liệu thử riêng)
css/app.css         giao diện quản trị (sáng/tối)
css/driver.css      giao diện app tài xế
js/store.js         lưu trữ v2, nâng cấp dữ liệu, sao lưu, thùng rác, tính toán tài chính
js/schema.js        định nghĩa toàn bộ module, menu, dữ liệu mẫu
js/admin.js         giao diện quản trị
js/driver.js        app tài xế
serve.ps1           máy chủ tĩnh để chạy thử
```
Thêm một module mới chỉ cần khai báo trường trong `js/schema.js` — danh sách, bộ lọc, form, chi tiết, xuất CSV được tạo tự động.
