import { useId } from "react";
import type { CheckpointId } from "@/lib/palace/checkpoints";

// Geometry follows visible reference-photo features. The cutaway is illustrative.
const p = (x: number, y: number, z = 0) => `${(x - y) * .68},${(x + y) * .25 - z - 45}`;
function Plane({ x = 0, y = 0, z = 0, w, d, fill, stroke }: { x?: number; y?: number; z?: number; w: number; d: number; fill: string; stroke?: string }) {
  return <polygon points={`${p(x, y, z)} ${p(x + w, y, z)} ${p(x + w, y + d, z)} ${p(x, y + d, z)}`} fill={fill} stroke={stroke} strokeWidth=".7" />;
}
function Block({ x, y, z = 0, w, d, h, top, front, side }: { x: number; y: number; z?: number; w: number; d: number; h: number; top: string; front: string; side: string }) {
  return <g>
    <polygon points={`${p(x, y + d, z)} ${p(x + w, y + d, z)} ${p(x + w, y + d, z + h)} ${p(x, y + d, z + h)}`} fill={front} />
    <polygon points={`${p(x + w, y, z)} ${p(x + w, y + d, z)} ${p(x + w, y + d, z + h)} ${p(x + w, y, z + h)}`} fill={side} />
    <Plane x={x} y={y} z={z + h} w={w} d={d} fill={top} />
  </g>;
}
function Panel({ side, start, w, z, h, fill }: { side: "left" | "back"; start: number; w: number; z: number; h: number; fill: string }) {
  return <polygon points={side === "left" ? `${p(4, start, z)} ${p(4, start + w, z)} ${p(4, start + w, z + h)} ${p(4, start, z + h)}` : `${p(start, 4, z)} ${p(start + w, 4, z)} ${p(start + w, 4, z + h)} ${p(start, 4, z + h)}`} fill={fill} />;
}
function Windows({ side, colour, pleat }: { side: "left" | "back"; colour: string; pleat: string }) {
  return <g>{Array.from({ length: side === "left" ? 4 : 5 }, (_, i) => {
    const start = 9 + i * (side === "left" ? 31 : 38), width = side === "left" ? 24 : 29;
    return <g key={i}>
      <Panel side={side} start={start - 2} w={width + 4} z={8} h={91} fill="#f8f2df" />
      <Panel side={side} start={start} w={width} z={10} h={85} fill="#a7c2b5" />
      <Panel side={side} start={start + width / 2} w={1} z={10} h={85} fill="#e3e8d7" />
      {[0, 1].map(edge => <g key={edge}>
        <Panel side={side} start={start + edge * (width - 5)} w={5} z={8} h={91} fill={colour} />
        <Panel side={side} start={start + 1.5 + edge * (width - 5)} w={1.2} z={8} h={91} fill={pleat} />
        <Panel side={side} start={start + edge * (width - 5)} w={5} z={31} h={2} fill="#ceb479" />
      </g>)}
      <Panel side={side} start={start - 1} w={width + 2} z={91} h={8} fill={colour} />
    </g>;
  })}</g>;
}
function Shell({ floor, left = "#e4ddc9", back = "#eee6d2" }: { floor: string; left?: string; back?: string }) {
  return <g>
    <Block x={0} y={0} z={-10} w={204} d={144} h={10} top={floor} front="#8b8165" side="#686c55" />
    <Block x={0} y={0} w={4} d={144} h={110} top="#f7f0dc" front={left} side={left} />
    <Block x={0} y={0} w={204} d={4} h={110} top="#fff6df" front={back} side="#d5c9ab" />
    <Block x={0} y={0} z={105} w={204} d={6} h={5} top="#f4edd9" front="#cfc5a9" side="#b3ac93" />
  </g>;
}
function Chandelier({ x, y, crystal = false }: { x: number; y: number; crystal?: boolean }) {
  return <g transform={`translate(${(x - y) * .68} ${(x + y) * .25 - 145})`}>
    <path d="M0-28V-12" stroke="#987e43" strokeWidth="1.4" />
    <ellipse cy="-10" rx={crystal ? 19 : 15} ry="5" fill="none" stroke="#d5b360" strokeWidth="1.5" />
    {[-15, -10, -5, 0, 5, 10, 15].map((v, i) => <g key={v}>
      <path d={`M${v}-10V${i % 2 ? 0 : 6}`} stroke={crystal ? "#fff5cf" : "#bba05c"} strokeWidth={crystal ? 1 : 1.5} />
      <rect x={v - 1.5} y={i % 2 ? -4 : 2} width="3" height={crystal ? 7 : 5} rx="1" fill="#fff6d3" />
    </g>)}
    <ellipse cy="4" rx="10" ry="3" fill="none" stroke="#e9d9a2" />
  </g>;
}
function Armchair({ x, y, reverse = false }: { x: number; y: number; reverse?: boolean }) {
  return <g>
    <Block x={x} y={y} z={3} w={12} d={11} h={8} top="#3a493d" front="#27342e" side="#192d29" />
    <Block x={x} y={y + (reverse ? 9 : 0)} z={11} w={12} d={2} h={15} top="#879078" front="#1b302a" side="#435145" />
    <Block x={x} y={y + 1} z={11} w={1.7} d={9} h={4} top="#a18e5f" front="#39463b" side="#2d3930" />
    <Block x={x + 10} y={y + 1} z={11} w={1.7} d={9} h={4} top="#a18e5f" front="#39463b" side="#2d3930" />
    <path d={`M${p(x + 1, y + 10, 4)}L${p(x + 1, y + 10, 0)}M${p(x + 11, y + 10, 4)}L${p(x + 11, y + 10, 0)}`} stroke="#a0a18a" strokeWidth="1" />
  </g>;
}
function Sofa({ x, y, reverse = false }: { x: number; y: number; reverse?: boolean }) {
  return <g>
    <Block x={x} y={y} z={4} w={14} d={28} h={8} top="#aa6048" front="#623e31" side="#57382e" />
    <Block x={x + (reverse ? 12 : 0)} y={y} z={12} w={2} d={28} h={16} top="#b9a06b" front="#794c38" side="#ac7652" />
    {[2, 11, 20].map(v => <g key={v}>
      <Plane x={x + 2} y={y + v} z={12.5} w={10} d={7} fill="#9d4e3a" stroke="#dbb87a" />
      <Plane x={x + 4} y={y + v + 2} z={13} w={5} d={3} fill="#c9a76b" />
    </g>)}
    <Block x={x} y={y} z={12} w={14} d={2} h={5} top="#b59157" front="#70513a" side="#8b6846" />
    <Block x={x} y={y + 26} z={12} w={14} d={2} h={5} top="#b59157" front="#70513a" side="#8b6846" />
  </g>;
}

