export { StageScenery } from "./PalaceRooms";

export function GardenTree({ x, y, small = false }: { x: number; y: number; small?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${small ? .7 : 1})`}>
    <ellipse cy="6" rx="25" ry="10" fill="#123f3430" />
    <path d="M0-24V6" stroke="#6f7650" strokeWidth="6" />
    <path d="M0-89Q-34-62-26-29Q-21-7 0-12Q28-9 27-36Q33-65 0-89Z" fill="#426e50" />
    <path d="M0-89Q-27-59-19-33Q-11-15 0-19Q-8-46 0-89Z" fill="#6f9764" />
    <path d="M0-83Q18-58 18-35" fill="none" stroke="#7fa56e" strokeWidth="3" opacity=".5" />
  </g>;
}

export function Explorer() {
  return <g className="palace-explorer-figure">
    <ellipse cy="55" rx="18" ry="7" fill="#143f3455" />
    <path d="M-8 32L-10 50M7 32L10 50" stroke="#304e43" strokeWidth="8" strokeLinecap="round" />
    <path d="M-15 50H-5M5 50H15" stroke="#263e36" strokeWidth="5" strokeLinecap="round" />
    <rect x="-17" y="10" width="31" height="27" rx="8" fill="#b68b51" stroke="#f2d49b" strokeWidth="2" />
    <path d="M-10 12Q0 6 11 13L13 34Q0 40-13 34Z" fill="#e5c780" stroke="#f9e9b8" strokeWidth="1.5" />
    <path d="M-11 17L-20 30M11 17L21 25" stroke="#d9ad7b" strokeWidth="6" strokeLinecap="round" />
    <path d="M-7 13L8 33" stroke="#896e42" strokeWidth="3" />
    <circle cy="1" r="12" fill="#deb98b" />
    <path d="M-4 1H-2M5 1H7" stroke="#3b4939" strokeWidth="2" strokeLinecap="round" />
    <path d="M-21-3Q0 8 21-3L14-7 9-19H-9L-14-7Z" fill="#f2dc9d" stroke="#8d784b" strokeWidth="1.5" />
    <path d="M-13-7Q0-2 13-7" stroke="#9b8051" strokeWidth="4" fill="none" />
    <path d="M20 21L28 16 34 26 24 30Z" fill="#f1edcc" stroke="#8b9a73" />
  </g>;
}
