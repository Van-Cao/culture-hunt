# Palace YOLO v3 — thử nghiệm cho demo nhỏ

Đã train lại YOLO26s-cls trên RTX 3060, bổ sung ảnh web và ảnh chính thức, đồng thời tách một bộ test mới trước khi dự đoán. Không thay đổi gameplay, API Next.js, HCMUS hoặc cấu hình deploy hiện có.

Đã xóa trọng số và kết quả train v1/v2 theo yêu cầu; chỉ giữ model v3 và gói demo. Báo cáo cũ và số liệu so sánh đã đo được vẫn được giữ. Script đánh giá có thể bỏ qua so sánh v2 nếu trọng số cũ không còn, không yêu cầu khôi phục chúng để dùng v3.

## Kết quả trên cùng bộ test mới

| Chỉ số | v2 | v3 |
|---|---:|---:|
| Dự đoán top-1 đúng | 27/40 (67,5%) | 34/40 (85%) |
| Macro-F1 | 0,5250 | 0,7978 |
| Phòng điện báo trong test | 0/1 | 1/1 |

Đây không phải bộ 14 ảnh validation trước đó. Cả 40 ID test đều chưa nằm trong tập train/validation v2. Test có 4 nhóm nguồn, chỉ 9 ảnh thuộc 5 checkpoint và 31 ảnh `other`. Support theo lớp: bunker 1, cabinet 2, facade 4, reception 1, rooftop 1, other 31. Vì vậy không thể xem đây là độ chính xác thực tế hay kết luận từng checkpoint đã ổn định.

Policy từ chối được chọn trên 15 ảnh validation **trước khi mở test**: probability tối thiểu 0,98, chênh lệch hai nhãn đầu tối thiểu 0,5, loại nhãn `other`, ảnh quá ít chi tiết hoặc phơi sáng không dùng được. Confidence vẫn chưa được hiệu chuẩn thành xác suất đúng.

Trên test, policy nhận 10 ảnh: 9 checkpoint đúng và **1 ảnh ngoài danh mục sai**; từ chối 30/31 ảnh `other`. Lỗi còn lại là `web-baughman-25`: hành lang hầm bị nhận là `bunker` với confidence 0,9910. Không chỉnh ngưỡng hoặc train lại để che lỗi này sau khi xem test. Model phù hợp thử nghiệm demo có phản hồi “chưa nhận diện được”, chưa phải xác minh hiện diện hoặc chống gian lận.

Chi tiết và toàn bộ dự đoán: [vision-v3-report.json](vision-v3-report.json). Policy và SHA256 gắn với đúng trọng số: [vision-model.json](vision-model.json).

## Dữ liệu và cách chia

Đã tải 478 ảnh Commons, 123 ảnh ứng viên từ các trang web, 27 ảnh bài chính thức và 42 screenshot tour. Không tự dùng toàn bộ ảnh tải được để train. Tổng cộng 228 ảnh đã có quyết định nhãn được đưa vào split v3, gồm 27 screenshot đã duyệt.

| Nhãn | Train | Validation | Test |
|---|---:|---:|---:|
| bunker | 7 | 1 | 1 |
| cabinet | 13 | 1 | 2 |
| facade | 45 | 3 | 4 |
| reception | 16 | 2 | 1 |
| rooftop | 18 | 3 | 1 |
| other | 74 | 5 | 31 |
| Tổng | 173 | 15 | 40 |

- Gom toàn bộ ảnh cùng tác giả Commons, cùng publisher web và cùng phiên tour. Có 41 nhóm train, 5 nhóm val, 4 nhóm test, không giao nhau.
- Liên kết ảnh trùng/gần trùng bằng pixels, dHash và pHash trước khi chia; tìm được một cặp ảnh gần trùng, đã cùng nhóm. Đây là kiểm tra hữu ích nhưng không bảo đảm phát hiện mọi bản crop/repost.
- Test seeds cố định trong `vision-v3-labels.json`: nhóm Razvan Orendovici, 源義信, Baughman Blog và Nomadic Experiences. Không chọn epoch hoặc threshold bằng test.
- Ảnh screenshot chỉ nằm trong train. Không coi các góc một panorama là những bối cảnh độc lập.
- Nhãn `bunker` vẫn là phòng máy điện báo, không mở rộng sang mọi phòng bản đồ, điện thoại hoặc thiết bị vô tuyến. Có thêm hard negatives từ các phòng này, bảo tàng khác và các địa điểm ngoài Dinh.
- Ảnh web/ảnh chính thức chưa xác minh giấy phép mở được ghi riêng trạng thái trong manifest, dùng trong thử nghiệm local này. Không phát hành lại nguyên dataset chỉ vì URL truy cập công khai. Commons giữ tác giả, giấy phép và URL từng ảnh.

## Nguồn chính