export function StageScenery({ id }: { id: CheckpointId }) {
  const uid = useId().replace(/:/g, "");
  return <g strokeLinejoin="round" strokeLinecap="round">
    <defs>
      <pattern id={`${uid}-carpet`} width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#9d352f" /><path d="M11 3L13 9 19 11 13 13 11 19 9 13 3 11 9 9Z" fill="none" stroke="#d6ad71" strokeWidth=".8" /><circle cx="11" cy="11" r="2" fill="#e3c18a" /></pattern>
      <pattern id={`${uid}-tiles`} width="13" height="13" patternUnits="userSpaceOnUse"><rect width="13" height="13" fill="#e1dfc8" stroke="#8b9587" strokeWidth=".35" /><path d="M6.5 5C0-1 0 6 5 6.5C-1 13 6 13 6.5 8C13 14 13 6 8 6.5C14 0 6 0 6.5 5Z" fill="#333e37" /></pattern>
      <pattern id={`${uid}-green`} width="14" height="12" patternUnits="userSpaceOnUse"><rect width="14" height="12" fill="#8c995b" /><path d="M0 5L10 8M4 0L2 12M9 0L13 8" stroke="#bdbe7d" strokeWidth=".5" opacity=".65" /></pattern>
    </defs>
    <ellipse cy="29" rx="128" ry="27" fill="#163d3433" />
    {id === "facade" ? <Facade /> : id === "reception" ? <Reception carpet={`url(#${uid}-carpet)`} /> : id === "cabinet" ? <Cabinet carpet={`url(#${uid}-green)`} /> : id === "rooftop" ? <Rooftop /> : <Bunker tiles={`url(#${uid}-tiles)`} />}
  </g>;
}

