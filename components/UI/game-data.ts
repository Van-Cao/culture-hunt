import type { Locale } from "./LanguageProvider";

export type Mission = {
  title: string;
  subtitle: string;
  storyTitle: string;
  story: string;
  question: string;
  answers: readonly string[];
  correct: number;
  hint: string;
  explanation: string;
  fact: string;
};
export type Place = {
  id: "palace" | "hcmus";
  name: string;
  shortName: string;
  tag: string;
  address: string;
  image: string;
  coverImage: string;
  source: string;
  sourceName: string;
  journey: string;
  badge: string;
  missions: Mission[];
};

// UI fixtures, not live check-ins or image-recognition results.
// Replace this adapter with the project's dataset/API when it is available.
const palaceSource = "https://dinhdoclap.gov.vn/kien-truc-dinh-doc-lap/";
const campusSource =
  "https://hcmus.edu.vn/29-nam-truong-dai-hoc-khoa-hoc-tu-nhien-dhqg-hcm-30-3-1996-30-3-2025/";

export function getPlaces(locale: Locale): Place[] {
  const en = locale === "en";
  return [
    {
      id: "palace",
      name: en ? "Independence Palace" : "Dinh Độc Lập",
      shortName: en ? "Independence Palace" : "Dinh Độc Lập",
      tag: en ? "HISTORIC LANDMARK" : "DI TÍCH LỊCH SỬ",
      address: "135 Nam Kỳ Khởi Nghĩa, TP. HCM",
      image: "/images/palace.webp",
      coverImage: "/images/palace-exterior.webp",
      source: palaceSource,
      sourceName: en ? "Independence Palace" : "Di tích Dinh Độc Lập",
      journey: en ? "Decoding Independence Palace" : "Giải mã Dinh Độc Lập",
      badge: en ? "Palace explorer" : "Nhà thám hiểm Dinh",
      missions: en
        ? [
            {
              title: "Meet the architect",
              subtitle: "A vision behind the landmark",
              storyTitle: "A landmark. A remarkable vision.",
              story:
                "Architect Ngô Viết Thụ designed Independence Palace, bringing modern lines together with traditional Asian ideas. Look at the façade: its architecture has stories of its own.",
              question: "Who designed the current Independence Palace?",
              answers: [
                "Gustave Eiffel",
                "Ngô Viết Thụ",
                "Ernest Hébrard",
                "Nguyễn An",
              ],
              correct: 1,
              hint: "This Vietnamese architect's surname is Ngô.",
              explanation:
                "Exactly! Ngô Viết Thụ brought modern architecture and Asian traditions together in this landmark.",
              fact: "Architecture · Modern meets traditional",
            },
            {
              title: "Decode the stone curtain",
              subtitle: "Look closer at the façade",
              storyTitle: "Bamboo, reimagined in stone.",
              story:
                "The stone screens around the second floor echo the shape of bamboo segments. Beyond their distinctive appearance, they also help control the natural light entering the building.",
              question: "What inspired the Palace's stone screens?",
              answers: [
                "Ocean waves",
                "Lotus petals",
                "Bamboo segments",
                "Mountain peaks",
              ],
              correct: 2,
              hint: "Think of a familiar plant with a tall, segmented stem.",
              explanation:
                "Well spotted! Bamboo segments inspired these screens, combining beauty with a practical purpose.",
              fact: "Stone screens · Light and shade",
            },
            {
              title: "Find the milestone",
              subtitle: "Complete the architecture story",
              storyTitle: "The day a new chapter opened.",
              story:
                "Construction began in July 1962. The Palace was inaugurated on 31 October 1966, marking the completion of the building you can explore today.",
              question: "In which year was the current Palace inaugurated?",
              answers: ["1966", "1954", "1975", "1945"],
              correct: 0,
              hint: "Four years after construction began in 1962.",
              explanation:
                "You got it! The Palace was inaugurated in 1966. Your architecture quest is complete.",
              fact: "1962 → 1966 · A new chapter",
            },
          ]
        : [
            {
              title: "Gặp gỡ kiến trúc sư",
              subtitle: "Người đứng sau một biểu tượng",
              storyTitle: "Một công trình. Ngàn điều muốn kể.",
              story:
                "Kiến trúc sư Ngô Viết Thụ thiết kế Dinh Độc Lập, kết hợp đường nét hiện đại với tinh thần Á Đông. Hãy nhìn mặt tiền: kiến trúc cũng có những câu chuyện riêng.",
              question: "Ai thiết kế công trình Dinh Độc Lập hiện nay?",
              answers: [
                "Gustave Eiffel",
                "Ngô Viết Thụ",
                "Ernest Hébrard",
                "Nguyễn An",
              ],
              correct: 1,
              hint: "Vị kiến trúc sư người Việt này mang họ Ngô.",
              explanation:
                "Chính xác! Ngô Viết Thụ kết hợp kiến trúc hiện đại với truyền thống Á Đông trong công trình này.",
              fact: "Kiến trúc · Hiện đại và truyền thống",
            },
            {
              title: "Giải mã rèm hoa đá",
              subtitle: "Nhìn kỹ hơn vào mặt tiền",
              storyTitle: "Khi đốt trúc hóa thành đá.",
              story:
                "Rèm hoa đá bao quanh tầng hai mô phỏng những đốt trúc. Không chỉ tạo vẻ đẹp riêng, lớp rèm này còn giúp điều hòa ánh sáng tự nhiên vào bên trong Dinh.",
              question:
                "Rèm hoa đá của Dinh được lấy cảm hứng từ hình ảnh nào?",
              answers: ["Sóng biển", "Cánh sen", "Đốt trúc", "Đỉnh núi"],
              correct: 2,
              hint: "Một loài cây thân cao, chia thành nhiều đốt, rất quen thuộc ở Việt Nam.",
              explanation:
                "Tinh mắt lắm! Đốt trúc là cảm hứng cho lớp rèm đá, kết hợp vẻ đẹp và công năng.",
              fact: "Rèm hoa đá · Ánh sáng và bóng râm",
            },
            {
              title: "Chạm mốc thời gian",
              subtitle: "Ghép trọn câu chuyện kiến trúc",
              storyTitle: "Ngày một chương mới bắt đầu.",
              story:
                "Dinh được khởi công vào tháng 7/1962 và khánh thành ngày 31/10/1966. Đó là dấu mốc hoàn thiện công trình mà bạn có thể khám phá hôm nay.",
              question: "Công trình Dinh Độc Lập hiện nay khánh thành năm nào?",
              answers: ["1966", "1954", "1975", "1945"],
              correct: 0,
              hint: "Bốn năm sau khi công trình khởi công vào năm 1962.",
              explanation:
                "Đúng rồi! Dinh khánh thành năm 1966. Bạn đã hoàn thành hành trình giải mã kiến trúc!",
              fact: "1962 → 1966 · Một chương mới",
            },
          ],
    },
    {
      id: "hcmus",
      name: en
        ? "University of Science, VNU-HCM"
        : "ĐH Khoa học Tự nhiên – ĐHQG-HCM",
      shortName: en ? "University of Science" : "ĐH Khoa học Tự nhiên",
      tag: en ? "SCIENCE & HERITAGE" : "KHOA HỌC & DẤU ẤN",
      address: "227 Nguyễn Văn Cừ, TP. HCM",
      image: "/images/hcmus-campus.webp",
      coverImage: "/images/hcmus-campus.webp",
      source: campusSource,
      sourceName: en
        ? "University of Science, VNU-HCM"
        : "Trường ĐH KHTN, ĐHQG-HCM",
      journey: en ? "Following the trail of knowledge" : "Theo dấu tri thức",
      badge: en ? "Knowledge seeker" : "Người theo dấu tri thức",
      missions: en
        ? [
            {
              title: "A new chapter",
              subtitle: "Discover the University's story",
              storyTitle: "Curiosity has a history, too.",
              story:
                "The University of Science, VNU-HCM was established on 30 March 1996. It grew from a long tradition of teaching and scientific discovery.",
              question:
                "In which year was the University of Science, VNU-HCM established?",
              answers: ["1986", "1996", "2006", "1976"],
              correct: 1,
              hint: "It celebrated its 30th anniversary in 2026.",
              explanation:
                "Correct! 30 March 1996 is an important milestone in the University's history.",
              fact: "30.03.1996 · A milestone in science",
            },
            {
              title: "Trace its roots",
              subtitle: "A story across generations",
              storyTitle: "Knowledge connects generations.",
              story:
                "In 1996, the natural sciences block was separated from the University of Ho Chi Minh City to form the University of Science, VNU-HCM.",
              question:
                "Which institution did the University of Science separate from?",
              answers: [
                "University of Architecture",
                "University of Medicine",
                "University of Ho Chi Minh City",
                "University of Economics",
              ],
              correct: 2,
              hint: "Its former name reflected a broad range of academic disciplines.",
              explanation:
                "Exactly! The University of Science grew from the natural sciences block of the University of Ho Chi Minh City.",
              fact: "An academic legacy · A new beginning",
            },
            {
              title: "Unlock its mission",
              subtitle: "The next discovery starts here",
              storyTitle: "From a question to a discovery.",
              story:
                "Teaching and research in the natural sciences are central to the University's mission. Each new question can be the first step toward a scientific discovery.",
              question: "Which field is central to the University's mission?",
              answers: [
                "Natural sciences",
                "Fashion design",
                "Performing arts",
                "Hospitality",
              ],
              correct: 0,
              hint: "The clue is right in the University's name.",
              explanation:
                "Great work! Education and research in the natural sciences are at the heart of its mission. Quest complete!",
              fact: "Teaching · Research · Discovery",
            },
          ]
        : [
            {
              title: "Mở trang đầu tiên",
              subtitle: "Khám phá câu chuyện của trường",
              storyTitle: "Sự tò mò cũng có một lịch sử.",
              story:
                "Trường ĐH Khoa học Tự nhiên, ĐHQG-HCM thành lập ngày 30/3/1996, tiếp nối một truyền thống giảng dạy và khám phá khoa học lâu dài.",
              question: "Trường ĐH KHTN, ĐHQG-HCM được thành lập năm nào?",
              answers: ["1986", "1996", "2006", "1976"],
              correct: 1,
              hint: "Trường kỷ niệm 30 năm thành lập vào năm 2026.",
              explanation:
                "Chính xác! Ngày 30/3/1996 là một dấu mốc quan trọng trong lịch sử nhà trường.",
              fact: "30.03.1996 · Một dấu mốc khoa học",
            },
            {
              title: "Lần theo cội nguồn",
              subtitle: "Câu chuyện qua nhiều thế hệ",
              storyTitle: "Tri thức nối liền những thế hệ.",
              story:
                "Năm 1996, khối Khoa học tự nhiên được tách từ Trường Đại học Tổng hợp TP.HCM, hình thành Trường ĐH Khoa học Tự nhiên thuộc ĐHQG-HCM.",
              question: "Trường ĐH KHTN được tách ra từ trường nào?",
              answers: [
                "ĐH Kiến trúc",
                "ĐH Y Dược",
                "ĐH Tổng hợp TP.HCM",
                "ĐH Kinh tế",
              ],
              correct: 2,
              hint: "Tên ngôi trường trước đây thể hiện sự tập hợp nhiều lĩnh vực học thuật.",
              explanation:
                "Đúng rồi! Trường được hình thành từ khối Khoa học tự nhiên của ĐH Tổng hợp TP.HCM.",
              fact: "Tiếp nối truyền thống · Mở lối tương lai",
            },
            {
              title: "Giải mã sứ mệnh",
              subtitle: "Khám phá tiếp theo bắt đầu ở đây",
              storyTitle: "Từ một câu hỏi đến một khám phá.",
              story:
                "Đào tạo và nghiên cứu các ngành khoa học tự nhiên là trọng tâm của trường. Mỗi câu hỏi mới đều có thể là khởi đầu của một khám phá.",
              question: "Lĩnh vực nào là trọng tâm của nhà trường?",
              answers: [
                "Khoa học tự nhiên",
                "Thiết kế thời trang",
                "Nghệ thuật biểu diễn",
                "Quản trị khách sạn",
              ],
              correct: 0,
              hint: "Đáp án nằm ngay trong tên gọi của trường.",
              explanation:
                "Tuyệt vời! Đào tạo và nghiên cứu khoa học tự nhiên là sứ mệnh cốt lõi. Bạn đã hoàn thành hành trình!",
              fact: "Đào tạo · Nghiên cứu · Khám phá",
            },
          ],
    },
  ];
}
