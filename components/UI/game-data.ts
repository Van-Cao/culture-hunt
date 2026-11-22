import { getCheckpoints } from "@/lib/palace/checkpoints";
import { getHcmusCheckpoints, HCMUS_CAMPUS_ADDRESS } from "@/lib/hcmus/checkpoints";
import type { Locale } from "./LanguageProvider";

export type Mission = {
  id?: string;
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
      missions: getCheckpoints(locale).map((checkpoint) => checkpoint.mission),
    },
    {
      id: "hcmus",
      name: en
        ? "University of Science, VNU-HCM"
        : "ĐH Khoa học Tự nhiên – ĐHQG-HCM",
      shortName: en ? "University of Science" : "ĐH Khoa học Tự nhiên",
      tag: en ? "SCIENCE & HERITAGE" : "KHOA HỌC & DẤU ẤN",
      address: HCMUS_CAMPUS_ADDRESS,
      image: "/images/hcmus-campus.webp",
      coverImage: "/images/hcmus-campus.webp",
      source: campusSource,
      sourceName: en
        ? "University of Science, VNU-HCM"
        : "Trường ĐH KHTN, ĐHQG-HCM",
      journey: en ? "Following the trail of knowledge" : "Theo dấu tri thức",
      badge: en ? "Knowledge seeker" : "Người theo dấu tri thức",
      missions: getHcmusCheckpoints(locale).map(checkpoint => checkpoint.mission),
    },
  ];
}
