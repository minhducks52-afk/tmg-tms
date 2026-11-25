/* Kết nối máy chủ dữ liệu Supabase.
 * Khoá "anon" được thiết kế để công khai (quyền truy cập do phân quyền RLS trên máy chủ quyết định).
 * TUYỆT ĐỐI không đặt khoá "service_role" vào đây.
 * Xoá/để trống url để chạy hoàn toàn trên máy; thêm ?local=1 vào địa chỉ để chạy thử trên máy.
 */
window.TMG_CLOUD = {
  url: 'https://cprkjevzraahzzxufjhd.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcmtqZXZ6cmFhaHp6eHVmamhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2MTg0ODEsImV4cCI6MjExMTE5NDQ4MX0.Paf8JU7rlXtveyISLVodD3UeHntjbtHYjj1JQs97j80'
};