- [Bài ảnh chính thức Dinh](https://dinhdoclap.gov.vn/anh-dinh-doc-lap-noi-luu-giu-dau-an-sau-50-nam-giai-phong/) và [tour chính thức](https://thamquanvr360.dinhdoclap.gov.vn/).
- [Wikimedia Commons — Dinh Độc Lập](https://commons.wikimedia.org/wiki/Category:Independence_Palace), các danh mục nội thất, thiết bị thông tin và UH-1.
- [Travelikalocal](https://travelikalocal.com/vietnam/ho-chi-minh-city/the-reunification-palace/), [Nomadic Experiences](https://www.nomadicexperiences.com/2012/07/reunification-palace-last-bastion-of.html), [The Journey Taken](https://thejourneytaken.wordpress.com/2017/02/05/a-visit-to-reunification-palace-and-the-war-remnants-museum-in-ho-chi-minh-city/), [Baughman Blog](https://baughmanblog.com/2024/04/welcome-to-ho-chi-minh-city-%F0%9F%A4%AB-saigon.html), [GTrip](https://gtrip.vn/vietnam-tours/attractions/independence-palace).
- Một số URL ảnh báo PLO không còn tải được; ảnh không tải được không vào dataset. The Modern Postcard trả 403, không sử dụng hoặc vượt chặn.

## Tái lập

Giữ dataset local và các manifest để tái lập. Trên máy khác cần tải ảnh lại và đối chiếu curation vì nội dung web có thể thay đổi.

```powershell
.\.venv-yolo\Scripts\python.exe scripts/collect-palace-images.py --limit 478
.\.venv-yolo\Scripts\python.exe scripts/collect-palace-web.py
.\.venv-yolo\Scripts\python.exe scripts/prepare-palace-v3.py
.\.venv-yolo\Scripts\python.exe scripts/train-palace-v3.py
```

Script train dùng pretrained ban đầu, không nạp tiếp v2: ảnh 320×320 giữ toàn bộ khung (resize có đổi tỷ lệ), jitter màu và affine nhẹ, freeze 4 lớp đầu, dropout 0,25, inverse-frequency class weights lũy thừa 0,5, AdamW lr 0,0005, seed 2026. Dừng sớm sau 30 epoch trong ngân sách tối đa 100. Chọn model theo macro-F1 validation để lớp ít ảnh có trọng số ngang nhau.

`evaluate-palace-v3.py` đã chạy đúng một lượt, có chặn ghi đè báo cáo test. Từ nay bộ 40 ảnh này đã được quan sát: lần cải tiến tiếp phải dùng test mới hoặc công khai đây là bộ regression, không tiếp tục gọi nó là test chưa từng dùng.

## Dùng model trong dự án

Trọng số: `output/yolo/palace-v3-web/weights/best.pt`. Giữ cả model và `vision-model.json`, vì policy chứa checksum kiểm tra đúng file model.

```powershell
.\.venv-yolo\Scripts\python.exe scripts/palace_predictor.py public/images/palace/rooftop.webp
.\.venv-yolo\Scripts\python.exe scripts/palace_predictor.py public/images/palace/rooftop.webp --cpu
```

API Python sau này có thể khởi tạo `PalacePredictor` một lần và gọi `.predict(photo_bytes)` cho mỗi ảnh. Kết quả `matched` có `checkpointId`; `unknown` luôn có `checkpointId=null`. Backend vẫn cần kiểm tra checkpoint hiện tại và trạng thái lượt chơi trước khi mở khóa.

File `scripts/palace_predictor.py` dùng được trên CPU, không cần máy đã train hoặc RTX 3060. Có kiểm tra định dạng JPG/PNG/WebP, giới hạn 5MB khi nhận bytes, 25 megapixel và kiểm tra ảnh vô dụng. Các kiểm tra này không phải một bộ phát hiện mọi ảnh lạ.

Gói di chuyển model được tạo bằng `scripts/package-palace-vision.py`: `output/yolo/palace-v3-demo.zip`. Gói gồm trọng số, policy, predictor, requirements và báo cáo. Chưa có HTTP API, tunnel hoặc deployment; website vẫn dùng luồng nhận diện trước đó cho đến khi tích hợp dịch vụ Python.

## Kiểm tra và Git

```powershell
.\.venv-yolo\Scripts\python.exe -m unittest discover -s tests -p test_palace_predictor.py -v
```

Đã kiểm tra 7 trường hợp: không trả checkpoint cho `other`, từ chối kết quả mơ hồ/ảnh phẳng, kiểm tra checksum, nạp model trên CPU, nhận ảnh qua bytes và từ chối GIF. Ảnh mẫu app chỉ là smoke check, không được tính thêm vào độ chính xác test.

Commit script, nhãn, policy, báo cáo, tài liệu và tests. Dataset, ZIP và trọng số tiếp tục nằm trong đường dẫn đã ignore. Không tự commit, push hoặc deploy trong lượt này.
