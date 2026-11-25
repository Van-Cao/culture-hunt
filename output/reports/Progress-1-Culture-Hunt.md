# CULTURE HUNT — PROGRESS 1

## Phạm vi báo cáo

Hai mục: **Current work** và **Remaining tasks**. Báo cáo phản ánh bản demo Dinh Độc Lập hiện có, đối chiếu mã nguồn, tài nguyên và kết quả kiểm thử ngày 12/11/2026. Đánh giá tổng thể **khoảng 50%** theo nhận định của nhóm; đây không phải tỷ lệ chính xác nhận diện AI hay kết quả khảo sát người dùng.

Tên người phụ trách và thời hạn cuối dự án chưa được cung cấp. Phần phân công dùng vai trò và chỗ điền tên; kế hoạch 4 tuần là đề xuất tính từ khi nhóm chốt kế hoạch. Hạn nộp Progress 1 trong thông báo không được dùng làm hạn hoàn thành toàn bộ dự án.

## 1. CURRENT WORK — Công việc đã thực hiện

### Nội dung có thể đưa vào slide

**Culture Hunt đã có bản demo chơi xuyên suốt tại Dinh Độc Lập, đạt khoảng 50% mức hoàn thiện toàn dự án.** Nhóm đã kiểm chứng luồng chức năng bằng demo và kiểm thử kỹ thuật; hiệu quả học tập và độ tin cậy nhận diện ngoài thực tế vẫn cần được đánh giá.

| Hạng mục | Kết quả hiện có | Giới hạn cần nói rõ |
|---|---|---|
| Giao diện và bản đồ | Giao diện VI/EN; bản đồ hành trình 2.5D có nhân vật, điểm khóa/mở và tiến trình. Dấu ấn có bản đồ TP.HCM, chọn địa điểm để vào bản đồ nhỏ. | Sa bàn minh họa trải nghiệm chơi, chưa phải bản vẽ đo đạc hay chỉ đường trong tòa nhà. |
| Hành trình Dinh Độc Lập | 5 checkpoint: Mặt tiền Dinh, Phòng Khánh tiết, Phòng Nội các, Trực thăng trên mái và Thông tin dưới hầm. Luồng nhận diện ảnh → mini game → câu chuyện bằng chữ và audio đã được triển khai. | Chưa kiểm chứng hành trình khi tham quan thực tế, có đông người hoặc mạng yếu. |
| Mini game và tiến trình | 4 dạng tương tác tại 5 điểm: tìm chi tiết trên ảnh, ghép ảnh ở 2 điểm, ghép vật thể và nối mạch. Máy chủ kiểm tra thao tác, lưu tiến trình; chơi lại không cộng trùng XP. | Đã đa dạng thao tác, nhưng chiều sâu học tập và mức độ khó chưa được đánh giá với người dùng. Trò nối mạch là tương tác minh họa, không mô phỏng chính xác thiết bị lịch sử. |
| Nhận diện ảnh | Có ảnh mẫu, đối chiếu ảnh tải lên gần giống ảnh tham chiếu và đường tích hợp dịch vụ AI khi được cấu hình. | Chưa huấn luyện mô hình riêng; chưa có bộ ảnh kiểm thử độc lập hoặc số liệu độ chính xác trên ảnh chụp mới. Ảnh mẫu chạy được không chứng minh nhận diện thực tế đã tốt. |
| Nội dung và audio | 5 câu chuyện song ngữ; 10 MP3 VI/EN dài khoảng 30–41 giây. Ngân hàng gốc 10 câu được giữ lại, 9 câu đã biên tập thành câu hỏi mở rộng song ngữ; 1 câu chưa xác minh không dùng để chấm điểm. | Nội dung hiện thiên về giới thiệu và quan sát, cần bối cảnh, liên kết giữa các điểm và kiểm duyệt chuyên môn. Giọng đọc là bản demo; một số track VI dùng nguồn thay thế nên chưa đồng nhất. |
| Lưu trữ và dấu ấn | SQLite lưu lượt chơi, checkpoint, thao tác và phần thưởng. Có nhật ký, huy hiệu, lưu câu chuyện và xuất ảnh chia sẻ thành tích. | Dữ liệu Dinh gắn với hồ sơ trình duyệt, chưa gắn đầy đủ với tài khoản. Một phần dữ liệu khác vẫn lưu cục bộ. Chưa đồng bộ nhiều thiết bị. |
| Tài khoản và kiểm thử | Có khung Google OAuth và chế độ khách. Lần chạy kiểm thử ngày 12/11/2026 đạt **17/17**. | Đăng nhập bằng tài khoản thật chưa được xác minh. Bộ kiểm thử hiện tại không thay thế kiểm thử bảo mật, tải, sử dụng thực địa hay đánh giá AI. |

