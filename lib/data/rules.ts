import type { Achievement, CheckinRow, ChoiceIndex, PublicCheckin, VerifiedScan } from "./types.ts";

export const CORRECT_ANSWER_XP = 150;
export const DESTINATION_COMPLETION_XP = 100;
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
export const PHOTO_BUCKET = "checkin-photos";
const stableId = /^[a-z0-9][a-z0-9_-]{0,79}$/;

export class GameError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "GameError";
    this.status = status;
    this.code = code;
  }
}
export function objectInput(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new GameError(400, "INVALID_INPUT", "Dữ liệu gửi lên không hợp lệ.");
  }
  return value as Record<string, unknown>;
}
export function parseId(value: unknown): string {
  if (typeof value !== "string" || !stableId.test(value)) {
    throw new GameError(400, "INVALID_ID", "Mã địa điểm hoặc nhiệm vụ không hợp lệ.");
  }
  return value;
}
export function parseChoice(value: unknown): ChoiceIndex {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 3) {
    throw new GameError(400, "INVALID_CHOICE", "Chọn đáp án từ A đến D.");
  }
  return value as ChoiceIndex;
}
function text(value: unknown, maximum: number): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maximum) {
    throw new GameError(400, "INVALID_TEXT", "Nội dung không hợp lệ.");
  }
  return value.trim();
}
export function parseNickname(value: unknown): string {
  return text(value, 40);
}
export function parseVerifiedScan(value: unknown): VerifiedScan {
  const scan = objectInput(value);
  if (!Array.isArray(scan.quizzes) || scan.quizzes.length < 1 || scan.quizzes.length > 50) {
    throw new GameError(400, "INVALID_QUIZZES", "Bộ câu hỏi phải có từ 1 đến 50 câu.");
  }
  const ids = new Set<string>();
  const quizzes = scan.quizzes.map((item: unknown) => {
    const quiz = objectInput(item);
    const id = parseId(quiz.id);
    if (ids.has(id) || !Array.isArray(quiz.options) || quiz.options.length !== 4) {
      throw new GameError(400, "INVALID_QUIZZES", "Mỗi câu cần mã riêng và bốn đáp án.");
    }
    ids.add(id);
    return {
      id,
      question: text(quiz.question, 2000),
      options: quiz.options.map((option: unknown) => text(option, 1000)) as [string, string, string, string],
      correctIndex: parseChoice(quiz.correctIndex),
      ...(quiz.story === undefined ? {} : { story: text(quiz.story, 10000) }),
    };
  });
  return { placeId: parseId(scan.placeId), placeName: text(scan.placeName, 200), quizzes };
}

/** Whitelist public quiz fields: never spread an internal quiz into a response. */
export function publicCheckin(row: CheckinRow, photoUrl: string | null = null): PublicCheckin {
  const { quizzes, ...rest } = row;
  return {
    ...rest,
    quizzes: quizzes.map((q) => ({
      id: q.id, question: q.question, options: q.options,
      ...(q.story === undefined ? {} : { story: q.story }),
    })),
    nextMissionId: quizzes.find((q) => !row.progress[q.id]?.attempted)?.id ?? null,
    photoUrl,
  };
}

export function achievementsFor(totalPoints: number, checkins: PublicCheckin[]): Achievement[] {
  const uniqueCount = new Set(checkins.map((c) => c.place_id)).size;
  return [
    ...checkins.map((c) => ({
      id: `destination-${c.place_id}`, category: "destination" as const,
      title: `Hoàn thành ${c.place_name}`, unlocked: c.status === "completed",
    })),
    ...[1, 3, 5].map((count) => ({
      id: `checkins-${count}`, category: "checkins" as const,
      title: `Check-in ${count} địa điểm`, unlocked: uniqueCount >= count,
    })),
    ...[
      [150, "Nhà thám hiểm tập sự"], [500, "Người săn dấu ấn"], [1000, "Bậc thầy khám phá"],
    ].map(([points, title]) => ({
      id: `points-${points}`, category: "points" as const,
      title: String(title), unlocked: totalPoints >= Number(points),
    })),
  ];
}

export function photoExtension(bytes: Uint8Array, declaredType: string): "jpg" | "png" | "webp" {
  if (bytes.length < 12 || bytes.length > MAX_PHOTO_BYTES) {
    throw new GameError(400, "INVALID_PHOTO", "Ảnh phải có dung lượng tối đa 4 MB.");
  }
  if (declaredType === "image/jpeg" && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "jpg";
  if (declaredType === "image/png" && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) return "png";
  if (declaredType === "image/webp" && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
  throw new GameError(400, "INVALID_PHOTO", "Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP hợp lệ.");
}
