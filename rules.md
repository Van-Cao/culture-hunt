# Quy tắc vận hành Culture Hunt

Đọc cùng `AGENTS.md` trước mỗi phiên làm việc và sau khi reload.

1. **Version Control:** BẮT BUỘC thực hiện `git add .` và
   `git commit -m "thông điệp rõ ràng"` ngay sau khi hoàn thành hoặc thay đổi
   bất kỳ tính năng/file nào. Kiểm tra nội dung stage để không commit secrets
   hoặc sản phẩm build. Chia việc thành các thay đổi nhỏ đã kiểm tra.
2. **Quality Assurance:** BẮT BUỘC tự debug và viết/chạy các bài test liên quan
   ngay sau khi viết xong một hàm hoặc chức năng. Không bàn giao code chưa test.
   Kiểm tra TypeScript, lint và build trước khi bàn giao; ghi rõ phần nào chưa
   thể kiểm thử với tài khoản/dịch vụ thật.
3. **Tech Stack Strictness:** Tuân thủ Next.js, TypeScript, Tailwind CSS,
   shadcn/ui, Supabase. Không tự ý thêm thư viện ngoài khi chưa xin phép.
   SDK Supabase thuộc stack đã yêu cầu; SDK Google đang thiếu đã được chủ dự án
   đồng ý bổ sung ngày 2026-11-12. Pin phiên bản và commit lockfile.
4. Chỉ làm phần dữ liệu trong phạm vi đã ghi ở `AGENTS.md`. Không tự sửa UI,
   camera, prompt hoặc hợp nhất nhánh của đồng đội. Bản sửa lỗi dependency UI
   đã được duyệt phải nằm trên nhánh riêng.
5. Không commit `.env.local`, mật khẩu, token, secret key, service-role key,
   ảnh người dùng hoặc dữ liệu chạy thử. Chỉ commit mẫu biến môi trường trống.
6. Cộng điểm và ghi tiến độ bằng transaction ở database. Không tin điểm,
   đáp án đúng, danh tính, hay kết quả nhận diện tự khai từ browser.
7. Bật RLS; chỉ đọc dữ liệu của chính người chơi, bảo vệ đáp án, mọi lệnh ghi
   có đặc quyền chạy phía server. Không dùng service-role key trên client.
8. Không push trực tiếp vào `main` hoặc `UI/UX`, không force-push. Các nhánh
   được phép dùng là `feature/database-checkins` và nhánh sửa lỗi đã duyệt.
9. Không tạo tài nguyên trả phí, deploy production hoặc thay đổi dữ liệu có
   sẵn ngoài phạm vi được giao. Chỉ tạo project Supabase Free cho đồ án.
10. Không tự đổi luật nghiệp vụ đã chốt. Nếu gặp mâu thuẫn thực tế, báo rõ và
    chốt lại điểm ảnh hưởng trước khi thay đổi hành vi.
