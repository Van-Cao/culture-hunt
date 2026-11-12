import source from "@/content/palace/question-bank.source.json";
import type { CheckpointId } from "./checkpoints";

type Text = { vi: string; en: string };
export type PalaceQuestion = {
  id: string;
  bankVersion: string;
  sourceId: string;
  question: Text;
  answers: { vi: readonly string[]; en: readonly string[] };
  hint: Text;
  explanation: Text;
};
export type ScoredQuestion = PalaceQuestion & { correct: number };
export const QUESTION_BANK_VERSION = "palace-bank-v1";
export const QUESTION_BANK_SOURCE = source.source;

// Keep the supplied document verbatim in content/. These are the playable,
// bilingual editorial adaptations; room-dependent claims remain in review.
export const questionReview = [{
  sourceId: "station-3-q2",
  status: "needs-verification",
  reason: "The official Cabinet Room photo shows a plain rear wall. A screen or bronze drum behind the chair has not been verified; do not invent that exhibit or grade this question.",
}] as const;

const translations = [
  {
    id: "facade-bamboo", sourceId: "station-1-q1", checkpoint: "facade",
    en: "Which Vietnamese image inspired Ngô Viết Thụ’s stone screens around the second floor?",
    answers: ["Bamboo segments", "Lotus flowers", "Dragon scales", "Ancient Chinese characters"],
    hint: { vi: "Quan sát những đốt nối tiếp nhau trên rèm hoa đá.", en: "Notice the repeated jointed segments in the stone screens." },
    explanation: { vi: "Đáp án A — lóng tre, hay đốt trúc. Theo giới thiệu kiến trúc của Dinh, rèm hoa đá mô phỏng đốt trúc, đồng thời điều hòa ánh sáng tự nhiên.", en: "A — bamboo segments. The Palace’s architectural introduction describes bamboo-inspired stone screens that also moderate natural light." },
  },
  {
    id: "facade-auspicious", sourceId: "station-1-q2", checkpoint: "facade",
    en: "Seen from above, which Chinese character does the Palace’s overall layout evoke?",
    answers: ["Vương — king", "Cát — good fortune", "Trung — centre", "Nhân — person"],
    hint: { vi: "Tên chữ mang ý nghĩa tốt lành và may mắn.", en: "Its meaning is good fortune and auspiciousness." },
    explanation: { vi: "Đáp án B — chữ Cát (吉). Giới thiệu kiến trúc chính thức liên hệ tổng thể mặt bằng với ý nghĩa tốt lành và may mắn.", en: "B — Cát (吉). The official architectural introduction links the overall layout to good fortune." },
  },
  {
    id: "reception-capacity", sourceId: "station-2-q1", checkpoint: "reception",
    vi: "Phòng Khánh tiết có sức chứa khoảng bao nhiêu người?",
    en: "Approximately how many people can the Reception Hall accommodate?",
    answers: ["About 200", "About 500", "About 800", "About 1,000"],
    hint: { vi: "Con số nằm giữa 200 và 800.", en: "The figure falls between 200 and 800." },
    explanation: { vi: "Đáp án B — khoảng 500 người. Đây là không gian dành cho các cuộc họp, chiêu đãi và lễ ra mắt nội các. Phòng Đại yến là một phòng khác.", en: "B — about 500 people. The hall hosted meetings, receptions and cabinet presentations. The State Banqueting Hall is a separate room." },
  },
  {
    id: "reception-carpet", sourceId: "station-2-q2", checkpoint: "reception",
    vi: "Chi tiết nào bao phủ phần lớn sàn và tạo sắc đỏ nổi bật cho Phòng Khánh tiết?",
    en: "What covers most of the floor and gives the Reception Hall its distinctive red colour?",
    answers: ["Agarwood flooring", "Italian marble", "A large red carpet", "Hand-fired ceramic tiles"],
    viAnswers: ["Lát gỗ trầm hương", "Lát đá cẩm thạch Ý", "Một tấm thảm đỏ lớn", "Lát gạch men nung thủ công"],
    hint: { vi: "Nhìn xuống nền phòng và những hoa văn vàng trên sắc đỏ.", en: "Look at the red floor covering and its gold patterns." },
    explanation: { vi: "Đáp án C — tấm thảm đỏ lớn. Hãy quan sát các hoa văn vàng trên nền đỏ, rèm sân khấu đỏ và hai dãy ghế bố trí đối xứng.", en: "C — the large red carpet. Notice the gold patterns on red, the red stage curtains and the symmetrical rows of seating." },
  },
  {
    id: "cabinet-oval", sourceId: "station-3-q1", checkpoint: "cabinet",
    en: "What shape is the central conference table in the Cabinet Room?",
    answers: ["A long rectangle", "A circle", "An oval", "A U-shape"],
    hint: { vi: "Đường viền bàn bo tròn và kéo dài, có khoảng rỗng ở giữa.", en: "The table is rounded and elongated, with an open centre." },
    explanation: { vi: "Đáp án C — hình bầu dục. Đối chiếu ảnh thật: bàn oval rỗng giữa, ghế da xanh sẫm, micro để bàn và rèm xanh vàng là những dấu hiệu nhận biết của phòng Nội các.", en: "C — an oval. The real room has an open-centred oval table, dark green leather chairs, desk microphones and yellow-green curtains." },
  },
  {
    id: "rooftop-huey", sourceId: "station-4-q1", checkpoint: "rooftop",
    en: "Which helicopter model is displayed on the Palace rooftop?",
    answers: ["Apache", "Boeing CH-47 Chinook", "UH-1 (Huey)", "Black Hawk"],
    hint: { vi: "Tên dòng máy bay còn có biệt danh Huey.", en: "This model is also nicknamed Huey." },
    explanation: { vi: "Đáp án C — UH-1 (Huey). Hãy quan sát thân trực thăng màu xanh ngụy trang, buồng lái kính, cánh quạt chính và càng đáp trong ảnh sân thượng.", en: "C — the UH-1 (Huey). Look for its green camouflage, glazed cockpit, main rotor and landing skids in the rooftop photograph." },
  },
  {
    id: "rooftop-retreat", sourceId: "station-4-q2", checkpoint: "rooftop",
    vi: "Trong ý tưởng của Ngô Viết Thụ, Tứ phương vô sự lầu là không gian dành cho hoạt động nào?",
    en: "In Ngô Viết Thụ’s concept, what activity was Tứ phương vô sự lầu intended for?",
    answers: ["Contemplation and looking out over the surroundings", "Storing reserve weapons", "Radar monitoring", "An underground firefighting reservoir"],
    viAnswers: ["Tĩnh tâm và ngắm nhìn bốn phương", "Chứa vũ khí dự phòng", "Thu sóng radar", "Chứa nước cứu hỏa ngầm"],
    hint: { vi: "Tên gọi gợi một khoảng lặng trên cao.", en: "The name suggests a quiet retreat above the city." },
    explanation: { vi: "Đáp án A — tĩnh tâm và ngắm nhìn. Câu hỏi nói về Tứ phương vô sự lầu trong ý tưởng thiết kế, không đồng nhất toàn bộ không gian này với sân đỗ trực thăng.", en: "A — contemplation and looking out. This concerns the design concept of Tứ phương vô sự lầu, rather than treating it as identical to the helipad." },
  },
  {
    id: "bunker-regions", sourceId: "station-5-q1", checkpoint: "bunker",
    en: "In the bunker’s operations-planning room, which areas did the tactical maps track?",
    answers: ["Saigon alone", "The four tactical regions of South Vietnam", "All of Southeast Asia", "The Ho Chi Minh Trail only"],
    hint: { vi: "Có bốn vùng được phân chia trên các bản đồ tác chiến.", en: "There were four regions shown on the tactical maps." },
    explanation: { vi: "Đáp án B — bốn vùng chiến thuật. Đây là nội dung mở rộng về phòng tham mưu tác chiến trong khu hầm; ảnh nhận diện của checkpoint chụp phòng thiết bị thông tin, một không gian khác trong cùng khu vực.", en: "B — four tactical regions. This extends the lesson to the bunker’s operations room. The checkpoint reference photograph shows the communications-equipment room, a different space in the same bunker area." },
  },
  {
    id: "bunker-bends", sourceId: "station-5-q2", checkpoint: "bunker",
    en: "Why does the bunker use thick reinforced-concrete construction and passages with right-angle turns?",
    answers: ["For architectural decoration", "To reduce exposure to blast waves and fragments", "To stop water from the Saigon River", "To confuse intruders"],
    hint: { vi: "Nghĩ đến chức năng bảo vệ người ở bên trong khu hầm.", en: "Think about protecting the people inside the bunker." },
    explanation: { vi: "Đáp án B — giảm tác động của sóng xung kích và mảnh văng. Theo nội dung ngân hàng câu hỏi, kết cấu kiên cố và lối đi bẻ góc phục vụ mục đích bảo vệ; không có nghĩa mọi sức ép đều bị triệt tiêu hoàn toàn.", en: "B — reduce exposure to blast waves and fragments. The supplied question bank connects the robust structure and bent passages to protection; this does not mean they eliminate every blast effect." },
  },
] satisfies Array<{ id: string; sourceId: string; checkpoint: string; en: string; vi?: string; answers: string[]; viAnswers?: string[]; hint: Text; explanation: Text }>;

export function getCheckpointQuestions(checkpointId: CheckpointId): ScoredQuestion[] {
  return translations.filter(q => q.checkpoint === checkpointId).map(q => {
    const original = source.questions.find(item => item.id === q.sourceId)!;
    return {
      id: q.id, bankVersion: QUESTION_BANK_VERSION, sourceId: q.sourceId,
      question: { vi: "vi" in q ? q.vi! : original.question, en: q.en },
      answers: { vi: "viAnswers" in q ? q.viAnswers! : original.answers, en: q.answers },
      correct: "ABCD".indexOf(original.answer[0]), hint: q.hint, explanation: q.explanation,
    };
  });
}

export function publicQuestion({ correct: _correct, ...question }: ScoredQuestion): PalaceQuestion {
  void _correct;
  return question;
}
