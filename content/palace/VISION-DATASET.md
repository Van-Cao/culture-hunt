# Dữ liệu ảnh cho YOLO Classification — Culture Hunt

Mục tiêu: phân loại ảnh theo đúng 5 checkpoint trong `lib/palace/checkpoints.ts`.
Đây là bộ dữ liệu khởi đầu được thu thập từ mạng, chưa phải benchmark xác nhận độ chính xác ngoài thực tế. Đã bổ sung quy trình train thử; API nhận diện đang chạy vẫn chưa thay đổi.

## Nhãn và các trường hợp dễ nhầm

| Nhãn | Chọn ảnh có | Không gán nhầm |
|---|---|---|
| `facade` | Mặt tiền chính, rèm đá và kiến trúc Dinh nhận ra được | Chỉ cổng, cây, bồn phun nước, mặt sau hoặc ảnh Dinh Norodom cũ |
| `reception` | Phòng Khánh tiết như ảnh app: sảnh rộng, thảm đỏ, rèm đỏ, đèn chùm | Phòng Đại yến, tiếp khách Tổng thống, phu nhân hoặc trình quốc thư |
| `cabinet` | Bàn oval rỗng giữa, micro, ghế xanh sẫm, rèm xanh vàng | Bất kỳ phòng họp nào khác |
| `rooftop` | Sân mái với trực thăng UH-1 trưng bày tại Dinh | Trực thăng ở nơi khác, F-5 hoặc ảnh mái không có đặc điểm phân biệt |
| `bunker` | Phòng thông tin: máy điện báo, tường nâu đỏ, gạch hoa đen trắng | Hành lang, phòng tác chiến bản đồ hoặc thiết bị điện chung chung |
| `other` | Những phòng khác đã kiểm tra bằng mắt | Không coi nhãn này là cơ chế từ chối mọi ảnh lạ |

## Nguồn đã kiểm tra ngày 19/11/2026

