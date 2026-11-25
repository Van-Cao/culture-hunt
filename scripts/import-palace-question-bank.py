"""Build reviewed bilingual questions; preserve the verbatim workbook separately.

Run from any directory. Raw source includes all 30 tasks and five story drafts.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = json.loads((ROOT/'content/palace/question-bank-v2.source.json').read_text(encoding='utf-8'))
rows = {q['row']: q for q in source['questions']}
review = [
    {'sourceId':'xlsx-row-14','status':'needs-verification','reason':'Dates, people and supplied pairs disagree: 24/4 is unmatched; 28/4 is paired with Trần Văn Hương without specifying the event. Needs a complete event-based key.'},
    {'sourceId':'xlsx-row-15','status':'needs-reference','reason':'Painting detail capture needs a credited close-up, calibrated targets and object-specific recognition. A full-room photo cannot verify these details.'},
    {'sourceId':'xlsx-row-18','status':'needs-verification','reason':'The six-seat logic puzzle needs an explicit clockwise diagram and consistent opposite/adjacent relations to uniquely grade answer C.'},
    {'sourceId':'xlsx-row-36','status':'needs-recognition','reason':'A radio photograph is supplied, but the current classifier identifies checkpoint rooms rather than individual radios. Do not claim automatic object verification.'},
]
entries=[]
def add(row, en, options, explanation, hint='Look carefully at the clues and try again.', **updates):
    raw=rows[row]
    vi_options=[o.strip() for o in re.findall(r'^[A-D]\.\s*(.*?)(?=^[A-D]\.\s*|\Z)',raw['options'] or '',re.M|re.S)]
    key=raw['answer']
    entry={'id':f"{raw['checkpointId']}-xlsx-{row}",'sourceId':raw['id'],'bankVersion':source['version'],
      'checkpointId':raw['checkpointId'],'kind':'single','question':{'vi':raw['question'].strip(),'en':en},
      'answers':{'vi':vi_options,'en':options.split('|') if options else []},
      'correct':'ABCD'.index(key) if key in ['A','B','C','D'] else -1,
      'hint':{'vi':(raw['failure'] or 'Quan sát kỹ rồi thử lại nhé.').strip(),'en':hint},
      'explanation':{'vi':(raw['success'] or 'Chính xác!').strip(),'en':explanation}}
    for name,value in updates.items():
        if name.endswith('_vi'): entry[name[:-3]]['vi']=value
        else: entry[name]=value
    entries.append(entry)

add(3,'Which Chinese characters are incorporated into the Palace façade? Select every correct character.',
 'Khẩu (口)|Trung (中)|Tam (三)|Vương (王)|Chủ (主)|Hưng (興)|Cát (吉)|An (安)',
 'The façade incorporates Khẩu, Trung, Tam, Vương, Chủ and Hưng. Cát describes the overall plan rather than the façade.',
 'Distinguish the front elevation from the overall ground plan.',kind='multi',solution=[0,1,2,3,4,5],
 answers_vi=['Khẩu (口)','Trung (中)','Tam (三)','Vương (王)','Chủ (主)','Hưng (興)','Cát (吉)','An (安)'])
add(4,'What material forms the bamboo-shaped screen elements, and approximately how much does each weigh?',
 'Solid ironwood, about 150 kg|Moulded concrete, about 400 kg|Hollow aluminium alloy, about 50 kg|Solid granite, about 800 kg',
 'The supplied bank identifies moulded concrete elements weighing about 400 kg each, despite their delicate appearance.',
 'A light-looking architectural form need not be made from a light material.')
add(5,'Beyond opening up the view, what role does the landscaped space in front of the Palace play?',
 'Admitting air and light while softening the monumental building|Providing an emergency helicopter runway|Completely concealing the basement|Separating a civilian housing zone',
 'The lawn, water and open space soften the scale of the building and create a transition into it.',
 'Think about air, greenery and the visitor’s sense of scale.',explanation_vi=rows[5]['success'].replace('củ khối','của khối'))
add(6,'Arrange these milestones from earliest to latest.',
 'Construction of Norodom Palace begins|The new Palace is inaugurated|The old Palace is damaged in the 1962 bombing|Tanks enter on 30 April 1975|The late-1975 political consultative conference|The heritage site opens to visitors',
 'The sequence runs from the Norodom era through 1962, the 1966 inauguration, April 1975, the consultative conference and heritage visits.',
 'Separate events before April 1975 from those afterwards.',kind='order',solution=[0,2,1,3,4,5],
 question_vi='Sắp xếp các mốc sau từ sớm đến muộn.',
 answers_vi=['Khởi công Dinh Norodom','Khánh thành Dinh mới theo thiết kế Ngô Viết Thụ','Cuộc ném bom làm hư hại Dinh cũ năm 1962','Xe tăng tiến vào Dinh ngày 30/4/1975','Hội nghị Hiệp thương thống nhất cuối năm 1975','Mở cửa đón khách tham quan di sản'],
 explanation_vi='Bạn vừa nối lại hành trình: Dinh Norodom → biến cố năm 1962 → khánh thành Dinh mới năm 1966 → ngày 30/4/1975 → Hội nghị Hiệp thương → mở cửa tham quan.')
add(7,'Complete the clues: on which date did tank 390 break through the Palace’s main gate?',
 '30/4/1975|390|19/5/1975|101',
 'On 30 April 1975, tank 390 broke through the main gate. Tank 843 is associated with the side gate.',
 'Match the date and tank number; distinguish the main and side gates.',kind='match',solution=[0,1],
 prompts={'vi':['Ngày diễn ra sự kiện','Số hiệu xe tăng húc cổng chính'],'en':['Date of the event','Tank that broke through the main gate']},
 question_vi='Điền hai mảnh thông tin: trưa ngày nào, xe tăng số hiệu bao nhiêu đã húc đổ cổng chính Dinh Độc Lập?',
 answers_vi=['30/4/1975','390','19/5/1975','101'],
 explanation_vi='Chính xác! Ngày 30/4/1975, xe tăng 390 húc đổ cổng chính. Xe tăng 843 gắn với cổng phụ; đừng nhầm hai chi tiết này nhé.')
add(8,'Match each milestone or name with its meaning.',
 'The political conference preparing state reunification|The name associated with the site’s post-1975 role|The historic transition on 30 April 1975',
 'The events and the site’s later name describe different layers of its history.',
 'Distinguish the April transition, the conference and the later name.',kind='match',solution=[2,0,1],
 prompts={'vi':['Trưa 30/4/1975','Hội nghị Hiệp thương thống nhất cuối năm 1975','Danh xưng Hội trường Thống Nhất'],'en':['Midday, 30 April 1975','The late-1975 consultative conference','The name Reunification Hall']},
 question_vi='Ghép mỗi dấu mốc hoặc danh xưng với ý nghĩa tương ứng.',
 answers_vi=['Hội nghị chính trị đặt nền móng cho thống nhất về mặt nhà nước','Tên gọi gắn với vai trò và các sự kiện sau năm 1975','Bước ngoặt lịch sử ngày 30/4/1975'])
add(10,'Which description best captures the Reception Hall’s formal spatial arrangement?',
 'A balanced ceremonial axis with warm colours and cultural details|Asymmetrical clusters like an informal tea room|All light concentrated on a stage in one corner|No local art or cultural details',
 'A balanced arrangement and a strong visual axis give the room its formal character.',
 'Compare symmetry, lighting and decorative details in the reference image.',
 question_vi='Quan sát Phòng Khánh tiết: cách mô tả nào phù hợp nhất với bố cục bàn ghế, ánh sáng và điểm nhấn thị giác của không gian này?')
add(11,'Put these stages of an illustrative ceremony in order.',
 'The formal ceremony and speeches take place|The delegation enters the space|The event concludes|The arrangement establishes a formal atmosphere',
 'Entry precedes experiencing the setting, the formal proceedings and the conclusion. This is illustrative, not a historical protocol.',
 'Start with arrival and finish with the conclusion.',kind='order',solution=[1,3,0,2],
 question_vi='Sắp xếp các bước trong tình huống nghi lễ minh họa tại Phòng Khánh tiết.',
 answers_vi=re.findall(r'^\d\.\s*(.*)',rows[11]['question'],re.M),
 explanation_vi='Đúng thứ tự: tiến vào → cảm nhận sắc thái bài trí → thực hiện nghi thức → khép lại. Đây là tình huống minh họa trong game, không phải quy trình nghi lễ lịch sử được tái dựng.',
 hint_vi='Phân biệt bước tiến vào không gian, cảm nhận bài trí, phần nghi thức chính và thời điểm kết thúc.')
add(12,'According to the supplied bank, what are the dimensions of the painting “Việt Nam Quốc Tổ”?',
 '540 × 234 × 5 cm|420 × 180 × 3 cm|600 × 250 × 10 cm|320 × 140 × 5 cm',
 'The supplied bank records 540 × 234 × 5 cm.',
 'Compare the width, height and thickness in each option.',
 question_vi='Theo ngân hàng câu hỏi, bức tranh “Việt Nam Quốc Tổ” tại Phòng Khánh tiết có kích thước bao nhiêu?',
 explanation_vi='Chính xác! Kích thước ghi trong ngân hàng câu hỏi là 540 × 234 × 5 cm.')
add(13,'In this calculation, a room is 32 m long. Its width is half its length minus 2 m. What is its area?',
 '448 m²|480 m²|384 m²|512 m²',
 'Width = 32 ÷ 2 − 2 = 14 m. Area = 32 × 14 = 448 m². This is an exercise, not a room survey.',
 'Find the width before multiplying by the length.',
 question_vi='Bài toán minh họa: một căn phòng dài 32 m, rộng bằng một nửa chiều dài trừ 2 m. Diện tích là bao nhiêu?',
 explanation_vi='Rộng = 32 ÷ 2 − 2 = 14 m. Diện tích = 32 × 14 = 448 m². Đây là bài toán theo dữ kiện cho sẵn, không phải kết quả đo đạc căn phòng.')
add(17,'According to this checkpoint’s question bank, how many fixed microphones are on the Cabinet Room table?','',
 'The supplied answer is 10 microphones. This does not imply one microphone for every chair.',
 'Count microphones separately from seats.',kind='number',solution='10',
 question_vi='Theo câu hỏi quan sát của trạm Nội các, trên bàn có bao nhiêu chiếc micro cố định?',
 explanation_vi='Đáp án của ngân hàng là 10 micro. Hãy phân biệt số micro với số ghế quanh bàn.')
add(19,'In a formal meeting room, what does the seating arrangement usually reflect?',
 'Roles, hierarchy and the organisation of discussion|Participants’ height and weight|Alphabetical order of ministry names|Years spent working in the building',
 'Seating conventions can help establish roles and organise discussion.',
 'Think about the chairperson and the participants.')
add(20,'According to the bank, how many seats surround the oval table, and what was the intended benefit?',
 '36 seats — understanding among participants|24 seats — separating civilian and military groups|48 seats — including press observers|12 seats — permanent members only',
 'The bank identifies 36 seats and an intention to support understanding among participants.',
 'Distinguish the chair count from the microphone count.')
add(21,'Beyond cabinet and ministerial council meetings, what other function did this room serve before 1975?',
 'New cabinet presentations and important meetings chaired by the President|Diplomatic credential ceremonies|Storage of all classified military maps|The permanent residence of the President’s family',
 'It also hosted cabinet presentations and other important meetings chaired by the President.',
 'Look for a function related to meetings rather than residence or storage.')
add(22,'According to the bank, when was Vũ Văn Mẫu’s cabinet due to meet the President on 30 April 1975, and what broadcast coincided with it?',
 '10 a.m. — a broadcast appeal by Dương Văn Minh|8 a.m. — a new defence plan|10 a.m. — the building handover|Noon — the first cabinet meeting ended',
 'The bank links the planned 10 a.m. presentation with a broadcast appeal. Distinguish this from the later unconditional surrender announcement.',
 'Focus on the scheduled presentation, not later events around midday.',
 question_vi='Theo ngân hàng câu hỏi, Nội các của Vũ Văn Mẫu dự định trình diện lúc mấy giờ sáng 30/4/1975, gắn với một lời kêu gọi được phát trên đài?',
 answers_vi=['10 giờ sáng — gắn với lời kêu gọi trên đài của Dương Văn Minh','8 giờ sáng — thông qua kế hoạch phòng thủ mới','10 giờ sáng — bàn giao tòa nhà cho chính quyền mới','12 giờ trưa — kết thúc phiên họp đầu tiên'],
 explanation_vi='Ngân hàng ghi mốc dự định trình diện là 10 giờ sáng, gắn với một lời kêu gọi trên đài. Cần phân biệt mốc này với lời tuyên bố đầu hàng vô điều kiện sau đó.')
add(23,'According to the bank, when were cabinet meetings usually held?',
 'Monday morning|Wednesday morning|Friday afternoon|Sunday morning',
 'The supplied answer is Wednesday morning.', 'The answer is a weekday morning.',
 question_vi='Theo ngân hàng câu hỏi, các cuộc họp Nội các thường được tổ chức vào thời điểm nào?',
 explanation_vi='Theo đáp án được cung cấp, các cuộc họp diễn ra vào sáng thứ Tư hằng tuần.')
add(24,'Who headed the final cabinet of the Republic of Vietnam, formed in late April 1975?',
 'Trần Thiện Khiêm|Vũ Văn Mẫu|Nguyễn Cao Kỳ|Trần Văn Hương',
 'Vũ Văn Mẫu headed the final cabinet, formed in the closing days of April 1975.',
 'His name also appears in the question about the planned presentation.',correct=1)
add(26,'Who carried out the air raid on the Palace on 8 April 1975?',
 'Nguyễn Văn Thiệu|Nguyễn Thành Trung|Dương Văn Minh|Trần Thiện Khiêm',
 'Pilot Nguyễn Thành Trung carried out the raid in an F-5E. The displayed UH-1 is a different aircraft.',
 'Distinguish the pilot from the political figures.',question_vi=rows[26]['question'].replace('ngày dưới nền','ngay dưới nền'))
add(27,'What helicopter is displayed on the rooftop, and what role does the bank associate with it?',
 'UH-1 — presidential transport|A jet fighter launching from the rooftop|A tourist helicopter operating since 1954|A large transport aircraft from the Norodom era',
 'The rooftop displays a UH-1, associated in the bank with presidential transport.',
 'It is a helicopter, not the F-5E used in the air raid.')
add(28,'In the initial plan described by the bank, how many bombs were intended specifically for the Palace?','',
 'The bank distinguishes the initial allocation of two bombs for the Palace from four eventually dropped there.',
 'Distinguish the initial allocation from the total carried or dropped.',kind='number',solution='2',
 question_vi='Theo kế hoạch ban đầu được mô tả trong ngân hàng câu hỏi, có bao nhiêu quả bom dự định dành riêng để tấn công Dinh?',
 hint_vi='Phân biệt số dự định dành riêng cho Dinh với tổng số mang theo hoặc thực tế đã thả.',
 explanation_vi='Theo nội dung nhóm cung cấp: kế hoạch ban đầu dành 2 quả cho Dinh; phần giải thích phân biệt với tổng 4 quả được thả sau đó.')
add(29,'Arrange the stages of the 8 April 1975 air raid in order.',
 'Nguyễn Thành Trung approaches in an F-5E|Bombs are released over the Palace|Explosions damage the building|The pilot flies to the liberated area',
 'The sequence moves from approach to release, impact and departure.',
 'Separate the approach, the release, the effect and the departure.',kind='order',solution=[0,1,2,3],
 question_vi='Sắp xếp diễn biến cuộc không kích ngày 8/4/1975.',
 answers_vi=['Nguyễn Thành Trung điều khiển F-5E thực hiện cuộc không kích','Bom được thả xuống Dinh','Một số quả bom phát nổ, gây hư hại công trình','Nguyễn Thành Trung bay về vùng giải phóng'])
add(30,'Which aircraft is displayed on the Palace rooftop?', 'F-5E Tiger II|UH-1 Huey|MiG-21|B-52',
 'The exhibit is a UH-1 Huey, distinct from the F-5E involved in the raid.', 'Observe the main rotor and landing skids.')
add(31,'What historical role is associated with the rooftop UH-1 in the bank?',
 'It conducted the 8 April air raid|Presidential transport and evacuation planning|Weapons transport on 30 April|A fighter defending the Palace',
 'The bank connects the UH-1 and landing area with presidential transport and evacuation planning.',
 'Distinguish a transport helicopter from the F-5E jet.',
 hint_vi='Phân biệt vai trò di chuyển của trực thăng UH-1 với cuộc không kích do máy bay F-5E thực hiện.')
add(33,'What is the clearest difference between the rooftop and the bunker?',
 'An enclosed, protected command and communications space rather than an open rooftop|A sunlit backup helicopter pad|A diplomatic reception room with balconies|A scrap-storage room without ventilation',
 'The contrast is between an open rooftop and enclosed space for protection, command and communications.',
 'Compare openness and protection, then consider the equipment.')
add(34,'What was the bunker primarily designed to support?',
 'Secret diplomatic receptions|Command, communications and military situation monitoring|A historical archive|Private presidential family life',
 'It supported command, communications and monitoring in a protected setting.', 'Think about command work and communications.')
add(35,'Which equipment belongs to the bunker’s historical communications setting?',
 'Military telephones and radio equipment|Fax machines and laser printers|Personal computers and the Internet|Smartphones and GPS devices',
 'Military telephones and radios fit this setting. The interrupted connection is a fictional game scenario.',
 'Choose equipment appropriate to the period and exhibit.',
 hint_vi='Đối chiếu bối cảnh và thiết bị trưng bày: chọn điện thoại quân sự, vô tuyến điện thay vì các phương án gây nhiễu.',
 explanation_vi='Đúng rồi: điện thoại quân sự và máy vô tuyến điện. Đường truyền gián đoạn là tình huống minh họa trong game, không phải một sự kiện được xác nhận tại thời điểm cụ thể.')

notes={
 'xlsx-row-6':'The seven-event source has a six-item answer key. Omitted the undated naming event from the playable adaptation; the source retains all seven.',
 'xlsx-row-7':'Corrected side gate to main gate, retaining 390; corroborated by the official Palace historical introduction.',
 'xlsx-row-10':'Removed diplomatic-credentials premise to avoid confusing the Reception Hall and the separate Credentials Room.',
 'xlsx-row-11':'Repaired shifted success/failure cells; clearly labelled an illustrative sequence rather than historical protocol.',
 'xlsx-row-13':'Calculation is illustrative, not authentication of physical room dimensions.',
 'xlsx-row-22':'Distinguished the 10 a.m. appeal in the bank from the later unconditional surrender announcement.',
 'xlsx-row-24':'Recovered answer B from the explicit success script; raw answer cell remains empty.',
 'xlsx-row-28':'Clarified initial allocation specifically for the Palace versus total bombs.',
 'xlsx-row-31':'Removed the incorrect implication that Nguyễn Văn Thiệu was the last President.',
 'xlsx-row-35':'Removed blanket technology-date claims and labelled the interruption scenario illustrative.'}
for entry in entries:
    assert len(entry['answers']['vi'])==len(entry['answers']['en']),entry['id']
    if entry['kind']=='single': assert 0<=entry['correct']<len(entry['answers']['vi']),entry['id']
    else: assert 'solution' in entry,entry['id']
assert len(entries)+len(review)==len(source['questions'])
bank={'version':source['version'],'source':source['source'],'questions':entries,'review':review,'editorialNotes':notes}
(ROOT/'content/palace/question-bank-v2.json').write_text(json.dumps(bank,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Published:',len(entries),'Review:',len(review))
print({id:sum(q['checkpointId']==id for q in entries) for id in ['facade','reception','cabinet','rooftop','bunker']})
