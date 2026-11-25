import bank from "@/content/palace/question-bank-v3.json";
import type { CheckpointId } from "./checkpoints";
import type { PalaceQuestion } from "./question-types";

// Client-safe metadata. The grading key is only imported by the persistence service.
export function getPublicCheckpointQuestions(id: CheckpointId): PalaceQuestion[] {
  return bank.questions.filter(q => q.checkpointId === id) as PalaceQuestion[];
}

export const learningChapters = {
  facade: {
    title: { vi: "Đọc những lớp lịch sử", en: "Read the layers of history" },
    intro: { vi: "Diện mạo này chưa phải điểm bắt đầu. Lần theo những dấu vết để biết tòa Dinh đã thay đổi như thế nào.", en: "This building is not the beginning. Follow the traces to discover how the Palace changed." },
    next: { vi: "Bước vào bên trong, đến căn phòng của những sự kiện chính trị.", en: "Step inside a room that witnessed significant political events." },
  },
  reception: {
    title: { vi: "Một căn phòng, những lớp ký ức", en: "One room, layers of memory" },
    intro: { vi: "Nhìn từ thảm đỏ đến những hàng ghế. Cách bố trí đang dẫn ánh mắt bạn đến đâu?", en: "Look from the red carpet to the rows of seats. Where does the arrangement lead your eyes?" },
    next: { vi: "Tiếp tục đến căn phòng của những cuộc họp.", en: "Continue to the room of meetings." },
  },
  cabinet: {
    title: { vi: "Quanh bàn, trước một bước ngoặt", en: "Around the table, before a turning point" },
    intro: { vi: "Căn phòng hôm nay yên lặng. Tìm những chi tiết cho biết công việc từng diễn ra ở đây.", en: "The room is quiet today. Find the details that reveal the work once done here." },
    next: { vi: "Lên sân thượng, tìm một dấu tích khác của tháng tư.", en: "Go to the rooftop to find another trace of April." },
  },
  rooftop: {
    title: { vi: "Hai câu chuyện trên một sân mái", en: "Two stories on one rooftop" },
    intro: { vi: "Bắt đầu từ chiếc trực thăng, rồi nhìn kỹ mặt sân xung quanh.", en: "Begin with the helicopter, then look closely at the paving around it." },
    next: { vi: "Từ không gian mở trên cao, khám phá khu hầm bên dưới.", en: "From the open roof, explore the bunker below." },
  },
  bunker: {
    title: { vi: "Theo đường đi của một thông tin", en: "Follow a message" },
    intro: { vi: "Ánh sáng và không gian đã đổi khác. Những thiết bị này từng phục vụ công việc gì?", en: "The light and space have changed. What work did these machines support?" },
    next: { vi: "Năm điểm dừng đã kết nối. Mở Dấu ấn để nhìn lại hành trình.", en: "All five stops are connected. Open your discoveries to revisit the journey." },
  },
} as const;
