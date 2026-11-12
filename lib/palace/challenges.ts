import type { CheckpointId } from "./checkpoints";

type Text = { vi: string; en: string };
type Region = { x: number; y: number; w: number; h: number };
export type ChallengeDefinition = {
  version: string; checkpointId: CheckpointId; kind: "spot" | "puzzle" | "match" | "circuit";
  title: Text; instructions: Text; hint: Text; image: string;
  targets?: { id: string; label: Text; region: Region }[];
  columns?: number; rows?: number; cells?: ("elbow" | "straight")[];
};
export type ChallengeProgress = {
  board: number[]; found: string[]; pairs: string[]; turns: number[]; connected: number[];
  moves: number; solved: boolean;
};
export type ChallengeSession = { definition: ChallengeDefinition; progress: ChallengeProgress };
export type ChallengeMove =
  | { type: "tap"; x: number; y: number }
  | { type: "swap"; a: number; b: number }
  | { type: "match"; itemId: string; targetId: number }
  | { type: "rotate"; index: number };
export const CHALLENGE_VERSION = "palace-minigames-v1";

const definitions: Record<CheckpointId, Omit<ChallengeDefinition, "version" | "checkpointId">> = {
  facade: {
    kind: "spot", image: "/images/palace-exterior.webp",
    title: { vi: "Săn dấu kiến trúc", en: "An eye for architecture" },
    instructions: { vi: "Đọc manh mối rồi chạm vào chi tiết tương ứng trên ảnh. Tìm đủ ba dấu hiệu để mở câu chuyện.", en: "Read each clue and tap its location in the photograph. Find all three details to reveal the story." },
    hint: { vi: "Rèm hoa đá ở mặt tiền trắng; cột cờ nằm giữa mái; đài phun nước ở giữa thảm cỏ.", en: "Stone screens cover the white facade. The flagpole rises above its centre. The fountain sits in the lawn." },
    targets: [
      { id: "screen", label: { vi: "Lớp rèm trắng với những đường nét như đốt trúc", en: "White stone screens with bamboo-like lines" }, region: { x: 37, y: 46, w: 21, h: 7 } },
      { id: "flag", label: { vi: "Cột cờ vươn lên ở giữa mái Dinh", en: "The flagpole above the centre of the roof" }, region: { x: 45, y: 37, w: 6, h: 9 } },
      { id: "fountain", label: { vi: "Đài phun nước giữa thảm cỏ oval", en: "The fountain in the oval lawn" }, region: { x: 44, y: 68, w: 9, h: 8 } },
    ],
  },
  reception: {
    kind: "puzzle", image: "/images/palace/reception.webp", columns: 3, rows: 2,
    title: { vi: "Ghép lại không gian", en: "Restore the room" },
    instructions: { vi: "Chạm hai mảnh bất kỳ để đổi chỗ. Ghép lại căn phòng, từ đèn chùm phía trên đến thảm đỏ phía dưới.", en: "Select any two pieces to swap them. Restore the room, from the chandeliers above to the red carpet below." },
    hint: { vi: "Đèn chùm ở hàng trên; rèm đỏ nằm giữa ảnh. Dùng ảnh đối chiếu nếu cần một góc nhìn đầy đủ.", en: "Chandeliers belong at the top and the red curtains sit near the centre. Open the reference picture for a complete view." },
  },
  cabinet: {
    kind: "match", image: "/images/palace/cabinet.webp",
    title: { vi: "Ghép dấu vật", en: "Match the room's clues" },
    instructions: { vi: "Chọn một thẻ tên, rồi chạm mốc đánh số đúng trên ảnh. Ghép đủ ba dấu vật của phòng Nội các.", en: "Select a name card, then its numbered marker in the photograph. Match all three Cabinet Room details." },
    hint: { vi: "Nhìn chiếc micro ngay mép bàn phía trước, hàng ghế bên trái và khoảng rỗng giữa bàn oval.", en: "Look for the microphone on the front edge, the chairs on the left, and the open centre of the oval table." },
    targets: [
      { id: "table", label: { vi: "Bàn họp oval", en: "Oval meeting table" }, region: { x: 43, y: 53, w: 14, h: 7 } },
      { id: "microphone", label: { vi: "Micro để bàn", en: "Desk microphone" }, region: { x: 47, y: 62, w: 5, h: 8 } },
      { id: "chair", label: { vi: "Ghế đại biểu", en: "Delegate's chair" }, region: { x: 21, y: 70, w: 9, h: 10 } },
    ],
  },
  rooftop: {
    kind: "puzzle", image: "/images/palace/rooftop.webp", columns: 3, rows: 2,
    title: { vi: "Hoàn thiện hiện vật", en: "Piece together the aircraft" },
    instructions: { vi: "Chạm hai mảnh để đổi chỗ. Nối lại buồng lái, thân và cánh quạt để nhìn rõ chiếc trực thăng trên mái Dinh.", en: "Select two pieces to swap. Reconnect the cockpit, fuselage and rotor to reveal the helicopter on the Palace rooftop." },
    hint: { vi: "Hãy theo đường cánh quạt và thân máy bay. Ảnh đối chiếu luôn sẵn để bạn quan sát.", en: "Follow the rotor and the line of the fuselage. You can open the reference photograph whenever you need it." },
  },
  bunker: {
    kind: "circuit", image: "/images/palace/bunker.webp", columns: 4, rows: 3,
    title: { vi: "Nối mạch thông tin", en: "Reconnect the signal" },
    instructions: { vi: "Chạm từng ô để xoay 90°. Nối đường truyền từ NGUỒN bên trái đến ĐÍCH bên phải. Mỗi đầu dây phải khớp với ô bên cạnh.", en: "Tap a tile to rotate it 90°. Connect SOURCE on the left to DESTINATION on the right. Neighbouring pipe ends must meet." },
    hint: { vi: "Bắt đầu từ ô ở giữa cạnh trái. Đường nối cần đi qua cả hàng trên lẫn hàng dưới trước khi tới đích.", en: "Start at the middle-left tile. A route can travel through both the top and bottom rows before reaching the destination." },
    cells: ["elbow", "elbow", "straight", "straight", "elbow", "elbow", "elbow", "elbow", "straight", "straight", "elbow", "elbow"],
  },
};

