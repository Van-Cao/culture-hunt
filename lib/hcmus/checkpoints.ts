import type { Locale } from "@/components/UI/LanguageProvider";
import type { Mission } from "@/components/UI/game-data";

export const hcmusCheckpointIds = [
  "lecture-hall-1", "building-i", "building-a", "building-b",
] as const;
export type HcmusCheckpointId = (typeof hcmusCheckpointIds)[number];

export const HCMUS_CAMPUS_ADDRESS = "227 Nguyễn Văn Cừ, TP. HCM";

const catalog = [
  { id: "lecture-hall-1", vi: "Giảng đường 1", en: "Lecture Hall 1", mark: "1" },
  { id: "building-i", vi: "Tòa I", en: "Building I", mark: "I" },
  { id: "building-a", vi: "Tòa A", en: "Building A", mark: "A" },
  { id: "building-b", vi: "Tòa B", en: "Building B", mark: "B" },
] as const satisfies readonly { id: HcmusCheckpointId; vi: string; en: string; mark: string }[];

// These are named destinations, not surveyed building coordinates. Until verified
// stories/photos are supplied, use sign-reading activities and a campus overview.
export function getHcmusCheckpoints(locale: Locale = "vi") {
  const vi = locale === "vi";
  return catalog.map((entry, index) => {
    const name = vi ? entry.vi : entry.en;
    const isHall = entry.id === "lecture-hall-1";
    const others = catalog.filter(other => other.id !== entry.id).slice(0, 3);
    const options: string[] = others.map(other => vi ? other.vi : other.en);
    const correct = index % 4;
    options.splice(correct, 0, name);
    const mission: Mission = {
      id: entry.id,
      title: name,
      subtitle: vi ? "Cơ sở Nguyễn Văn Cừ" : "Nguyen Van Cu campus",
      storyTitle: vi ? `Dừng chân tại ${name}.` : `A stop at ${name}.`,
      story: vi
        ? isHall
          ? "Tìm biển tên Giảng đường 1 tại cơ sở Nguyễn Văn Cừ. Chú ý: số 1 trong tên giảng đường khác với chữ I của Tòa I. Đọc tên trên biển để ghi nhận đúng điểm dừng."
          : `Tìm bảng tên ${name} tại cơ sở Nguyễn Văn Cừ. Quan sát ký hiệu ${entry.mark} trên biển tên và lối vào để phân biệt điểm dừng này với các tòa khác trong hành trình.`
        : isHall
          ? "Find the Lecture Hall 1 sign at the Nguyen Van Cu campus. The numeral 1 is different from the letter I in Building I. Read the sign to identify this stop."
          : `Find the ${name} sign at the Nguyen Van Cu campus. Look for the letter ${entry.mark} on the sign and at the entrance to distinguish this stop from the other buildings.`,
      question: vi ? "Tên điểm dừng bạn vừa khám phá là gì?" : "Which stop did you just explore?",
      answers: options,
      correct,
      hint: vi ? `Đối chiếu biển tên với ${name}.` : `Match the sign to ${name}.`,
      explanation: vi ? `Đúng rồi, bạn đã ghi nhận ${name}.` : `Correct, you have recorded ${name}.`,
      fact: vi ? "Quan sát · Đọc biển tên · Khám phá khuôn viên" : "Observe · Read the sign · Explore the campus",
    };
    return { id: entry.id, name, photo: "/images/hcmus-campus.webp", mission };
  });
}
