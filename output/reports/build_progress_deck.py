from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from PIL import Image

OUT = Path(__file__).resolve().parent
IMAGES = OUT.parent / 'playwright'
prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
BG, INK, MUTED = 'F7F5EC', '183F35', '58695C'
PALE, GOLD, WHITE, LINE, RED = 'E8ECDD', 'A17B38', 'FFFFFF', 'D9DECE', '8B5245'

def rect(s, x, y, w, h, fill, line=None, radius=False):
    shape = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid(); shape.fill.fore_color.rgb = RGBColor.from_string(fill)
    if line:
        shape.line.color.rgb = RGBColor.from_string(line)
    else:
        shape.line.fill.background()
    if radius:
        shape.adjustments[0] = .12
    return shape

def txt(s, x, y, w, h, text, size=18, color=INK, bold=False, font='Arial', align=None):
    box = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame; tf.clear(); tf.word_wrap = True
    tf.margin_left = tf.margin_right = Inches(.015)
    tf.margin_top = tf.margin_bottom = 0
    for n, line in enumerate(text.split('\n')):
        p = tf.paragraphs[0] if n == 0 else tf.add_paragraph()
        p.text = line
        p.font.name = font; p.font.size = Pt(size); p.font.bold = bold
        p.font.color.rgb = RGBColor.from_string(color)
        p.space_after = Pt(5)
        if align is not None: p.alignment = align
    return box

def base(section, index, title, subtitle=None):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    s.background.fill.solid(); s.background.fill.fore_color.rgb = RGBColor.from_string(BG)
    rect(s, .52, .38, .12, .17, GOLD)
    txt(s, .75, .32, 10, .3, 'CULTURE HUNT   /   PROGRESS 1   /   ' + section.upper(), 11, MUTED, True)
    txt(s, .58, .84, 12.2, .65, title, 29, INK, True)
    if subtitle: txt(s, .6, 1.49, 12.1, .42, subtitle, 14, MUTED)
    rect(s, .6, 7.04, 12.1, .012, LINE)
    txt(s, .6, 7.15, 11.2, .2, 'Dinh Độc Lập demo  •  Đối chiếu dự án & kiểm thử: 12.11.2026', 9, MUTED)
    txt(s, 12.1, 7.12, .58, .25, f'{index:02d}', 11, MUTED, align=PP_ALIGN.RIGHT)
    return s

def picture_fit(s, path, x, y, w, h):
    with Image.open(path) as im: iw, ih = im.size
    scale = min(w/iw, h/ih)
    pw, ph = iw*scale, ih*scale
    s.shapes.add_picture(str(path), Inches(x+(w-pw)/2), Inches(y+(h-ph)/2), width=Inches(pw), height=Inches(ph))

def notes(s, content):
    s.notes_slide.notes_text_frame.text = content

# 01 — a playable demo, with honest overall status.
s = base('Current work', 1, 'Đã có một hành trình khám phá chơi được.')
txt(s, .6, 1.75, 3.0, 1.35, '≈50%', 76, INK, True)
txt(s, 3.7, 1.98, 4.3, 1.08, 'Mức hoàn thiện toàn dự án\nƯớc lượng của nhóm, cần tiếp tục kiểm chứng.', 18, MUTED)
rect(s, .65, 3.13, 7.55, .1, LINE)
rect(s, .65, 3.13, 3.775, .1, GOLD)
txt(s, .65, 3.53, 7.55, .35, 'LUỒNG CỐT LÕI ĐÃ TRIỂN KHAI', 11, MUTED, True)
for i, (label, title) in enumerate([('01', 'Nhận diện ảnh địa điểm'), ('02', 'Hoàn thành mini game'), ('03', 'Mở câu chuyện bằng chữ + audio')]):
    yy = 4.00 + i*.5
    txt(s, .65, yy, .5, .32, label, 15, GOLD, True)
    txt(s, 1.18, yy, 6.9, .34, title, 19)
