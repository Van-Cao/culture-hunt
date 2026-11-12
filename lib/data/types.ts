export type ChoiceIndex = 0 | 1 | 2 | 3;

/** Generated/validated on the server. IDs must stay stable across users/locales. */
export type QuizDefinition = {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: ChoiceIndex;
  story?: string;
};
export type VerifiedScan = {
  placeId: string;
  placeName: string;
  quizzes: QuizDefinition[];
};
export type MissionProgress = {
  attempted: boolean;
  attempts: number;
  last_choice: ChoiceIndex;
  first_attempted_at: string;
  last_answered_at: string;
  correct_at: string | null;
};
export type PlayerRow = {
  id: string;
  nickname: string;
  total_points: number;
  merged_into: string | null;
  created_at: string;
};
export type CheckinRow = {
  id: string;
  user_id: string;
  place_id: string;
  place_name: string;
  status: "checked_in" | "completed";
  quizzes: QuizDefinition[];
  progress: Record<string, MissionProgress>;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};
export type PublicCheckin = Omit<CheckinRow, "quizzes"> & {
  quizzes: Omit<QuizDefinition, "correctIndex">[];
  nextMissionId: string | null;
  photoUrl: string | null;
};
export type Achievement = {
  id: string;
  category: "destination" | "checkins" | "points";
  title: string;
  unlocked: boolean;
};
export type PlayerSnapshot = {
  player: Pick<PlayerRow, "id" | "nickname" | "total_points" | "created_at">;
  checkins: PublicCheckin[];
  achievements: Achievement[];
};
export type AnswerResult = {
  correct: boolean;
  pointsAwarded: number;
  totalPoints: number;
  checkin: PublicCheckin;
};