export function challengeDefinition(checkpointId: CheckpointId): ChallengeDefinition {
  return { ...definitions[checkpointId], version: CHALLENGE_VERSION, checkpointId };
}

export function connectedCircuit(definition: ChallengeDefinition, turns: number[]) {
  const cells = definition.cells!;
  const columns = definition.columns!;
  const ports = (i: number) => (cells[i] === "straight" ? [0, 2] : [0, 1]).map(p => (p + turns[i]) % 4);
  const start = 4, end = 7;
  const seen = new Set<number>();
  if (!ports(start).includes(3)) return { connected: [], solved: false };
  const queue = [start]; seen.add(start);
  while (queue.length) {
    const i = queue.shift()!;
    for (const direction of ports(i)) {
      const row = Math.floor(i / columns), col = i % columns;
      const nextRow = row + [-1, 0, 1, 0][direction], nextCol = col + [0, 1, 0, -1][direction];
      if (nextRow < 0 || nextRow >= definition.rows! || nextCol < 0 || nextCol >= columns) continue;
      const next = nextRow * columns + nextCol;
      if (!seen.has(next) && ports(next).includes((direction + 2) % 4)) { seen.add(next); queue.push(next); }
    }
  }
  return { connected: [...seen], solved: seen.has(end) && ports(end).includes(1) };
}

export function createChallenge(checkpointId: CheckpointId, random: () => number = Math.random): ChallengeSession {
  const definition = challengeDefinition(checkpointId);
  const board = Array.from({ length: (definition.rows || 0) * (definition.columns || 0) }, (_, i) => i);
  if (definition.kind === "puzzle") {
    for (let i = board.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [board[i], board[j]] = [board[j], board[i]]; }
    if (board.every((value, i) => value === i)) [board[0], board[1]] = [board[1], board[0]];
  }
  let turns = definition.cells?.map(() => Math.floor(random() * 4)) || [];
  if (definition.kind === "circuit" && connectedCircuit(definition, turns).solved) turns = Array(12).fill(0);
  return { definition, progress: { board, found: [], pairs: [], turns, connected: definition.kind === "circuit" ? connectedCircuit(definition, turns).connected : [], moves: 0, solved: false } };
}

const integer = (v: unknown, max: number): v is number => Number.isInteger(v) && Number(v) >= 0 && Number(v) < max;
export function applyChallengeMove(session: ChallengeSession, input: unknown): { session: ChallengeSession; accepted: boolean } {
  if (!input || typeof input !== "object" || !("type" in input)) throw new Error("InvalidMove");
  const move = input as Record<string, unknown>;
  const definition = session.definition;
  const progress: ChallengeProgress = { ...session.progress, board: [...session.progress.board], found: [...session.progress.found], pairs: [...session.progress.pairs], turns: [...session.progress.turns] };
  let accepted = true;
  if (definition.kind === "spot" && move.type === "tap") {
    if (typeof move.x !== "number" || typeof move.y !== "number" || !Number.isFinite(move.x) || !Number.isFinite(move.y) || move.x < 0 || move.x > 100 || move.y < 0 || move.y > 100) throw new Error("InvalidMove");
    const target = definition.targets!.find(t => !progress.found.includes(t.id));
    if (!target) return { session, accepted: true };
    const r = target.region;
    accepted = move.x >= r.x && move.x <= r.x + r.w && move.y >= r.y && move.y <= r.y + r.h;
    if (accepted) progress.found.push(target.id);
    progress.solved = progress.found.length === definition.targets!.length;
  } else if (definition.kind === "puzzle" && move.type === "swap") {
    if (!integer(move.a, progress.board.length) || !integer(move.b, progress.board.length) || move.a === move.b) throw new Error("InvalidMove");
    [progress.board[move.a], progress.board[move.b]] = [progress.board[move.b], progress.board[move.a]];
    progress.solved = progress.board.every((v, i) => v === i);
  } else if (definition.kind === "match" && move.type === "match") {
    const target = definition.targets!.find(t => t.id === move.itemId);
    if (!target || !integer(move.targetId, definition.targets!.length)) throw new Error("InvalidMove");
    const slotIds = [...definition.targets!].reverse().map(t => t.id);
    accepted = slotIds[move.targetId] === target.id;
    if (accepted && !progress.pairs.includes(target.id)) progress.pairs.push(target.id);
    progress.solved = progress.pairs.length === definition.targets!.length;
  } else if (definition.kind === "circuit" && move.type === "rotate") {
    if (!integer(move.index, progress.turns.length)) throw new Error("InvalidMove");
    progress.turns[move.index] = (progress.turns[move.index] + 1) % 4;
    Object.assign(progress, connectedCircuit(definition, progress.turns));
  } else throw new Error("InvalidMove");
  progress.moves += 1;
  return { session: { definition, progress }, accepted };
}