function Reception({ carpet }: { carpet: string }) {
  return <g>
    <Shell floor="#ad4c3b" left="#e5ddcb" back="#7d3e32" />
    <Windows side="left" colour="#b49458" pleat="#d9bd85" />
    <Panel side="back" start={5} w={194} z={5} h={96} fill="#9b312d" />
    {Array.from({ length: 34 }, (_, i) => <Panel key={i} side="back" start={6 + i * 5.7} w={1.8} z={7} h={91} fill={i % 2 ? "#b6483c" : "#772a29"} />)}
    <Panel side="back" start={5} w={194} z={94} h={7} fill="#c77a4d" />
    <Plane x={5} y={5} w={194} d={135} fill={carpet} />
    <Block x={56} y={10} w={14} d={10} h={27} top="#e3c195" front="#8b6343" side="#775039" />
    <g transform={`translate(${(63 - 15) * .68} ${(63 + 15) * .25 - 91})`}><path d="M-7 12Q-7 3-3 1L-4-5Q0-11 4-5L3 1Q8 5 8 12Z" fill="#c4a773" stroke="#eed39c" strokeWidth=".6" /></g>
    <g transform={`translate(${(111 - 4) * .68} ${(111 + 4) * .25 - 126})`} fill="#eacb70"><path d="M0-6L2-1 7-1 3 2 4 7 0 4-4 7-3 2-7-1-2-1Z" /></g>
    {[28, 62, 96].map(y => <g key={y}><Sofa x={10} y={y} /><Sofa x={178} y={y} reverse /></g>)}
    {[42, 77, 112].map(y => <g key={y}><Block x={36} y={y} z={0} w={13} d={10} h={10} top="#ae8855" front="#66452f" side="#503c2c" /><Block x={153} y={y} z={0} w={13} d={10} h={10} top="#ae8855" front="#66452f" side="#503c2c" /></g>)}
    <Chandelier x={94} y={44} crystal /><Chandelier x={104} y={109} crystal />
    <Block x={0} y={0} z={99} w={7} d={144} h={5} top="#6c4e3b" front="#4b372b" side="#73503b" />
    {[5, 45, 88, 132].map(y => <Block key={y} x={0} y={y} w={7} d={4} h={102} top="#ad895c" front="#68432f" side="#8b6042" />)}
  </g>;
}

function Cabinet({ carpet }: { carpet: string }) {
  const hollow = useId().replace(/:/g, "");
  const chairs = Array.from({ length: 22 }, (_, i) => {
    const a = i / 22 * Math.PI * 2;
    return { x: 101 + Math.cos(a) * 90 - 6, y: 73 + Math.sin(a) * 54 - 5 };
  }).sort((a, b) => a.x + a.y - b.x - b.y);
  return <g>
    <Shell floor={carpet} />
    <Windows side="back" colour="#a5a43d" pleat="#d8cb68" />
    {chairs.filter(c => c.x + c.y < 166).map((c, i) => <Armchair key={i} {...c} />)}
    <g transform="matrix(.68 .25 -.68 .25 0 -68)"><ellipse cx="103" cy="74" rx="77" ry="43" fill="#5e4b32" /></g>
    <g transform="matrix(.68 .25 -.68 .25 0 -75)">
      <defs><clipPath id={`${hollow}-opening`}><ellipse cx="103" cy="74" rx="49" ry="23" /></clipPath></defs>
      <ellipse cx="103" cy="74" rx="77" ry="43" fill="#d1ac6e" stroke="#8b6640" strokeWidth="2" />
      <ellipse cx="103" cy="74" rx="49" ry="23" fill="#6f5837" stroke="#826543" strokeWidth="3" />
      <g clipPath={`url(#${hollow}-opening)`}><ellipse cx="119" cy="90" rx="49" ry="23" fill={carpet} /></g>
    </g>
    {Array.from({ length: 12 }, (_, i) => {
      const angle = i / 12 * Math.PI * 2, x = 103 + Math.cos(angle) * 65, y = 74 + Math.sin(angle) * 33;
      return <g key={i}><path d={`M${p(x, y, 31)}L${p(x, y, 40)}`} stroke="#303b32" strokeWidth="1.2" /><circle cx={(x - y) * .68} cy={(x + y) * .25 - 86} r="1.4" fill="#27372f" /></g>;
    })}
    {chairs.filter(c => c.x + c.y >= 166).map((c, i) => <Armchair key={i} {...c} reverse />)}
    <Chandelier x={80} y={38} /><Chandelier x={123} y={91} />
  </g>;
}