### Minh chứng nên đặt cạnh nội dung

Ảnh dưới đây là ảnh chụp demo đã có trong dự án, không phải minh chứng thử nghiệm với khách tham quan:

- [Bản đồ hành trình 2.5D](../playwright/palace-rooms-final-board.png): 5 điểm, trạng thái khóa và nhân vật.
- [Mini game tìm chi tiết](../playwright/minigame-facade-desktop.png): ví dụ cơ chế chơi ngoài quiz.
- [Câu chuyện và audio](../playwright/minigame-story-desktop.png): phần thưởng nội dung sau mini game. Ảnh được chụp ở một phiên demo trước, có chi tiết bố cục nút đã được chỉnh sau đó.
- [Bản đồ số Dấu ấn](../playwright/atlas-zoom-reset-1440.png): các mốc Dinh Độc Lập và ĐH KHTN, vào được bản đồ địa điểm.
- Kết quả chạy `npm test`: **17 bài đạt, 0 bài lỗi**; kiểm tra các quy tắc tiến trình, nhận diện ảnh tham chiếu, cô lập hồ sơ, chơi lại và tính nhất quán nội dung/audio.

Nguồn đối chiếu: [tổng quan dự án](../../README.md), [luật mini game](../../lib/palace/challenges.ts), [lưu trữ](../../lib/palace/store.ts), [nhận diện](../../lib/palace/recognition.ts), [đăng nhập](../../auth.ts), [kịch bản](../../content/palace/stories.json), [nguồn giọng đọc](../../public/audio/palace/README.md), [kiểm thử](../../tests/palace.test.ts).

### Giải thích con số 50%

Không nên đếm số màn hình để suy ra tiến độ. Giao diện là phần dễ thấy; tài khoản, tính bền vững của dữ liệu, nhận diện thực tế và chất lượng nội dung vẫn chiếm khối lượng lớn. Bảng dưới là **phân bổ ước lượng đề xuất để nhóm rà soát**, chưa phải số đo tiến độ theo giờ công hay danh sách yêu cầu đã nghiệm thu.

| Nhóm công việc | Trọng số đề xuất | Mức hoàn thiện ước lượng | Đóng góp vào tổng thể |
|---|---:|---:|---:|
| Giao diện và bản đồ | 20% | 80% | 16 điểm % |
| Gameplay và quản lý tiến trình | 20% | 70% | 14 điểm % |
| Tài khoản và dữ liệu | 20% | 30% | 6 điểm % |
| Nhận diện ảnh thực tế | 20% | 25% | 5 điểm % |
| Nội dung, câu hỏi và audio | 15% | 50% | 7,5 điểm % |
| Kiểm thử người dùng và vận hành | 5% | 30% | 1,5 điểm % |
| **Tổng** | **100%** | | **50%** |

Cách tính: tổng của trọng số × mức hoàn thiện từng hạng mục. Các tỷ lệ con chỉ dùng để giải thích ước lượng 50%; cần cập nhật khi nhóm thống nhất phạm vi và tiêu chí nghiệm thu. **25% ở nhận diện là tiến độ công việc, không phải độ chính xác AI.**

### Phân tích ưu điểm và hạn chế

**Ưu điểm.** Demo đã thể hiện được điểm khác biệt của sản phẩm: biến việc xem thông tin di sản thành hành trình tương tác. Người chơi có mục tiêu, phản hồi, phần thưởng và lịch sử khám phá. Việc chọn 5 checkpoint tại một địa điểm giúp nhóm thu gọn phạm vi để hoàn thiện một trải nghiệm xuyên suốt. Mini game đa dạng hơn quiz; câu chuyện và audio song ngữ giúp tiếp cận thông tin theo nhiều cách. Quy tắc được kiểm tra ở máy chủ và lưu tiến trình tạo nền tảng tốt để phát triển tiếp.