1. [Bài ảnh chính thức](https://dinhdoclap.gov.vn/anh-dinh-doc-lap-noi-luu-giu-dau-an-sau-50-nam-giai-phong/): 27 ảnh bài viết, lẫn ảnh hiện nay, ảnh lịch sử, hiện vật và khách tham quan. Chọn riêng ảnh đúng checkpoint; loại ảnh lịch sử khỏi dữ liệu nhận diện hiện trạng. Chưa xác minh giấy phép mở: lưu riêng, không mặc định cho phép phát hành lại.
2. [Tour chính thức](https://thamquanvr360.dinhdoclap.gov.vn/), được liên kết trực tiếp từ trang chủ Dinh, nhúng [StarGlobal 3D](https://sanpham.starglobal3d.vn/smart-heritage-3d/dinh-doc-lap/). Cấu hình công khai `tour_xml/tour.xml` có 91 mục cảnh (có tên lặp). Có Khánh tiết, Nội các và mặt tiền. Chưa thấy cảnh mang tên sân thượng/UH-1 hoặc phòng điện báo trong danh mục này. Đường dẫn ảnh cube thử trả HTTP 403: chỉ lưu danh mục, không tính là ảnh tải thành công, không vượt chặn truy cập.
3. Wikimedia Commons: [toàn Dinh](https://commons.wikimedia.org/wiki/Category:Independence_Palace), [nội thất](https://commons.wikimedia.org/wiki/Category:Interiors_of_Independence_Palace), [thiết bị thông tin](https://commons.wikimedia.org/wiki/Category:Telecommunications_in_the_Independence_Palace), [UH-1 tại Dinh](https://commons.wikimedia.org/wiki/Category:Bell_UH-1_Iroquois_in_the_Independence_Palace). Danh mục thu thập có 478 ảnh raster đủ kích thước; không phải tất cả đều đúng 5 checkpoint. Có tác giả, thời điểm, URL nguồn và giấy phép theo từng ảnh. Ảnh tải được resize tối đa 1280px, JPEG quality 90; metadata gốc được giữ trong manifest.
4. [Giới thiệu dự án VR360](https://vr360.com.vn/dinh-doc-lap): nguồn bổ sung để đối chiếu; không coi các ảnh quảng bá, video hay giao diện tour là ảnh train đã duyệt.

## Chạy lại

Tại repo root, dùng Python từ môi trường YOLO đã cài. Thư viện bổ sung được ghi trong `scripts/requirements-vision-data.txt`.

```powershell
.\.venv-yolo\Scripts\python.exe scripts/collect-palace-images.py --limit 240
.\.venv-yolo\Scripts\python.exe scripts/collect-palace-official.py
.\.venv-yolo\Scripts\python.exe scripts/review-palace-images.py
```

Thêm `--refresh` vào collector Commons để làm mới danh mục. Collector dùng file đã tải, có retry và lưu manifest trong quá trình chạy. Không chạy hai collector Commons đồng thời. Wikimedia có thể trả 429: chờ và chạy lại sau, không tăng luồng để né giới hạn.

Kết quả local trong `datasets/palace/` (đã ignore Git):

- `commons-catalog.json`: danh mục nguồn; chưa phải nhãn train.
- `download-manifest.json`: ảnh Commons đã thử tải, lỗi và provenance.
- `official-manifest.json`: ảnh bài viết và cảnh tour chưa truy cập được, phân biệt rõ bằng `local_path`/`download_error`.
- `tour-scenes.json`: danh mục cảnh 360 công khai.
- `candidates/`: ảnh tải về; không tự động đẩy sang train.
- `review-*.jpg`, `official-review-*.jpg`: bảng ảnh để kiểm tra trực quan.
- `reviewed-manifest.json`: những ảnh đã có quyết định trong `vision-labels.json`, kèm quyền tái sử dụng và cặp nghi trùng.

Nhãn đã duyệt lưu trong `content/palace/vision-labels.json`, có thể commit. Giữ file manifest nguồn khi sao chép dữ liệu sang máy khác để không mất ghi công và nhóm ảnh.

## Điều kiện trước khi train và báo độ chính xác

Lượt tải đầu đã hoàn tất: 240 ảnh Commons + 27 ảnh bài chính thức (267 file ảnh đọc được). Có 78 ảnh được chọn sau khi xem bảng ảnh và đối chiếu checkpoint; đây là số ảnh trước khi lọc quyền tái sử dụng và kiểm tra cặp gần trùng:

| Nhãn | Đã duyệt | Trong đó metadata có giấy phép mở |
|---|---:|---:|
| `facade` | 13 | 8 |
| `reception` | 6 | 4 |
| `cabinet` | 11 | 10 |
| `rooftop` | 19 | 17 |
| `bunker` | 3 | 2 |
| `other` | 26 | 24 |

Phát hiện một cặp gần trùng giữa `commons-124574365` và `commons-124574379`, cùng tác giả nên đã cùng nhóm. Các ảnh chờ duyệt không được coi là dữ liệu có nhãn. Khánh tiết và phòng thông tin đang quá ít ảnh độc lập để chia ba tập và đánh giá đáng tin cậy; cần thêm dữ liệu. Không nhân bản/augmentation để giả tăng số ảnh độc lập.

- Kiểm tra ảnh ở kích thước lớn khi bảng thumbnail chưa rõ; bỏ ảnh chỉ có biển tên, trần, sàn, ảnh lịch sử và ảnh không đủ dấu hiệu nhận biết.
- `open_license` chỉ là sàng lọc metadata. Giữ tác giả, URL giấy phép, thay đổi đã thực hiện; đọc điều kiện cụ thể trước khi phát hành dataset. Ảnh chính thức chưa xác minh quyền được giữ riêng khỏi tập có giấy phép mở.
- Dò cả ảnh trùng và gần trùng giữa các nguồn; ảnh app có thể lấy lại từ bài chính thức. SHA256 chỉ tìm trùng pixels, dHash chỉ gợi ý gần trùng, không thay thế kiểm tra bằng mắt.
- Giữ ảnh cùng tác giả/buổi chụp ở cùng một tập. Script đang gom bảo thủ toàn bộ ảnh cùng tác giả Commons; liên kết thêm nhóm giữa các nguồn khi phát hiện ảnh gần trùng. Tất cả crop/augmentation/cube face của cùng panorama không được tách tập; nếu nhiều panorama cùng buổi cũng cần cùng nhóm.
- Chỉ chia train/val/test khi mỗi class có đủ nhóm độc lập. Không chia ngẫu nhiên từng file để có điểm cao giả. Bản thử v1 chỉ chia train/val vì chưa đủ ảnh cho test độc lập.
- Kiểm tra riêng từng checkpoint, confusion matrix, macro-F1, recall và tỷ lệ mở khóa nhầm trên ảnh ngoài danh mục. Điểm confidence không phải xác suất đã được hiệu chuẩn.
- Bổ sung ảnh điện thoại từ một buổi chụp khác làm test cuối. Bộ ảnh web/360 đơn thuần chưa chứng minh độ chính xác khi khách dùng thực tế.

## Train thử v1 trên RTX 3060

Thêm 6 ảnh phòng khác đã kiểm tra bằng mắt, thuộc nhiều tác giả, để nhóm `other` không chỉ có ảnh của một người. Sau lọc trạng thái giấy phép mở, có 65 ảnh: 51 train + 14 validation. Mỗi lớp có mặt ở cả hai tập; tác giả được tách hoàn toàn. Cặp gần trùng được nối nhóm trước khi chia.

Chỉ có 2 ảnh `bunker` đủ điều kiện, nên train/validation mỗi bên 1 ảnh; đây là hạn chế rất lớn. Validation được dùng để chọn epoch tốt nhất, không phải test độc lập. Không dùng điểm validation để tuyên bố độ chính xác thực tế.

```powershell
.\.venv-yolo\Scripts\python.exe scripts/review-palace-images.py
.\.venv-yolo\Scripts\python.exe scripts/train-palace-vision.py --prepare-only
.\.venv-yolo\Scripts\python.exe scripts/train-palace-vision.py
```

Script dùng YOLO26s-cls pretrained, GPU 0, seed 2026, tối đa 60 epoch, early stopping patience 20, batch 8, AdamW, freeze 8 lớp đầu, dropout 0.2 và workers 0 cho Windows. Không tự tải package mới hoặc đổi driver. Dataset được tạo trong thư mục có fingerprint, file nguồn không bị sửa.

Môi trường đã chạy: Python 3.11.6, Ultralytics 8.4.215, PyTorch 2.11.0+cu128. Trên máy NVIDIA khác, cài PyTorch CUDA trước rồi cài requirements (cần driver tương thích):

```powershell
.\.venv-yolo\Scripts\python.exe -m pip install torch==2.11.0 torchvision==0.26.0 --index-url https://download.pytorch.org/whl/cu128
.\.venv-yolo\Scripts\python.exe -m pip install -r scripts/requirements-vision-training.txt
```

Model tốt nhất được chọn theo **top-1 accuracy** (nhãn đứng đầu), phù hợp với cách nhận diện checkpoint.

Preprocessing: RGB, resize **toàn bộ ảnh thành 320×320**, tensor [0,1]. Có thay đổi tỷ lệ khung hình nhưng không crop mất đồ vật hoặc kiến trúc. Train thêm ColorJitter nhẹ; validation/predict dùng cùng phép resize đã lưu trong checkpoint. Không tạo thêm các bản crop để giả tăng số ảnh độc lập.

Kết quả local: `output/yolo/palace-v1-top1/weights/best.pt`, `results.csv`, confusion matrix và `palace-evaluation.json`. Chạy lại cùng tên sẽ được Ultralytics tự thêm hậu tố để giữ kết quả cũ; xem đường dẫn script in ra.

Lần chạy đã hoàn tất trên RTX 3060: dừng sớm sau 25 epoch, epoch tốt nhất 5. File model nạp lại và đánh giá được: đúng 12/14 ảnh validation (85,7%), macro-F1 0,6333. Đây là validation dùng chọn model, không phải độ chính xác test độc lập; có lớp chỉ có một ảnh validation. Báo cáo JSON chi tiết được lưu tại `content/palace/vision-training-report.json` để có thể commit mà không cần đưa trọng số lên GitHub.

Thử model sau khi train:

```powershell
.\.venv-yolo\Scripts\yolo.exe classify predict model=output/yolo/palace-v1-top1/weights/best.pt source=public/images/palace/rooftop.webp imgsz=320 device=0
```

Luôn truyền `imgsz=320` để dùng đúng preprocessing đã lưu, kể cả khi triển khai API. Ảnh mẫu app có thể trùng nguồn dataset, nên lệnh này chỉ kiểm tra model nạp được và trả đúng bộ nhãn; không phải bằng chứng về độ chính xác. Confidence chưa được hiệu chuẩn, chưa đặt ngưỡng mở khóa và chưa bật YOLO trong gameplay.

Nên commit `.gitignore`, các script Python, file requirements, danh sách nhãn và tài liệu/báo cáo. Không commit `.venv-yolo`, `datasets`, `runs`, `output/yolo` hoặc file trọng số `.pt` hiện tại. Khi triển khai server, cần chuyển `best.pt` riêng và giữ manifest dataset để tái lập/ghi công nguồn.

## Bổ sung ảnh chụp màn hình tour 360

Ngày 19/11/2026, mở tour chính thức bằng Chromium cho thấy cảnh được render bình thường, dù các URL ảnh cube thử trực tiếp trước đó trả 403. Đã chụp **42 ảnh màn hình** từ 14 panorama qua giao diện trình duyệt, không tải lại tài nguyên bị chặn. Chụp vùng trung tâm 1280×640 để tránh thanh menu và dải thumbnail; không tạo nội dung bằng AI.

Sau kiểm tra trực quan, **27 ảnh được duyệt**: 6 mặt tiền, 9 Khánh tiết, 3 Nội các và 9 phòng khác. Loại 15 ảnh chỉ thấy rèm/sân khấu, hành lang hoặc góc chưa chắc đúng checkpoint; không tin nhãn chỉ dựa vào tên scene. Quyết định kèm SHA256 chính xác của file nằm trong `tour-screenshot-review.json`; chụp lại ra nội dung khác phải duyệt lại, không tự dùng nhãn cũ.

Tất cả screenshot có `split_group=official-tour-session`, chỉ vào **train**, không chia các góc cùng panorama sang validation. Metadata và ảnh nằm ở `datasets/palace/tour-screenshot-manifest.json`, `reviewed-tour-manifest.json`, `candidates/tour-screenshots/`; bảng ảnh ở `tour-review-*.jpg`. Chưa xác minh giấy phép mở, nên dữ liệu này được đánh dấu riêng cho thử nghiệm local, không mặc định phát hành lại.

Chạy lại capture bằng Playwright đã cài trên máy:

```powershell
node scripts/capture-palace-tour.cjs --playwright-package <duong-dan-toi-package-playwright>
.\.venv-yolo\Scripts\python.exe scripts/review-palace-tour.py
.\.venv-yolo\Scripts\python.exe scripts/train-palace-vision.py --include-tour-screenshots --name palace-v2-tour
```

Nếu `playwright` có sẵn trong Node module resolution thì bỏ tham số `--playwright-package`. Script capture không tự cài thư viện hay browser. Lượt thực hiện dùng package/browser có sẵn trên máy; không thêm dependency cho app Next.js.

Bản v2 có **78 ảnh train + cùng 14 ảnh validation của v1**. Bộ val Commons được giữ nguyên trước khi thêm screenshot, không có ảnh tour ở val và có kiểm tra hash gần trùng giữa hai nguồn. Có thêm góc nhìn nhưng không thể coi 27 screenshot là 27 bối cảnh độc lập. Chưa có ảnh tour bổ sung cho sân thượng hay phòng thông tin dưới hầm.

Kết quả v2 lưu riêng ở `output/yolo/palace-v2-tour/`; v1 vẫn được giữ. Báo cáo v2 được ghi riêng vào `vision-tour-training-report.json`. Validation đã dùng chọn epoch và đã được quan sát qua nhiều lần thử; chưa có test độc lập, không suy ra độ chính xác sử dụng thực tế.

Kết quả checkpoint đã nạp lại: **13/14 ảnh validation đúng (92,9%)**, macro-F1 **0,8148**, so với v1 là 12/14 và macro-F1 0,6333 trên cùng 14 ảnh. Chỉ tăng một ảnh dự đoán đúng, chưa đủ bằng chứng kết luận cải thiện đáng tin cậy ngoài thực tế. Chưa bật model trong gameplay và chưa hiệu chuẩn ngưỡng confidence.

## Dọn file

Đã xóa `runs/` (hai kết quả dự đoán thử có thể tạo lại) và `tsconfig.tsbuildinfo` (cache). Không thấy file giống hệt nhau trong app/components/lib/scripts/tests/public. Giữ `.venv-yolo`, trọng số mô hình, dữ liệu SQLite, ảnh dùng trong app và tài liệu/ảnh kiểm tra trước đó. Không xóa mã nguồn chỉ vì chưa thấy được import ở một vị trí.