for i, (number, caption) in enumerate([('5', 'checkpoint tại Dinh'), ('4', 'dạng mini game'), ('10', 'audio VI / EN')]):
    xx = .65+i*2.55
    rect(s, xx, 5.72, 2.38, .92, PALE, radius=True)
    txt(s, xx+.15, 5.8, .65, .55, number, 31, INK, True)
    txt(s, xx+.87, 5.94, 1.34, .55, caption, 12, MUTED)
rect(s, 8.75, 1.65, 3.95, 5.15, WHITE, LINE, True)
picture_fit(s, IMAGES/'palace-rooms-final-board.png', 8.87, 1.76, 3.71, 4.82)
txt(s, 8.95, 6.61, 3.5, .18, 'Sa bàn minh họa • không phải sơ đồ đo đạc', 8, MUTED)
notes(s, 'Bản demo đạt khoảng 50% theo nhận định của nhóm, không phải 50% độ chính xác AI. Năm checkpoint: Mặt tiền Dinh, Phòng Khánh tiết, Phòng Nội các, Trực thăng trên mái, Thông tin dưới hầm. Bốn dạng tương tác: tìm chi tiết, ghép ảnh (hai điểm), ghép vật thể và nối mạch. Có SQLite lưu lượt chơi và kiểm tra tiến trình phía máy chủ. Chế độ ảnh mẫu và đối chiếu ảnh tham chiếu đã có; không trình bày thành mô hình AI đã được train. Sa bàn dùng ảnh screenshot demo có sẵn. Xem slide 6 để giải thích cách ước lượng tiến độ.')

# 02 — evidence, actual screenshots.
s = base('Current work / Minh chứng', 2, 'Từ tương tác đến câu chuyện và dấu ấn.', 'Ảnh chụp bản demo có sẵn trong dự án; chưa phải kết quả thử nghiệm với khách tham quan.')
cards = [
    ('minigame-facade-desktop.png', '01  MINI GAME', 'Tìm chi tiết trên ảnh', 'Có mục tiêu, gợi ý và lưu thao tác;\nkhông chỉ trả lời trắc nghiệm.'),
    ('minigame-story-desktop.png', '02  STORY + AUDIO', 'Mở nội dung sau khi chơi', 'Văn bản VI/EN và MP3 ngắn;\ncó transcript, phát lại và đổi tốc độ.'),
    ('atlas-zoom-reset-1440.png', '03  DẤU ẤN', 'Bản đồ số nhiều cấp', 'TP.HCM → địa điểm → checkpoint;\ncó nhật ký, huy hiệu, ảnh chia sẻ.'),
]
for i, (name, tag, title, caption) in enumerate(cards):
    xx = .6 + i*4.15
    rect(s, xx, 2.03, 3.83, 3.65, WHITE, LINE, True)
    picture_fit(s, IMAGES/name, xx+.1, 2.13, 3.63, 3.45)
    txt(s, xx, 5.92, 3.8, .24, tag, 10, GOLD, True)
    txt(s, xx, 6.23, 3.82, .3, title, 18, INK, True)
    txt(s, xx, 6.61, 3.85, .37, caption.replace('\n', ' '), 11, MUTED)
notes(s, 'Minh chứng: output/playwright/minigame-facade-desktop.png; minigame-story-desktop.png; atlas-zoom-reset-1440.png. Các ảnh được chụp ở các phiên demo khác nhau, không dùng để so sánh trước/sau hoặc tính tỷ lệ hoàn thành người dùng. Ảnh story có một chi tiết nút ngôn ngữ đã được chỉnh bố cục sau đó. Dấu ấn có mốc Dinh và ĐH KHTN; gameplay hoàn chỉnh hơn tập trung ở Dinh. Không nói ĐH KHTN đã có cùng mức hoàn thiện. Có xuất ảnh thành tích để tải/chia sẻ, chưa phải nền tảng mạng xã hội.')

