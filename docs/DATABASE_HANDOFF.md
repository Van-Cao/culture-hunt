# Culture Hunt — Bàn giao phần cơ sở dữ liệu

## Trạng thái và phạm vi

Nhánh làm việc: `feature/database-checkins`, xuất phát từ `main`.
Hai bảng ứng dụng: `public.users` và `public.checkins`.
Lớp dữ liệu chưa được nối vào các component trên nhánh `UI/UX`.
Không thay đổi camera, prompt, bố cục hoặc Auth.js của đồng đội.

Nhánh sửa build độc lập: `fix/ui-vision-dependency`. Nhánh đó chỉ thêm SDK
Google đang được API vision import. Tech Lead cần review/merge vào `UI/UX`.

Project Supabase hosted chưa được tạo/xác minh khi viết tài liệu này. Cần người
phụ trách đăng nhập Supabase để thực hiện phần thiết lập dưới đây. Không coi
việc unit test đạt là bằng chứng kết nối cloud hoặc đăng nhập Google thật.

## Luật đã chốt

| Sự kiện | Dữ liệu lưu | XP |
| --- | --- | --- |
| Nhận diện hợp lệ | Một check-in duy nhất cho mỗi người/địa điểm; snapshot quiz | 0 |
| Trả lời sai | Ghi câu đã thử, lựa chọn gần nhất, số lần thử; chuyển câu | 0 |
| Lần đầu trả lời đúng một nhiệm vụ | Ghi thời gian nhận điểm đúng | 150 |
| Trả lời lại câu đã từng đúng | Vẫn ghi lần thử | 0 |
| Thử hết các câu của địa điểm | Hoàn thành, kể cả có câu sai; huy hiệu địa điểm | 100 một lần |
| Quét/chơi lại địa điểm | Giữ snapshot và tiến độ; có thể kiếm điểm câu chưa từng đúng | Không thưởng trùng |

Thành tựu tính từ dữ liệu đã lưu: hoàn thành từng địa điểm; 1/3/5 địa điểm
check-in khác nhau; danh hiệu tại 150/500/1.000 XP. Tên danh hiệu hiện là nhãn
tạm có thể đổi trong `lib/data/rules.ts`; các mốc điểm đã được chủ dự án chốt.

Guest-to-account merge hợp các nhiệm vụ đã thử/đã từng đúng theo mã ổn định,
gộp địa điểm trùng và tính lại tổng; không cộng hai tổng điểm có sẵn. Phiên
khách đã chuyển không được tiếp tục ghi dữ liệu. Merge gọi lặp vẫn an toàn.

## Tạo Supabase Free lần đầu