**Hạn chế.** Trải nghiệm đang thuyết phục ở mức demo, nhưng chưa đủ bằng chứng để khẳng định sản phẩm dùng tốt ngoài thực tế. Một người có thể chơi trên một trình duyệt, song chưa có danh tính người dùng thống nhất và khôi phục tiến trình giữa thiết bị. Nhận diện có thể hoạt động với ảnh mẫu hoặc ảnh gần giống, trong khi ảnh do du khách chụp có góc nhìn, ánh sáng và vật cản khác. Mini game tạo tương tác nhưng chưa chắc tạo hiểu biết: ghép đúng ảnh không đồng nghĩa hiểu giá trị lịch sử. Nội dung ngắn là lợi thế tiếp cận, nhưng cần thêm lớp kiến thức để tránh chỉ dừng ở giới thiệu bề mặt.

**Kết luận dùng khi thuyết trình:** “Nhóm đã xây dựng được trải nghiệm cốt lõi có thể trình diễn. Phần việc tiếp theo tập trung vào độ tin cậy, chiều sâu nội dung và khả năng sử dụng thực tế, vì vậy nhóm đánh giá tổng thể hiện khoảng 50%.”

## 2. REMAINING TASKS — Công việc còn lại

### Danh sách ưu tiên và tiêu chí hoàn thành

P0: cần cho mốc dùng thử tin cậy tiếp theo. P1: cần trước khi đánh giá và bàn giao bản thử nghiệm.

| Ưu tiên | Công việc | Kết quả cần bàn giao | Tiêu chí nghiệm thu đề xuất | Phụ trách |
|---|---|---|---|---|
| P0 | Hoàn thiện tài khoản | Đăng nhập/đăng xuất Google thật; định danh người chơi; gắn lượt chơi và huy hiệu với tài khoản; quy tắc chuyển tiến trình khách sang tài khoản. | Cùng tài khoản thấy đúng tiến trình trên 2 thiết bị; 2 tài khoản không đọc/sửa dữ liệu của nhau; lỗi đăng nhập có hướng xử lý; không mất lịch sử khi chuyển từ khách. | Backend/Data — [Tên]; Frontend phối hợp |
| P0 | Hoàn thiện tầng dữ liệu | Chốt cơ sở dữ liệu dùng khi triển khai, mô hình user–run–visit–attempt–reward, migration, sao lưu và phục hồi. Giữ được lịch sử demo hiện có. | Dữ liệu tồn tại sau triển khai lại; thử phục hồi được bản sao lưu; API kiểm tra quyền sở hữu; gửi lại yêu cầu hoặc chơi lại không cộng trùng phần thưởng. | Backend/Data — [Tên] |
| P0 | Cải thiện nhận diện | Bộ ảnh gán nhãn 5 checkpoint và lớp “không thuộc địa điểm”; baseline; báo cáo lỗi; cải tiến pipeline hoặc huấn luyện khi có căn cứ. | Có tập kiểm thử độc lập và báo cáo từng checkpoint; kiểm tra góc mới, ảnh mờ, thiếu sáng, vật cản và ảnh ngoài phạm vi; có trạng thái không chắc chắn và hướng dẫn chụp lại. | AI/Vision — [Tên]; Content hỗ trợ nhãn |
| P1 | Nâng chiều sâu mini game và storytelling | Mỗi điểm có mục tiêu học tập, mini game gắn với ý nghĩa hiện vật/không gian, câu hỏi giải thích đáp án, nguồn tư liệu, kịch bản VI/EN và audio được duyệt. | Cả 5 điểm có nguồn kiểm chứng và người rà soát; phân biệt dữ kiện với diễn giải; VI/EN thống nhất; audio khớp kịch bản và giọng đọc nhất quán. | Content/Research — [Tên]; Frontend/Gameplay — [Tên] |
| P1 | Kiểm thử người dùng và vận hành | Phiên dùng thử quy mô nhỏ, kiểm tra điện thoại, mạng yếu, khả năng tiếp cận; môi trường triển khai, cấu hình dịch vụ, theo dõi lỗi và cách xử lý sự cố. | Chạy xuyên suốt 5 điểm bằng tài khoản thật; thu thập tỷ lệ hoàn thành, lỗi, mức hiểu nội dung và phản hồi; xử lý lỗi nghiêm trọng trước bàn giao. | QA/UX — [Tên]; cả nhóm phối hợp |