# 03 — balanced appraisal.
s = base('Current work / Đánh giá', 3, 'Điểm mạnh đã rõ, phần nền tảng còn thiếu.', 'Có thể trình diễn xuyên suốt; độ tin cậy thực tế và hiệu quả học tập vẫn cần được đánh giá.')
xs = [.6, 2.75, 7.36]
ws = [2.15, 4.61, 5.34]
for x,w in zip(xs,ws): rect(s,x,2.03,w,.43,INK)
for x,w,label in zip(xs,ws,['HẠNG MỤC','ƯU ĐIỂM / ĐÃ CÓ','HẠN CHẾ / CHƯA ĐỦ']): txt(s,x+.13,2.12,w-.22,.23,label,11,WHITE,True)
rows = [
 ('Giao diện / bản đồ','Hành trình 2.5D, bản đồ nhiều cấp;\ncó thiết kế riêng và hai ngôn ngữ.','Chưa kiểm chứng đi thực địa; sa bàn\nkhông thay thế bản đồ chỉ đường.'),
 ('Gameplay','Nhiều dạng mini game; tiến trình và\nXP được kiểm tra ở máy chủ.','Chưa đo độ khó, mức hứng thú và\nkhả năng ghi nhớ sau khi chơi.'),
 ('Tài khoản / dữ liệu','Có SQLite lưu lịch sử; có khung\nđăng nhập Google và chơi khách.','Chưa xác minh đăng nhập thật; lịch sử\nchưa đồng bộ theo tài khoản.'),
 ('Nhận diện ảnh','Có ảnh mẫu, đối chiếu tham chiếu\nvà đường tích hợp dịch vụ AI.','Chưa train riêng; chưa đo trên ảnh\nchụp mới, góc khác và ảnh ngoài phạm vi.'),
 ('Nội dung / audio','5 chuyện song ngữ, 10 MP3;\ncó câu hỏi mở rộng từ ngân hàng.','Cần bối cảnh và kiểm duyệt sâu hơn;\ngiọng VI chưa đồng nhất toàn bộ.'),
 ('Kiểm thử','17/17 bài kiểm thử kỹ thuật đạt\ntrong lần chạy ngày 12/11/2026.','Chưa thay thế đánh giá AI, pilot,\nkiểm thử tải và vận hành thực tế.'),
]
for i,row in enumerate(rows):
    yy=2.46+i*.7
    rect(s,.6,yy,12.1,.7, WHITE if i%2==0 else PALE)
    for col,content in enumerate(row): txt(s,xs[col]+.13,yy+.13,ws[col]-.25,.53,content,14,INK if col<2 else RED,col==0)
notes(s, 'Điểm mạnh lớn nhất là nhóm đã thu gọn phạm vi vào 5 checkpoint tại một địa điểm, tạo được vòng trải nghiệm quan sát–chơi–mở nội dung–ghi nhận dấu ấn. Hạn chế lớn nhất là các giá trị này mới được thể hiện ở mức demo. Tương tác hấp dẫn chưa chứng minh hiệu quả học tập; nhận diện ảnh mẫu không chứng minh nhận diện thực tế. Không nói chưa có database: đã có SQLite. Cần hoàn thiện dữ liệu gắn tài khoản, quyền sở hữu, đồng bộ và vận hành. Nhận diện hiện chưa có số liệu độ chính xác để báo cáo. Audio đang là tài nguyên MP3 sinh sẵn từ nguồn TTS demo, không phải tích hợp dịch vụ trả phí đã vận hành.')