1. Đăng nhập [Supabase Dashboard](https://supabase.com/dashboard), chọn/tạo
   organization miễn phí của nhóm. Nếu có yêu cầu tài khoản/thỏa thuận, chủ tài
   khoản tự hoàn tất. Không chọn gói trả phí cho đồ án.
2. Tạo project tên `culture-hunt`, chọn region gần người chơi, ví dụ Singapore
   nếu giao diện cung cấp. Chủ tài khoản tự đặt và giữ database password; không
   gửi mật khẩu trong chat hoặc commit vào Git.
3. Chờ database sẵn sàng. Mở **SQL Editor**, chạy nội dung file
   `supabase/migrations/20261112015310_game_storage.sql` một lần trên project mới.
   Migration đã có transaction, RLS và bucket ảnh private `checkin-photos`.
   Đây là migration khởi tạo, không phải script reset database đang có dữ liệu.
4. Vào phần **Authentication / Sign-in providers**, bật anonymous sign-ins.
   Đây là danh tính thật của khách trên Supabase, không phải dùng chung role
   `anon` rồi cho mọi người ghi bảng tùy ý.
5. Bật Google provider khi Tech Lead cung cấp OAuth client ID/secret. Trong
   Google Cloud Console thêm callback URL Supabase hiển thị, thường là
   `https://<project-ref>.supabase.co/auth/v1/callback`. Callback Auth.js cũ là
   một flow khác, không tự tạo phiên Supabase cho lớp dữ liệu này.
6. Cấu hình Site URL và redirect allowlist gồm `http://localhost:3000/` khi
   phát triển và URL Vercel chính xác khi triển khai. Helper Google quay về
   `/?play=1` trên cùng origin. Tài khoản Google có thể cần được thêm làm test
   user trong OAuth consent screen nếu ứng dụng còn ở chế độ thử nghiệm.
7. Mở phần **Connect / API keys**, điền URL + publishable key và secret key
   vào `.env.local` dựa trên `.env.supabase.example`. Không ghi đè các biến
   Auth.js/Gemini đã có. Legacy anon/service-role keys cũng được hỗ trợ.
8. Khởi động lại Next.js sau khi đổi env. Thêm các biến tương ứng trong Vercel
   project settings khi triển khai. Chỉ URL và publishable key có `NEXT_PUBLIC_`.

Kiểm tra schema sau khi chạy migration:

```sql
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('users','checkins');
select id, public, file_size_limit from storage.buckets where id = 'checkin-photos';
```

Cả hai bảng phải có `rowsecurity = true`; bucket phải `public = false`.
Chạy Security Advisor trong Dashboard sau khi áp dụng trên cloud.

## Giao cho Tech Lead

File server chính: `lib/supabase.ts`, `lib/data/server.ts`.

API vision chỉ gọi `recordVerifiedScan` **sau khi xác nhận ảnh đúng đối tượng
được game hỗ trợ**. Không truyền thẳng request body của browser vào hàm này.
Ví dụ tích hợp trong API vision (đồng đội thực hiện trong phạm vi của họ):

```ts
import { recordVerifiedScan, requestToken } from '@/lib/data/server';

// token lấy từ Authorization: Bearer <Supabase access token>
const token = requestToken(request);
// recognizedPlace và validatedQuizzes phải đến từ bước xác thực phía server.
const checkin = await recordVerifiedScan(token, {
  placeId: recognizedPlace.id,       // ví dụ "palace", không tự suy ra từ browser
  placeName: recognizedPlace.name,
  quizzes: validatedQuizzes,
});
return Response.json({ checkin });
```

Mỗi quiz theo hợp đồng:

```ts
{
  id: 'mission-1',
  question: 'Câu hỏi đã được kiểm duyệt?',
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 1, // 0=A, 1=B, 2=C, 3=D; chỉ ở server
  story: 'Câu chuyện ngắn, tùy chọn'
}
```

Mã địa điểm/nhiệm vụ chỉ gồm chữ thường a-z, số, `_`, `-`, tối đa 80 ký tự.
Mỗi nơi có 1–50 câu, mỗi câu đúng 4 lựa chọn. Mã nhiệm vụ phải giữ nguyên
giữa các người chơi, các lần quét và hai ngôn ngữ. Không dùng câu hỏi dịch,
thời gian hoặc UUID mới cho mỗi lần tạo làm mã nhiệm vụ; sẽ sai danh tính phần
thưởng. Khi quét lại, database trả lại snapshot ban đầu thay vì thay bộ quiz.

API vision hiện trên `UI/UX` trả `{ name, quiz: string, answer, story }` cho
một câu; cấu trúc đó **chưa tương thích** với hợp đồng trên. Tech Lead/Prompt
Engineer cần chuẩn hóa địa điểm và quiz trước khi gọi lớp lưu trữ. Không có
endpoint browser nào tự khai `scanSuccess: true` để tạo check-in.

## Giao cho thành viên UI

Import từ `lib/data/client.ts` trong client component:

```ts
// Khi app mở; phải chờ hoàn tất callback trước khi tải/tạo phiên khách.
const transferred = await completeGoogleSignIn();
const state = transferred ?? await loadPlayer();

// Nút đăng nhập Google cho dữ liệu Supabase:
await startGoogleSignIn();

// Người chơi chốt đáp án; không truyền isCorrect hoặc điểm từ client.
const result = await answerMission('palace', 'mission-1', 1);
// Dùng result.correct, result.pointsAwarded, result.totalPoints và checkin mới.

// Lưu ảnh riêng sau khi check-in đã thành công:
const photo = await uploadCheckinPhoto('palace', capturedFile);
// photo.saved=false chỉ hiện cảnh báo; không hoàn tác tiến độ.
```

Các import tương ứng: `completeGoogleSignIn`, `loadPlayer`, `startGoogleSignIn`,
`answerMission`, `uploadCheckinPhoto`; có thêm `updateNickname` và
`ensurePlayerSession` (lấy access_token để gửi ảnh đến API vision).

Những điểm UI cần nối:
- Lấy tổng điểm từ `state.player.total_points`, không tính từ số câu đúng trong
  localStorage. `state.checkins` chứa snapshot quiz không có đáp án đúng.
- Resume bằng `nextMissionId`; đó là câu đầu tiên chưa thử. Khi tất cả đã thử,
  giá trị là null; người chơi vẫn chọn câu để xem/chơi lại.
- Quiz sai vẫn gọi chuyển câu; UI demo hiện chỉ cho thử lại nên cần điều chỉnh
  `QuizCard.tsx`. Đợi server lưu thành công rồi cập nhật tiến độ. Lỗi mạng thì
  giữ câu hiện tại và cho gửi lại.
- Thay `completeMission`/localStorage trong `CultureHunt.tsx` bằng kết quả API.
  Không dùng `mission.correct` để tự chấm hoặc cộng điểm ở browser.
- Dùng thành tựu từ snapshot, hoàn thành theo `checkin.status`; không coi
  "đúng hết 3 câu" là điều kiện hoàn thành.
- Google login hiện qua NextAuth không đồng bộ với Supabase. UI cần dùng
  adapter đăng nhập ở trên và cập nhật phần hiển thị danh tính tương ứng;
  không chạy đồng thời hai flow rồi kỳ vọng chúng có cùng user ID.

API riêng cho dữ liệu:

| Method / URL | Nội dung |
| --- | --- |
| GET `/api/game/player` | Hồ sơ, check-in, quiz công khai, tiến độ, thành tựu |
| PATCH `/api/game/player` | JSON `{ nickname }` |
| POST `/api/game/answers` | JSON `{ placeId, missionId, choice }` |
| POST `/api/game/merge` | JSON `{ guestAccessToken }`; Bearer là tài khoản đích |
| POST `/api/game/checkins/:placeId/photo` | Multipart `photo`, tối đa 4 MB |

Mọi request cần `Authorization: Bearer <Supabase access token>`.
Response chứa dữ liệu người chơi dùng `Cache-Control: private, no-store`.
Ảnh private dùng URL có hạn 5 phút; tải lại snapshot để nhận URL mới.
Giới hạn ảnh 4 MB để phù hợp request body trên Vercel; UI camera có thể cần
giảm kích thước ảnh trước upload. Ảnh lỗi không ảnh hưởng check-in.

## Kiểm thử và phối hợp Git

Node.js 22.18+ (đã kiểm thử bằng Node 24). Sau `npm ci`:

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

Unit/API tests dùng Node test runner và mock HTTP/auth để kiểm tra adapter,
xác thực, lọc đáp án, lỗi upload. Chúng không chứng minh OAuth/Storage cloud.

`supabase/tests/game.sql` kiểm tra transaction thật, phần thưởng, merge và
RLS. Chỉ chạy trong database phát triển/test riêng; dùng transaction rollback.
Đã chạy bằng PostgreSQL WASM (PGlite) với schema auth/storage mô phỏng. Chưa
kiểm chứng hành vi mạng, tải thật, concurrency nhiều kết nối hay OAuth thật.
Khi có project dev, chạy SQL test và Security Advisor để xác minh trên Supabase.

Trước khi demo cần test thêm: chơi khách → reload → quét thật → sai một câu →
hoàn thành → chơi lại câu sai để nhận điểm lần đầu → đăng nhập Google → kiểm
tra tiến độ không mất/trùng → dùng thiết bị khác → ảnh và điểm vẫn xem được.

Tạo PR từ `feature/database-checkins` về `main`; để Tech Lead review và phối hợp
merge với UI. Không push trực tiếp vào `main`/`UI/UX`, không force-push. Khi
merge, giữ cả nội dung bộ nhớ dự án và các khối hướng dẫn Next.js trong AGENTS.
Các điểm có thể trùng file với đồng đội là package/lockfile, .gitignore và
AGENTS; không chọn bỏ toàn bộ một phía khi giải quyết conflict.

Nguồn hướng dẫn đã đối chiếu:
- https://supabase.com/docs/guides/auth/auth-anonymous
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/security/access-control