### Làm rõ ba hướng cải tiến chính

**1. Tài khoản và database.** Không nên viết “chưa có database”, vì demo đã dùng SQLite. Cách mô tả đúng là “đã có lưu trữ tiến trình ở mức demo; cần hoàn thiện dữ liệu gắn với tài khoản và triển khai bền vững”. Quyết định dùng tiếp SQLite hay chuyển sang cơ sở dữ liệu chia sẻ cần dựa trên cách triển khai và số người dùng dự kiến. Phần bắt buộc là định danh, quyền truy cập, lưu trữ bền vững, migration và sao lưu; đổi công nghệ đơn thuần không giải quyết hết vấn đề.

**2. Nhận diện và huấn luyện AI.** Trước khi train, cần thu thập ảnh có nguồn rõ ràng, gán nhãn và đo baseline. Ảnh mạng có thể giúp khởi động, nhưng cần bổ sung ảnh chụp mới tại địa điểm. Chia tập dữ liệu theo ảnh gốc/phiên chụp; ảnh cắt, nén hay đổi kích thước từ cùng một ảnh không được nằm ở cả tập huấn luyện và tập đánh giá. Đo tỷ lệ nhận đúng theo điểm, nhầm giữa các phòng, từ chối ảnh ngoài phạm vi và thời gian phản hồi. Sau đó mới quyết định cải tiến tham chiếu, tìm kiếm tương đồng hình ảnh hay huấn luyện/tinh chỉnh. Ngưỡng nghiệm thu AI sẽ chốt sau khi có baseline; chưa đưa phần trăm chính xác không có bằng chứng vào báo cáo.

**3. Chiều sâu nội dung.** Mỗi checkpoint nên trả lời ba câu: người chơi cần quan sát gì, chi tiết đó có ý nghĩa gì, và nó kết nối với câu chuyện chung ra sao. Audio chính vẫn ngắn; bổ sung phần “Tìm hiểu thêm” có nguồn để người muốn đọc sâu không bị giới hạn. Câu hỏi nên có phản hồi giải thích sau đáp án, kiểm tra hiểu và liên hệ thay vì chỉ nhớ tên/số. Ví dụ: Phòng Khánh tiết có thể yêu cầu quan sát bố cục rồi giải thích vai trò không gian; Phòng Nội các gắn đồ vật với công năng; khu hầm gắn thiết bị với vai trò liên lạc. Nội dung cụ thể phải được kiểm chứng trước khi xuất bản. Tránh dùng lời kể ngôi thứ nhất như phát ngôn lịch sử nếu không có nguồn.

### Kế hoạch 4 tuần đề xuất

| Giai đoạn | Công việc chính và phụ thuộc | Phụ trách | Kết quả / điểm kiểm tra |
|---|---|---|---|
| Tuần 1 — Chốt nền tảng | Rà soát yêu cầu; chốt định danh, schema và quy tắc chuyển tiến trình khách. Song song lập bộ ảnh, gán nhãn, chạy baseline; lập mục tiêu học tập và danh mục nguồn cho 5 điểm. | Backend/Data; AI/Vision; Content/Research. QA chốt kịch bản nghiệm thu. | Schema và quy tắc dữ liệu được duyệt; báo cáo baseline ban đầu; danh sách thiếu dữ liệu/tư liệu; chốt phạm vi và mục tiêu đo lường. |
| Tuần 2 — Hoàn thiện chức năng nền | Kết nối tài khoản–lượt chơi–database; migration và đồng bộ. AI thử cải tiến theo lỗi baseline. Content viết lại 5 kịch bản/câu hỏi; Frontend điều chỉnh mini game theo mục tiêu học tập. | Backend/Data; AI/Vision; Content/Research; Frontend/Gameplay. | Bản tích hợp đăng nhập và đồng bộ 2 thiết bị; so sánh phương án nhận diện; bản nội dung chờ rà soát. |
| Tuần 3 — Tích hợp và rà soát | Tích hợp phương án nhận diện đã chọn; thêm chụp lại khi không chắc chắn. Duyệt nội dung VI/EN, tạo lại audio; kiểm tra quyền sở hữu, tải lại, mạng lỗi và giao diện điện thoại. | Frontend/Gameplay; Backend/Data; AI/Vision; Content/Research; QA/UX. | Bản ứng viên có thể dùng thử; kiểm thử hồi quy đạt; nội dung và audio đã duyệt. Chỉ bắt đầu pilot tài khoản sau khi kiểm tra quyền truy cập đạt. |
| Tuần 4 — Dùng thử và ổn định | Pilot đề xuất với 5–8 người, ghi nhận trở ngại và mức hiểu nội dung; sửa lỗi; kiểm tra sao lưu/phục hồi, triển khai và tài liệu bàn giao. Đây là kế hoạch, chưa phải hoạt động đã diễn ra. | QA/UX điều phối; mỗi vai trò xử lý phần phụ trách. | Báo cáo pilot và giới hạn; danh sách lỗi đã xử lý; bản demo ổn định và cập nhật tiến độ theo tiêu chí thực tế. Pilot nhỏ chỉ cung cấp tín hiệu ban đầu. |