function Bunker({ tiles }: { tiles: string }) {
  return <g>
    <Block x={0} y={0} z={-10} w={204} d={158} h={10} top={tiles} front="#a19f88" side="#757e6e" />
    <Block x={0} y={0} w={4} d={139} h={104} top="#bfc3ad" front="#875441" side="#744936" />
    <Block x={0} y={0} w={145} d={4} h={104} top="#d6c4a3" front="#975740" side="#754735" />
    {Array.from({ length: 24 }, (_, i) => <Panel key={i} side="back" start={6 + i * 5.6} w={.8} z={2} h={96} fill="#714435" />)}
    <Block x={145} y={0} w={59} d={5} h={104} top="#c5c8b5" front="#8d9a8b" side="#7b897c" />
    <Block x={141} y={0} w={5} d={96} h={38} top="#c0c5b0" front="#8d9989" side="#a4ac99" />
    <Block x={198} y={0} w={6} d={155} h={24} top="#d1d0bb" front="#7b897c" side="#9da795" />
    <path d={`M${p(4, 10, 88)}L${p(133, 10, 88)}L${p(133, 10, 65)}`} fill="none" stroke="#d3c3a0" strokeWidth="2" />
    {[16, 57, 98].map((x, i) => <g key={x}>
      <Block x={x} y={13} w={31} d={26} h={25} top="#bab9a0" front="#8d9485" side="#7c877b" />
      <Block x={x + 3} y={16} z={25} w={25} d={17} h={12} top={i % 2 ? "#8e998e" : "#d2cfb7"} front="#a9ad9c" side="#7c887c" />
      <Plane x={x + 4} y={25} z={37} w={22} d={6} fill="#4d5d50" />
      {[0, 1, 2].map(row => <g key={row}>{Array.from({ length: 7 }, (_, col) => <Plane key={col} x={x + 5 + col * 2.8} y={26 + row * 1.5} z={37.3} w={1.4} d={.7} fill="#e5e1c9" />)}</g>)}
      <Block x={x + 6} y={17} z={37} w={18} d={3} h={6} top="#273b31" front="#3c4c40" side="#526254" />
      <Plane x={x + 8} y={15} z={45} w={14} d={5} fill="#f5efda" />
      <Plane x={x + 9} y={47} z={13} w={13} d={11} fill="#b8c0ac" stroke="#5d6d61" />
      <path d={`M${p(x + 9, 47, 0)}L${p(x + 9, 47, 13)}L${p(x + 9, 59, 13)}L${p(x + 9, 59, 30)}L${p(x + 22, 59, 30)}L${p(x + 22, 59, 0)}M${p(x + 9, 59, 13)}L${p(x + 22, 59, 13)}`} stroke="#a9b6a3" strokeWidth="1.5" fill="none" />
    </g>)}
    <g stroke="#f5f3d7" strokeWidth="3"><path d={`M${p(32, 33, 108)}L${p(101, 33, 108)}`} /><path d={`M${p(171, 36, 108)}L${p(171, 101, 108)}`} /></g>
    <path d={`M${p(148, 103, 0)}L${p(148, 153, 0)}L${p(197, 153, 0)}`} fill="none" stroke="#4f6455" strokeWidth="1" />
    <Block x={141} y={125} w={6} d={31} h={38} top="#c0c5b0" front="#7d8b7d" side="#a4ac99" />
  </g>;
}

function Rooftop() {
  return <g>
    <Block x={-4} y={-5} z={-9} w={210} d={145} h={9} top="#aba994" front="#8b8e7b" side="#717d6c" />
    <Block x={-4} y={-5} w={210} d={5} h={16} top="#f0e7cf" front="#d1c5aa" side="#aaac95" />
    <Block x={201} y={-5} w={5} d={145} h={16} top="#f0e7cf" front="#d1c5aa" side="#aaac95" />
    <g transform="matrix(.68 .25 -.68 .25 0 -44)"><circle cx="101" cy="73" r="63" fill="none" stroke="#e7e5d2" strokeWidth="3" /><path d="M80 53V91M118 53V91M80 72H118" stroke="#eee9d5" strokeWidth="6" /></g>
    <g transform="translate(18 -7)">
      <ellipse cy="-38" rx="66" ry="14" fill="#273e3240" />
      <path d="M-44-67L-111-93-109-103-37-79Z" fill="#596d54" stroke="#354d3f" strokeWidth="1" />
      <path d="M-99-94L-104-120-113-117-113-97Z" fill="#6c805d" />
      <path d="M-43-81Q-27-100 12-90L36-78Q55-62 43-51L12-47-42-59Z" fill="#647952" stroke="#344e3d" strokeWidth="1.4" />
      <path d="M-42-79L-27-92-19-83-26-65-40-64Z M-13-89L4-91 10-80 1-66-10-69Z M22-62L39-62 42-51 23-47 12-53Z" fill="#aeac72" />
      <path d="M13-89L30-82 39-73 18-70Z" fill="#9cbdb1" stroke="#263d33" strokeWidth="2" />
      <path d="M-5-91L9-89 13-72-5-75Z" fill="#a0bfb0" stroke="#263d33" strokeWidth="2" />
      <path d="M-22-78V-59M-2-75V-52" stroke="#314c3b" strokeWidth="1.5" />
      <text x="-83" y="-94" fill="#efecce" fontSize="9" fontWeight="700" transform="rotate(16 -83 -94)">445</text>
      <path d="M-28-53L-32-38M23-50L27-32M-47-43L40-25M-42-38L-32-37M28-31L40-25" stroke="#34483c" strokeWidth="3" fill="none" />
      <path d="M-9-91V-109M-113-117L98-101M-48-138L32-81" stroke="#384c41" strokeWidth="3.5" />
      <circle cx="-9" cy="-109" r="4" fill="#c2c5a4" />
    </g>
  </g>;
}