# 04 — prioritized backlog, concrete acceptance.
s = base('Remaining tasks', 4, 'Ưu tiên độ tin cậy trước khi mở rộng địa điểm.', 'P0: cần cho mốc dùng thử tin cậy tiếp theo. P1: cần trước khi đánh giá và bàn giao bản thử nghiệm.')
columns=[(.6,2.85),(3.45,6.9),(10.35,2.35)]
for x,w in columns: rect(s,x,2.05,w,.46,INK)
for (x,w),label in zip(columns,['CÔNG VIỆC','KẾT QUẢ / TIÊU CHÍ NGHIỆM THU ĐỀ XUẤT','CHỦ TRÌ']): txt(s,x+.13,2.17,w-.23,.22,label,10,WHITE,True)
tasks=[
 ('P0  Tài khoản','Đăng nhập thật, gắn lịch sử vào tài khoản; cùng tiến trình\ntrên 2 thiết bị; chuyển từ khách không mất dữ liệu.','Backend\n+ Frontend'),
 ('P0  Dữ liệu','Migration, quyền sở hữu, lưu trữ bền vững, sao lưu/phục hồi;\nkhông cộng trùng XP khi gửi lại yêu cầu.','Backend / Data'),
 ('P0  Nhận diện','Bộ ảnh có nhãn + tập kiểm thử độc lập; đo baseline và lỗi\ntừng điểm; cải tiến hoặc train khi có căn cứ.','AI / Vision'),
 ('P1  Nội dung / game','5 điểm có mục tiêu học tập, nguồn kiểm chứng, giải thích\nđáp án và kịch bản sâu hơn; duyệt VI/EN rồi tạo lại audio.','Content\n+ Gameplay'),
 ('P1  QA / vận hành','Dùng thử quy mô nhỏ; kiểm tra điện thoại, mạng yếu,\ntriển khai và lỗi; ghi nhận mức hiểu sau khi chơi.','QA / UX\n+ cả nhóm'),
]
for i,row in enumerate(tasks):
    yy=2.51+i*.77
    rect(s,.6,yy,12.1,.77,WHITE if i%2==0 else PALE)
    for col,content in enumerate(row):
        x,w=columns[col]; txt(s,x+.13,yy+.15,w-.25,.59,content,14 if col<2 else 12,INK,col==0)
rect(s,.6,6.56,12.1,.31,PALE)
txt(s,.75,6.62,11.8,.2,'AI: đo baseline → phân tích lỗi → cải tiến → đánh giá độc lập. Chốt mục tiêu chất lượng sau khi có baseline.',10,MUTED)
notes(s, 'Phân công trong slide theo vai trò vì chưa có tên thành viên. Trước khi nộp cần điền một người chịu trách nhiệm chính cho mỗi đầu việc. Các yêu cầu tài khoản gồm login/logout, user ID, quyền đọc/sửa và chuyển hồ sơ khách. Database đã tồn tại ở mức demo; không nhất thiết đổi công nghệ nếu chưa có nhu cầu, nhưng phải giải quyết lưu trữ bền vững và sao lưu. AI cần ảnh khác phiên chụp giữa các tập; ảnh biến đổi từ cùng ảnh gốc không được chia sang cả train và test. Có ảnh không thuộc điểm nào để kiểm tra từ chối. Ảnh mạng chỉ khởi đầu; cần ảnh người dùng chụp mới để đánh giá. Chưa có độ chính xác công bố; không đặt số đo giả. Với nội dung, giữ audio chính ngắn và thêm lớp đọc sâu có nguồn. Không diễn giải trò nối mạch thành mô phỏng thiết bị lịch sử chính xác. Mở rộng ĐH KHTN sau khi luồng Dinh ổn định.')

