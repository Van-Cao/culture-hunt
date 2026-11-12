import type { Locale } from "@/components/UI/LanguageProvider";
import type { Mission } from "@/components/UI/game-data";
import { getCheckpointQuestions, publicQuestion } from "./questions";

export const checkpointIds = [
  "facade",
  "reception",
  "cabinet",
  "rooftop",
  "bunker",
] as const;
export type CheckpointId = (typeof checkpointIds)[number];
export const PALACE_XP = 150;
export const PALACE_SOURCE =
  "https://dinhdoclap.gov.vn/anh-dinh-doc-lap-noi-luu-giu-dau-an-sau-50-nam-giai-phong/";
type Text = { vi: string; en: string };
type Entry = {
  id: CheckpointId;
  name: Text;
  floor: Text;
  clue: Text;
  detail: Text;
  x: number;
  y: number;
  photo: string;
  recognition: string;
  mission: { vi: Mission; en: Mission };
};

const catalog: Entry[] = [
  {
    id: "facade",
    name: { vi: "Mặt tiền Dinh", en: "The Palace façade" },
    floor: { vi: "Ngoại cảnh", en: "Grounds" },
    x: 485,
    y: 630,
    photo: "/images/palace-exterior.webp",
    clue: {
      vi: "Tìm góc nhìn có mặt tiền trắng, thảm cỏ và đài phun nước.",
      en: "Look for the white façade, the lawn, and the fountain.",
    },
    detail: {
      vi: "Một biểu tượng giữa lòng thành phố",
      en: "A landmark at the heart of the city",
    },
    recognition:
      "White modernist Independence Palace, repeated stone screens across horizontal façade, a wide green lawn and circular fountain. Aerial or ground-level view of this specific building.",
    mission: {
      vi: {
        title: "Dấu ấn kiến trúc",
        subtitle: "Nhìn một công trình bằng đôi mắt mới",
        storyTitle: "Đọc câu chuyện trên mặt tiền.",
        story:
          "Hãy quan sát những đường ngang và lớp rèm đá. Kiến trúc sư Ngô Viết Thụ đã tạo nên diện mạo Dinh Độc Lập hiện nay. Bạn đã tìm được trang đầu của hành trình.",
        question: "Ai thiết kế Dinh Độc Lập hiện nay?",
        answers: [
          "Ngô Viết Thụ",
          "Gustave Eiffel",
          "Nguyễn An",
          "Ernest Hébrard",
        ],
        correct: 0,
        hint: "Tên của vị kiến trúc sư bắt đầu bằng họ Ngô.",
        explanation: "Đúng rồi, đó là kiến trúc sư Ngô Viết Thụ.",
        fact: "Quan sát · Đường nét và ánh sáng",
      },
      en: {
        title: "An architectural signature",
        subtitle: "See a familiar landmark differently",
        storyTitle: "Read the façade.",
        story:
          "Follow the horizontal lines and stone screens. Architect Ngô Viết Thụ designed the Palace you see today. You have found the first page of your journey.",
        question: "Who designed the current Independence Palace?",
        answers: [
          "Ngô Viết Thụ",
          "Gustave Eiffel",
          "Nguyễn An",
          "Ernest Hébrard",
        ],
        correct: 0,
        hint: "The architect's family name is Ngô.",
        explanation: "Exactly: architect Ngô Viết Thụ.",
        fact: "Observation · Lines and light",
      },
    },
  },
  {
    id: "reception",
    name: { vi: "Phòng Khánh tiết", en: "The Reception Hall" },
    floor: { vi: "Không gian bên trong", en: "Interior" },
    x: 485,
    y: 420,
    photo: "/images/palace/reception.webp",
    clue: {
      vi: "Tìm đại sảnh với thảm đỏ, rèm đỏ và những chiếc đèn chùm.",
      en: "Find the hall with red carpet, red curtains, and chandeliers.",
    },
    detail: {
      vi: "Không gian của những cuộc gặp",
      en: "A setting for significant encounters",
    },
    recognition:
      "Palace reception / state ceremonial hall: broad open space, red patterned carpet, red curtains, chandeliers and symmetrical ceremonial seating. The reference shows a bust at the far end, not a conference table. Visitors may partially obscure the scene.",
    mission: {
      vi: {
        title: "Đọc tên một không gian",
        subtitle: "Theo dấu tấm thảm đỏ",
        storyTitle: "Một căn phòng, một vai trò.",
        story:
          "Thảm đỏ phủ rộng nền phòng, rèm đỏ phía cuối sảnh, ghế hoa văn đối xứng và đèn chùm là những dấu hiệu của phòng Khánh tiết. Đây là không gian hội họp và đón tiếp với sức chứa khoảng 500 người. Phòng Đại yến là một phòng khác trong Dinh.",
        question: "Không gian bạn vừa nhận diện có tên là gì?",
        answers: [
          "Phòng Nội các",
          "Phòng Khánh tiết",
          "Phòng thông tin",
          "Sân thượng",
        ],
        correct: 1,
        hint: "Tên phòng đã xuất hiện ở đầu câu chuyện.",
        explanation: "Bạn đã ghi nhận phòng Khánh tiết.",
        fact: "Quan sát · Trục đối xứng",
      },
      en: {
        title: "A room with a name",
        subtitle: "Follow the red carpet",
        storyTitle: "Every room has a role.",
        story:
          "Red patterned carpet, red stage curtains, symmetrical seating and chandeliers identify the Reception Hall. This meeting and reception space accommodates about 500 people. The State Banqueting Hall is a different room.",
        question: "Which space did you just identify?",
        answers: [
          "The Cabinet Room",
          "The Reception Hall",
          "The communications room",
          "The rooftop",
        ],
        correct: 1,
        hint: "Its name appears at the start of the story.",
        explanation: "You have recorded the Reception Hall.",
        fact: "Observation · Symmetry",
      },
    },
  },
  {
    id: "cabinet",
    name: { vi: "Phòng Nội các", en: "The Cabinet Room" },
    floor: { vi: "Không gian bên trong", en: "Interior" },
    x: 295,
    y: 290,
    photo: "/images/palace/cabinet.webp",
    clue: {
      vi: "Tìm bàn oval rỗng giữa, micro, ghế da sẫm và rèm xanh vàng.",
      en: "Find the open-centred oval table, microphones, dark leather chairs and yellow-green curtains.",
    },
    detail: {
      vi: "Nơi những quyết định được thảo luận",
      en: "Where decisions were discussed",
    },
    recognition:
      "Independence Palace Cabinet Room: large hollow oval conference table, dark chairs all around, microphones, lime yellow curtains and chandeliers. Compare the exact furnishings and layout with the supplied reference, not just any meeting room.",
    mission: {
      vi: {
        title: "Những chiếc ghế quanh bàn",
        subtitle: "Từ bố cục đoán công năng",
        storyTitle: "Dấu vết của một cuộc họp.",
        story:
          "Đây là phòng Nội các, nơi từng diễn ra các cuộc họp. Điểm nhận biết là chiếc bàn oval có khoảng rỗng ở giữa, micro đặt quanh bàn, các ghế da xanh sẫm và rèm xanh vàng. Hãy đọc công năng của căn phòng qua cách các ghế hướng về không gian chung.",
        question: "Bố cục căn phòng chủ yếu phục vụ hoạt động nào?",
        answers: [
          "Biểu diễn âm nhạc",
          "Nghỉ ngơi",
          "Họp và thảo luận",
          "Cất giữ phương tiện",
        ],
        correct: 2,
        hint: "Quan sát chiếc bàn và các ghế hướng về nhau.",
        explanation: "Chính xác, đây là không gian họp và thảo luận.",
        fact: "Quan sát · Bố cục và công năng",
      },
      en: {
        title: "Seats around a table",
        subtitle: "Read a room through its layout",
        storyTitle: "Traces of a meeting.",
        story:
          "This is the Cabinet Room, once used for meetings. Look for its open-centred oval table, desk microphones, dark green leather chairs and yellow-green curtains. Read its purpose through the way the seats face a shared space.",
        question: "What activity does this layout primarily support?",
        answers: [
          "Music performances",
          "Resting",
          "Meetings and discussion",
          "Vehicle storage",
        ],
        correct: 2,
        hint: "Notice the table and seats facing one another.",
        explanation: "Correct: meetings and discussion.",
        fact: "Observation · Layout and purpose",
      },
    },
  },
  {
    id: "rooftop",
    name: { vi: "Trực thăng trên mái", en: "The rooftop helicopter" },
    floor: { vi: "Sân thượng", en: "Rooftop" },
    x: 685,
    y: 245,
    photo: "/images/palace/rooftop.webp",
    clue: {
      vi: "Tìm chiếc trực thăng được trưng bày trên sân thượng.",
      en: "Find the helicopter displayed on the rooftop.",
    },
    detail: {
      vi: "Một góc nhìn trên cao",
      en: "A different perspective, above the city",
    },
    recognition:
      "UH-1 military helicopter displayed on Independence Palace rooftop helipad, olive green fuselage, rotor and tail against sky and city. Not a plane, toy, or generic helicopter away from the Palace roof.",
    mission: {
      vi: {
        title: "Dấu vết trên cao",
        subtitle: "Ngước nhìn một hiện vật đặc biệt",
        storyTitle: "Một khoảng trời khác.",
        story:
          "Trên sân thượng, chiếc UH-1 tạo nên một điểm dừng khác hẳn những căn phòng bên dưới. Quan sát cánh quạt và dáng thân máy: bạn đang nhận diện một hiện vật được trưng bày.",
        question: "Hiện vật trên sân thượng là loại phương tiện nào?",
        answers: [
          "Xe jeep",
          "Máy bay cánh bằng",
          "Tàu thủy",
          "Trực thăng UH-1",
        ],
        correct: 3,
        hint: "Hãy nhìn cánh quạt nằm phía trên thân máy.",
        explanation: "Đúng, đó là trực thăng UH-1.",
        fact: "Quan sát · Hình dáng hiện vật",
      },
      en: {
        title: "A trace above the city",
        subtitle: "Look up at an unusual exhibit",
        storyTitle: "A different patch of sky.",
        story:
          "On the rooftop, the UH-1 offers a stop unlike the rooms below. Look at the rotor and fuselage: you are identifying a displayed artifact.",
        question: "What vehicle is displayed on the rooftop?",
        answers: [
          "A jeep",
          "A fixed-wing aircraft",
          "A boat",
          "A UH-1 helicopter",
        ],
        correct: 3,
        hint: "Look at the rotor above the fuselage.",
        explanation: "Yes: a UH-1 helicopter.",
        fact: "Observation · Artifact shapes",
      },
    },
  },
  {
    id: "bunker",
    name: { vi: "Thông tin dưới hầm", en: "Bunker communications" },
    floor: { vi: "Tầng hầm", en: "Basement" },
    x: 775,
    y: 550,
    photo: "/images/palace/bunker.webp",
    clue: {
      vi: "Tìm phòng dưới hầm với các thiết bị thông tin liên lạc.",
      en: "Find the basement room with its communications equipment.",
    },
    detail: {
      vi: "Những kết nối phía sau bức tường",
      en: "Connections behind the walls",
    },
    recognition:
      "Independence Palace underground bunker communications room: old teletype machines on desks, grey utilitarian corridor, red-brown equipment room walls and white tiles with black floral patterns. Require equipment and scene agreement; an arbitrary corridor or office is insufficient.",
    mission: {
      vi: {
        title: "Tín hiệu cuối hành trình",
        subtitle: "Khám phá lớp không gian phía dưới",
        storyTitle: "Lắng nghe một thời chưa có smartphone.",
        story:
          "Ảnh chụp phòng thông tin cho thấy các máy điện báo để bàn, tường nâu đỏ, ghế kim loại và nền gạch hoa đen trắng; bên cạnh là hành lang bê tông hẹp. Các câu hỏi ở trạm này mở rộng ra chức năng bảo vệ và phòng tham mưu tác chiến trong cùng khu hầm, không phải mọi hiện vật đều nằm trong căn phòng trên ảnh.",
        question: "Nhóm thiết bị ở điểm này gắn với hoạt động nào?",
        answers: ["Thông tin liên lạc", "Nấu ăn", "Chiếu phim", "Chăm sóc cây"],
        correct: 0,
        hint: "Nghĩ đến việc gửi và nhận tín hiệu.",
        explanation: "Chính xác! Bạn đã nối trọn năm dấu ấn của hành trình.",
        fact: "Quan sát · Công nghệ và ký ức",
      },
      en: {
        title: "The final signal",
        subtitle: "Discover the layer beneath",
        storyTitle: "Before the smartphone.",
        story:
          "The communications photo shows desk-mounted teletypes, red-brown walls, metal chairs and black-and-white patterned tiles beside a narrow concrete corridor. This stop’s questions also explore the bunker’s protective structure and operations room; these are not all exhibits inside the photographed room.",
        question: "What activity is this equipment associated with?",
        answers: ["Communications", "Cooking", "Film screening", "Gardening"],
        correct: 0,
        hint: "Think of sending and receiving signals.",
        explanation: "Exactly! You have connected all five discoveries.",
        fact: "Observation · Technology and memory",
      },
    },
  },
];