function Facade() {
  return <g>
    <Block x={-6} y={-3} z={-8} w={219} d={145} h={8} top="#a2b182" front="#7f8e67" side="#657d5b" />
    <Block x={8} y={8} w={193} d={65} h={73} top="#e3ddc8" front="#d9d9c5" side="#b5bda8" />
    <Block x={8} y={8} z={73} w={193} d={65} h={5} top="#f5efd9" front="#d9d5bd" side="#c4c7af" />
    <Block x={57} y={14} z={78} w={74} d={36} h={19} top="#f5efdb" front="#dbd9c1" side="#b9bea5" />
    <Plane x={16} y={73.3} z={10} w={176} d={.4} fill="#334e43" />
    <polygon points={`${p(14, 73.2, 15)} ${p(194, 73.2, 15)} ${p(194, 73.2, 64)} ${p(14, 73.2, 64)}`} fill="#758b7a" />
    {[13, 37, 65].map(z => <Block key={z} x={5} y={71} z={z} w={200} d={8} h={4} top="#fcf4dd" front="#e6dfc5" side="#bdc6ad" />)}
    {Array.from({ length: 29 }, (_, i) => {
      const x = 13 + i * 6.3;
      return <g key={i}>
        <polygon points={`${p(x, 78, 39)} ${p(x + 2.7, 78, 39)} ${p(x + 3.8, 78, 51)} ${p(x + 2.7, 78, 63)} ${p(x, 78, 63)} ${p(x - 1, 78, 51)}`} fill="#f4edda" />
        <path d={`M${p(x - 1, 78, 51)}L${p(x + 3.8, 78, 51)}`} stroke="#bdc5ac" strokeWidth=".6" />
        <polygon points={`${p(x, 78, 17)} ${p(x + 2.2, 78, 17)} ${p(x + 2.2, 78, 35)} ${p(x, 78, 35)}`} fill="#ede7d2" />
      </g>;
    })}
    <Block x={76} y={74} w={38} d={3} h={13} top="#486856" front="#24473c" side="#375544" />
    <Block x={73} y={78} w={44} d={15} h={4} top="#efe8d1" front="#c1c6ad" side="#aeb99e" />
    <Block x={68} y={89} w={54} d={6} h={2} top="#dddac0" front="#b0ba9d" side="#9da98d" />
    <g transform="matrix(.68 .25 -.68 .25 0 -44)"><ellipse cx="99" cy="120" rx="31" ry="19" fill="#6e9b94" stroke="#e4dfbd" strokeWidth="5" /></g>
    <g transform={`translate(${(99 - 120) * .68} ${(99 + 120) * .25 - 46})`}><path d="M0 0V-17M0 0Q-8-21-15-4M0 0Q8-21 15-4" stroke="#d7eee0" strokeWidth="1.5" fill="none" /></g>
    <path d={`M${p(95, 25, 97)}L${p(95, 25, 126)}`} stroke="#7e6c4a" strokeWidth="1.5" />
    <path d={`M${p(95, 25, 126)}l22 6-22 7Z`} fill="#ba4c36" /><path d={`M${p(95, 25, 126)}m9 4 1 2 3 0-2 2 1 2-3-1-2 1 0-3-2-1 3 0Z`} fill="#f3d47f" />
  </g>;
}