# 05 — schedule and actual ownership placeholders.
s = base('Remaining tasks / Kế hoạch', 5, 'Kế hoạch 4 tuần đề xuất, có người chịu trách nhiệm.', 'Tính từ khi nhóm chốt kế hoạch; chưa phải lịch đã cam kết hoặc hạn cuối dự án.')
weeks=[
 ('01','Chốt nền tảng','Schema + quy tắc tài khoản.\nBộ ảnh, nhãn và baseline.\nMục tiêu học tập + nguồn.','Chủ trì: Backend, AI, Content','Mốc: duyệt phạm vi và\ntiêu chí nghiệm thu.'),
 ('02','Xây phần còn thiếu','Tài khoản ↔ lịch sử ↔ DB.\nThử cải tiến nhận diện.\nViết lại nội dung / game.','Chủ trì: Backend, AI, Frontend','Mốc: đồng bộ 2 thiết bị;\nnội dung chờ rà soát.'),
 ('03','Tích hợp + rà soát','Tích hợp nhận diện đã chọn.\nDuyệt VI/EN, tạo lại audio.\nKiểm thử lỗi, quyền, mobile.','Chủ trì: Frontend, Content, QA','Mốc: bản ứng viên\nsẵn sàng dùng thử.'),
 ('04','Dùng thử + ổn định','Pilot đề xuất: 5–8 người.\nĐo lỗi và mức hiểu nội dung.\nSửa lỗi, triển khai, bàn giao.','Chủ trì: QA; cả nhóm sửa lỗi','Mốc: báo cáo pilot +\nbản demo ổn định.'),
]
for i,(num,title,body,owner,milestone) in enumerate(weeks):
    x=.6+i*3.075
    rect(s,x,2.07,2.87,3.77,WHITE,LINE,True)
    txt(s,x+.16,2.22,2.5,.24,'TUẦN '+num,11,GOLD,True)
    txt(s,x+.16,2.67,2.55,.72,title,20,INK,True)
    txt(s,x+.16,3.42,2.52,1.1,body,14,MUTED)
    txt(s,x+.16,4.6,2.53,.48,owner,11,INK,True)
    rect(s,x+.13,5.17,2.61,.5,PALE,radius=True)
    txt(s,x+.23,5.2,2.4,.46,milestone,11,INK)
txt(s,.63,6.06,12.0,.28,'ĐIỀN TÊN TRƯỚC KHI NỘP  •  Một người có thể kiêm nhiều vai trò.',11,GOLD,True)
txt(s,.63,6.45,12.0,.3,'Frontend: ______    Backend: ______    AI: ______    Content: ______    QA: ______',14,INK)
notes(s, 'Đây là đề xuất bốn tuần, không phải tiến độ đã diễn ra. Không suy ra hạn cuối dự án từ hạn nộp Progress 1. Các vai trò không giả định nhóm có năm người; một người có thể kiêm nhiệm. Cần thay các dấu trống bằng tên thật trước khi nộp để đáp ứng yêu cầu individual responsibilities. Các nhánh Backend, AI và Content tiến hành song song; pilot tài khoản phụ thuộc việc kiểm tra quyền truy cập đạt. Tuần 1: QA chốt kịch bản và tiêu chí. Tuần 2: Content/Gameplay phối hợp làm sâu nội dung. Tuần 3: cả nhóm tích hợp và hồi quy. Tuần 4: mẫu pilot 5–8 người là đề xuất, chỉ cung cấp tín hiệu ban đầu, không chứng minh hiệu quả cho mọi người dùng. Nếu thiếu ảnh thực địa, giữ nhãn ảnh mẫu rõ ràng khi trình diễn và báo cáo giới hạn.')