Các nhánh tài khoản, AI và nội dung có thể tiến hành song song. Đánh giá cuối luồng phụ thuộc vào việc tích hợp cả ba. Nếu thiếu ảnh thực địa hoặc chưa đạt mục tiêu nhận diện, giữ rõ chế độ ảnh mẫu khi trình diễn và báo cáo kết quả thực tế; không đổi nhãn thành “AI đã hoàn thiện”. Mở rộng gameplay ĐH KHTN nên thực hiện sau khi quy trình Dinh Độc Lập đã ổn định.

### Phân công cá nhân cần điền trước khi nộp

| Vai trò | Người phụ trách chính | Sản phẩm chịu trách nhiệm |
|---|---|---|
| Frontend / Gameplay | [Điền tên] | Luồng chơi, trạng thái lỗi, mini game gắn mục tiêu học tập, giao diện điện thoại. |
| Backend / Data | [Điền tên] | Tài khoản, schema, API, quyền sở hữu, đồng bộ, migration và sao lưu. |
| AI / Vision | [Điền tên] | Bộ dữ liệu, baseline, cải tiến/huấn luyện khi cần, báo cáo nhận diện. |
| Content / Research | [Điền tên] | Nguồn, tính chính xác, câu hỏi, storytelling VI/EN, duyệt audio. |
| QA / UX | [Điền tên] | Kịch bản kiểm thử, pilot, tổng hợp phản hồi và theo dõi tiêu chí nghiệm thu. |

Đây là các vai trò, không giả định nhóm có 5 người. Một thành viên có thể kiêm nhiều vai trò; mỗi đầu việc vẫn cần một người chịu trách nhiệm chính. Bản nộp cuối cần thay chỗ trống bằng tên thật để đáp ứng yêu cầu “individual responsibilities”.

### Lời thuyết trình gợi ý (khoảng 90 giây)

“Ở giai đoạn hiện tại, nhóm đã xây dựng được bản demo Culture Hunt tại Dinh Độc Lập với năm checkpoint. Người chơi nhận diện ảnh, hoàn thành mini game rồi mở khóa câu chuyện bằng văn bản và audio song ngữ. Tiến trình được ghi nhận trên bản đồ Dấu ấn, kèm nhật ký và huy hiệu. Nhóm đã triển khai bốn dạng mini game và mười file audio; bộ kiểm thử kỹ thuật hiện có đạt mười bảy trên mười bảy bài.

Tuy nhiên, nhóm đánh giá mức hoàn thiện toàn dự án mới khoảng năm mươi phần trăm. Giao diện và luồng demo đã rõ, nhưng đăng nhập chưa gắn đầy đủ với lịch sử chơi để đồng bộ giữa thiết bị. Hệ thống có database ở mức demo, cần hoàn thiện để vận hành bền vững. Nhận diện mới có ảnh tham chiếu và đường tích hợp AI, chưa được đánh giá trên bộ ảnh thực tế độc lập. Nội dung và mini game cũng cần được phát triển để người chơi hiểu di sản sâu hơn.

Trong giai đoạn tiếp theo, nhóm ưu tiên tài khoản và dữ liệu, xây bộ ảnh và đo chất lượng nhận diện, đồng thời biên tập lại nội dung. Kế hoạch đề xuất là bốn tuần, kết thúc bằng dùng thử quy mô nhỏ và sửa lỗi. Mỗi nhánh sẽ có người phụ trách và tiêu chí nghiệm thu rõ ràng trước khi mở rộng sang địa điểm khác.”