const features: Record<CheckpointId, { vi: string[]; en: string[] }> = {
  facade: { vi: ["Rèm hoa đá đốt trúc", "Ban công chạy ngang", "Đài phun nước"], en: ["Bamboo-inspired stone screens", "Horizontal balconies", "Fountain"] },
  reception: { vi: ["Thảm đỏ hoa văn", "Ghế đối xứng", "Đèn chùm pha lê"], en: ["Patterned red carpet", "Symmetrical seating", "Crystal chandeliers"] },
  cabinet: { vi: ["Bàn oval rỗng giữa", "Ghế da xanh sẫm", "Rèm xanh vàng · Micro"], en: ["Open-centred oval table", "Dark green leather chairs", "Yellow-green curtains · Microphones"] },
  rooftop: { vi: ["UH-1 số 445", "Sơn ngụy trang", "Càng đáp · Sân mái"], en: ["UH-1 number 445", "Camouflage finish", "Landing skids · Rooftop"] },
  bunker: { vi: ["Máy điện báo để bàn", "Tường nâu đỏ", "Gạch hoa đen trắng"], en: ["Desk-mounted teletypes", "Red-brown walls", "Black-and-white tiles"] },
};

export function getCheckpoints(locale: Locale = "vi") {
  return catalog.map((entry) => ({
    ...entry,
    name: entry.name[locale],
    floor: entry.floor[locale],
    clue: entry.clue[locale],
    detail: entry.detail[locale],
    mission: entry.mission[locale],
    questions: getCheckpointQuestions(entry.id).map(publicQuestion),
    features: features[entry.id][locale],
    source: PALACE_SOURCE,
  }));
}
export type Checkpoint = ReturnType<typeof getCheckpoints>[number];
export function isCheckpointId(value: unknown): value is CheckpointId {
  return checkpointIds.includes(value as CheckpointId);
}