# 06 — explicit estimation, not a disguised measurement.
s = base('Current work / Cơ sở ước lượng', 6, 'Vì sao giao diện rõ nhưng toàn dự án mới ≈50%?', 'Phân bổ đề xuất để nhóm rà soát; không phải số liệu đo giờ công hay mức chính xác nhận diện.')
cols=[(.6,5.4),(6.0,1.85),(7.85,2.5),(10.35,2.35)]
for x,w in cols: rect(s,x,2.05,w,.46,INK)
labels=['NHÓM CÔNG VIỆC','TRỌNG SỐ','HOÀN THIỆN ƯỚC LƯỢNG','ĐÓNG GÓP TỔNG']
for (x,w),label in zip(cols,labels):txt(s,x+.13,2.17,w-.25,.25,label,9,WHITE,True)
progress=[('Giao diện và bản đồ','20%','80%','16 điểm %'),('Gameplay và quản lý tiến trình','20%','70%','14 điểm %'),('Tài khoản và dữ liệu','20%','30%','6 điểm %'),('Nhận diện ảnh thực tế','20%','25%','5 điểm %'),('Nội dung, câu hỏi và audio','15%','50%','7,5 điểm %'),('Kiểm thử người dùng và vận hành','5%','30%','1,5 điểm %')]
for i,row in enumerate(progress):
    yy=2.51+i*.48
    rect(s,.6,yy,12.1,.48,WHITE if i%2==0 else PALE)
    for (x,w),content in zip(cols,row):txt(s,x+.13,yy+.12,w-.25,.25,content,14,INK)
rect(s,.6,5.39,12.1,.59,INK)
txt(s,.74,5.56,5.1,.25,'TỔNG = Σ (trọng số × mức hoàn thiện)',13,WHITE,True)
txt(s,6.14,5.53,1.6,.3,'100%',18,WHITE,True)
txt(s,10.49,5.49,2.0,.4,'50%',25,WHITE,True)
txt(s,.65,6.23,11.9,.54,'Các tỷ lệ con là ước lượng đề xuất, cần nhóm xác nhận.\n25% tiến độ phần AI không có nghĩa là AI nhận diện đúng 25%.',14,MUTED)
notes(s, 'Bảng dùng để giải thích ước lượng khoảng 50% mà người dùng đã đưa ra; không thể coi đây là đo lường khách quan của dự án. Trọng số: giao diện 20, gameplay 20, tài khoản/dữ liệu 20, nhận diện 20, nội dung 15, QA/vận hành 5. Đóng góp: 16+14+6+5+7,5+1,5=50. Khối lượng được đề xuất dựa trên mức demo và khoảng trống; nhóm cần xác nhận lại theo phạm vi nghiệm thu. Nếu không đồng ý tỷ lệ con, có thể bỏ slide này và giữ mức tổng thể khoảng 50%, đồng thời giải thích bằng các phần còn thiếu ở slide 3. Slide này là phụ lục; đặt sau phần Current work khi ghép vào slide nhóm nếu muốn. Bản phân tích và kế hoạch chi tiết nằm trong Progress-1-Culture-Hunt.md cùng thư mục.')

# Keep the four Current work slides together, followed by the two Remaining tasks slides.
slide_ids = list(prs.slides._sldIdLst)
for node in slide_ids:
    prs.slides._sldIdLst.remove(node)
for original_index in [0, 1, 2, 5, 3, 4]:
    prs.slides._sldIdLst.append(slide_ids[original_index])
for index, slide in enumerate(prs.slides, 1):
    for shape in slide.shapes:
        if shape.has_text_frame and shape.top > Inches(7.1) and shape.left > Inches(12):
            shape.text_frame.paragraphs[0].runs[0].text = f'{index:02d}'
    frame = slide.notes_slide.notes_text_frame
    frame.text = frame.text.replace('Xem slide 6', 'Xem slide 4').replace('Slide này là phụ lục; đặt sau phần Current work khi ghép vào slide nhóm nếu muốn.', 'Bảng này có thể lược bỏ khi nhóm chỉ muốn trình bày tỷ lệ tổng thể cùng các giới hạn.')

prs.core_properties.title = 'Culture Hunt — Progress 1: Current work & Remaining tasks'
prs.core_properties.subject = 'Bản demo Dinh Độc Lập — tiến độ khoảng 50%'
prs.core_properties.author = 'Culture Hunt'
prs.core_properties.keywords = 'Culture Hunt, Progress 1, Dinh Độc Lập, demo, 50%'
target = OUT/'Culture-Hunt-Progress-1.pptx'
prs.save(target)
print(target)
print('Slides:',len(prs.slides))
