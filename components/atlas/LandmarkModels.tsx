import { Fragment, type ReactNode } from "react";
import type { DestinationId } from "@/lib/atlas/model";

// A shared camera, rather than a shared building: each landmark has its own
// geometry and materials, drawn from the reference photographs in public/images.
type Point = [number, number, number?];
const project = ([x, y, z = 0]: Point) => [42 + .9 * x + .46 * y, 128 + .17 * x - .4 * y - z];
const polygon = (points: Point[]) => points.map(p => project(p).join(",")).join(" ");
const front = (y: number, z = 0) => `matrix(.9 .17 0 1 ${42 + .46 * y} ${128 - .4 * y - z})`;

function Surface({ points, fill, stroke }: { points: Point[]; fill: string; stroke?: string }) {
  return <polygon points={polygon(points)} fill={fill} stroke={stroke} strokeWidth=".7" strokeLinejoin="round" />;
}

function Block({ x, y, w, d, h, z = 0, colors }: { x: number; y: number; w: number; d: number; h: number; z?: number; colors: [string, string, string] }) {
  return <>
    <Surface points={[[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]} fill={colors[1]} />
    <Surface points={[[x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h]]} fill={colors[0]} />
    <Surface points={[[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]} fill={colors[2]} />
  </>;
}

function Tree({ x, y, palm = false, scale = 1 }: { x: number; y: number; palm?: boolean; scale?: number }) {
  const [sx, sy] = project([x, y]);
  return <g transform={`translate(${sx} ${sy}) scale(${scale})`}>
    <ellipse cy="2" rx="10" ry="4" fill="#214b3824" />
    <path d="M0 0Q2-12 0-25" fill="none" stroke="#887756" strokeWidth={palm ? 1.8 : 3} />
    {palm ? <g fill="#3e7554" stroke="#376349" strokeWidth=".5">
      <path d="M0-24Q-14-32-18-23Q-8-27 0-24M0-24Q14-34 18-25Q8-28 0-24M0-24Q-6-39-10-33Q-4-33 0-24M0-24Q7-40 12-33Q5-32 0-24M0-24Q-15-23-12-15Q-9-22 0-24M0-24Q14-22 11-15Q8-21 0-24" />
    </g> : <><ellipse cy="-22" rx="12" ry="16" fill="#477650" /><ellipse cx="-5" cy="-27" rx="9" ry="12" fill="#689260" /><ellipse cx="3" cy="-32" rx="7" ry="9" fill="#7c9f69" /></>}
  </g>;
}

function Island({ children }: { children: ReactNode }) {
  return <>
    <ellipse cx="139" cy="167" rx="115" ry="32" fill="#163b3220" />
    <Surface points={[[-10, -77, -5], [192, -77, -5], [192, 110, -5], [-10, 110, -5]]} fill="#7e906b" />
    <Surface points={[[-10, -77], [192, -77], [192, 110], [-10, 110]]} fill="#bac79b" stroke="#e8e3c6" />
    {children}
  </>;
}

function PalaceLandmark() {
  return <Island>
    {/* Oval lawn, circular fountain and loop drive in front of the main facade. */}
    <g transform="matrix(.9 .17 .46 -.4 42 128)">
      <ellipse cx="91" cy="-18" rx="85" ry="53" fill="#e6dfc9" />
      <ellipse cx="91" cy="-18" rx="76" ry="45" fill="#8eac6e" stroke="#eae5c9" strokeWidth="2" />
      <path d="M15-18H167M91-63V27" stroke="#b7c594" strokeWidth="1.6" />
      <circle cx="91" cy="-18" r="14" fill="#e6e2cb" stroke="#668467" strokeWidth="2" />
      <circle cx="91" cy="-18" r="10" fill="#8db9b2" stroke="#f4efdc" strokeWidth="1.5" />
    </g>
    <Tree x={-3} y={84} scale={1.15} /><Tree x={185} y={89} scale={1.1} />
    <Block x={0} y={43} w={180} d={53} h={49} colors={["#eee9d7", "#b3bcb0", "#f7f3e5"]} />
    {/* Recessed ground-floor gallery and the tall bamboo-inspired stone screen. */}
    <g transform={front(43)}>
      <path d="M4-12H176V-1H4Z" fill="#3a514a" />
      {Array.from({ length: 14 }, (_, i) => <rect key={i} x={5 + i * 12.8} y="-12" width="2.5" height="13" fill="#e9e6d8" />)}
      <path d="M23-46H157V-15H23Z" fill="#75867e" />
      <path d="M23-31H157M23-17H157" stroke="#c6c9bc" strokeWidth="1.5" />
      {Array.from({ length: 30 }, (_, i) => <path key={i} d={`M${25 + i * 4.45}-46v4l-1.1 3 1.1 3v9l-1.1 3 1.1 3v6`} stroke="#f7f4e7" strokeWidth="2" fill="none" />)}
      {[0, 162].map(x => <g key={x}>
        {[0, 1, 2].map(row => <g key={row}>{[5, 12].map(col => <rect key={col} x={x + col} y={-43 + row * 10} width="4.5" height="7" fill="#7a8982" stroke="#f8f3e4" strokeWidth=".7" />)}</g>)}
      </g>)}
      <path d="M0-49H180M0-14H180M0-1H180" stroke="#fcf8ea" strokeWidth="2.5" />
      <path d="M79-35H101V-13H79Z" fill="#2f4742" stroke="#f8f3e3" strokeWidth="2" />
      <path d="M77-37H103M76-14H104M73-5H107" stroke="#e9e5d4" strokeWidth="3" />
      <path d="M82-34V-17M98-34V-17" stroke="#bcc5b9" strokeWidth="1.2" />
    </g>
    {/* Side openings and roof parapets keep the long, flat modernist silhouette. */}
    {[56, 70, 84].map(y => <Surface key={y} points={[[180, y, 16], [180, y + 6, 16], [180, y + 6, 44], [180, y, 44]]} fill="#74897d" />)}
    <Surface points={[[1, 45, 50], [179, 45, 50], [179, 94, 50], [1, 94, 50]]} fill="#dddecf" stroke="#faf5e6" />
    <Surface points={[[6, 51, 50.5], [174, 51, 50.5], [174, 88, 50.5], [6, 88, 50.5]]} fill="#bac2b2" />
    <Block x={65} y={63} w={48} d={28} h={11} z={51} colors={["#edf0df", "#9eafa1", "#f6f1df"]} />
    <g transform={front(63, 51)}><path d="M69-9H109V0H69Z" fill="#4d655b" />{[70, 79, 88, 97, 106].map(x => <path key={x} d={`M${x}-9V0`} stroke="#e9e8d6" strokeWidth="1.5" />)}</g>
    <Surface points={[[62, 60, 63], [116, 60, 63], [116, 94, 63], [62, 94, 63]]} fill="#b76a54" stroke="#ece5cf" />
    <Block x={7} y={76} w={17} d={13} h={2} z={51} colors={["#c6c4b0", "#a9b7a1", "#bc785d"]} />
    <Block x={153} y={76} w={17} d={13} h={2} z={51} colors={["#c6c4b0", "#a9b7a1", "#bc785d"]} />
    <g transform={front(43)}><path d="M91-36V-77" stroke="#dfdac6" strokeWidth="1.2" /><path d="M92-77l14 2v8l-14-2Z" fill="#bd4e3e" /><path d="M98-74l.7 1.8 2 .3-1.6 1.1.4 1.9-1.6-1.2-1.6 1 .6-1.8-1.4-1.3 1.9.1Z" fill="#f5d58c" /></g>
    {[0, 1, 2].map(i => <Surface key={i} points={[[73 - i * 2, 41 - i * 4, -i], [108 + i * 2, 41 - i * 4, -i], [108 + i * 2, 46 - i * 4, -i], [73 - i * 2, 46 - i * 4, -i]]} fill={i % 2 ? "#b5baa5" : "#eee7d3"} />)}
    <Tree x={0} y={18} palm /><Tree x={180} y={18} palm /><Tree x={-4} y={-43} scale={.8} /><Tree x={186} y={-44} scale={.85} />
    <g transform={`translate(${project([91, -18]).join(" ")})`}><path d="M0 1Q-3-11 0-17Q3-11 0 1" fill="#e7f5df" opacity=".9" /><ellipse cy="1" rx="6" ry="2" fill="none" stroke="#d8ede0" strokeWidth=".8" /></g>
  </Island>;
}

function CampusLandmark({ landscape }: { landscape: boolean }) {
  const Ground = landscape ? Island : Fragment;
  return <Ground>
    {landscape && <>
      <Surface points={[[3, -52], [179, -52], [179, 44], [3, 44]]} fill="#ddd9be" />
      <Surface points={[[60, -53], [114, -53], [114, 37], [60, 37]]} fill="#eee7d0" />
      <Tree x={-1} y={87} scale={1.2} /><Tree x={183} y={98} scale={1.3} />
    </>}
    {/* The yellow heritage block at 227 Nguyen Van Cu: long tiled roofs,
        wooden louvres, cream bands, deep eaves and a central balcony. */}
    <Block x={0} y={41} w={180} d={51} h={62} colors={["#e4c985", "#b8a468", "#ead7a4"]} />
    <g transform={front(41)}>
      {[0, 1, 2].map(row => <g key={row}>
        {Array.from({ length: 9 }, (_, col) => <g key={col} transform={`translate(${6 + col * 19} ${-58 + row * 20})`}>
          <rect width="11" height="15" fill="#4e5540" stroke="#f2dfad" strokeWidth="1" />
          <path d="M0 0H4V15H0ZM7 0H11V15H7Z" fill="#655840" />
          {[3, 5, 7, 9, 11, 13].map(y => <path key={y} d={`M.5 ${y}H3.5M7.5 ${y}H10.5`} stroke="#9a8152" strokeWidth=".5" />)}
          <path d="M-1 16H12" stroke="#f5e4b9" strokeWidth="1.6" />
        </g>)}
        <path d={`M0 ${-40 + row * 20}H180`} stroke="#f2dfad" strokeWidth="2.5" />
      </g>)}
      {[1, 39, 77, 115, 153, 178].map(x => <path key={x} d={`M${x}-61V0`} stroke="#f4dfac" strokeWidth="2.1" />)}
      <path d="M0-3H180" stroke="#baa777" strokeWidth="3" />
    </g>
    {[53, 68, 82].map(y => <Surface key={y} points={[[180, y, 6], [180, y + 7, 6], [180, y + 7, 56], [180, y, 56]]} fill="#736c49" />)}
    {/* Hipped roof, with tile seams; no invented pediment or tower. */}
    <Surface points={[[-7, 35, 63], [187, 35, 63], [169, 67, 77], [12, 67, 77]]} fill="#b86845" stroke="#7a4e35" />
    <Surface points={[[187, 35, 63], [187, 98, 63], [169, 67, 77]]} fill="#8e5037" stroke="#744b34" />
    <Surface points={[[-7, 98, 63], [187, 98, 63], [169, 67, 77], [12, 67, 77]]} fill="#cb8257" />
    {Array.from({ length: 37 }, (_, i) => <Surface key={i} points={[[i * 4.9 - 3, 35, 63.2], [i * 4.3 + 10, 67, 77.2], [i * 4.3 + 10.7, 67, 77.2], [i * 4.9 - 2.3, 35, 63.2]]} fill="#db9a6b" />)}
    <Surface points={[[12, 66, 78], [169, 66, 78], [169, 68, 78], [12, 68, 78]]} fill="#e7ab78" />
    {[22, 42].map(z => <g key={z}>
      <Surface points={[[-6, 30, z], [186, 30, z], [181, 41, z + 5], [-1, 41, z + 5]]} fill="#b66a45" stroke="#915739" />
      <g transform={front(30, z)}>
        <path d="M-6 0H186" stroke="#f0d6a0" strokeWidth="1.2" />
        {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${i * 19 + 1} 1v5l6-4`} stroke="#e6cd98" strokeWidth="1" fill="none" />)}
        {Array.from({ length: 47 }, (_, i) => <path key={i} d={`M${i * 4 - 4} 0l2-4`} stroke="#df9c67" strokeWidth=".6" />)}
      </g>
    </g>)}
    <Block x={73} y={30} w={34} d={12} h={7} z={22} colors={["#f0d9a5", "#b4a273", "#f8e6bd"]} />
    <g transform={front(30, 22)}>
      <path d="M77-6V0M81-6V0M85-6V0M89-6V0M93-6V0M97-6V0M101-6V0" stroke="#bca474" strokeWidth="1.3" />
      <path d="M109-10V9M109-9l8 6-8 1Z" stroke="#9b6f4c" strokeWidth=".7" fill="#bb513b" />
    </g>
    <Surface points={[[73, 24, 0], [110, 24, 0], [110, 31, 0], [73, 31, 0]]} fill="#f7e4bc" />
    {landscape && <><Tree x={-4} y={-48} scale={1.1} /><Tree x={183} y={-39} scale={1.1} />
      <Tree x={13} y={-2} scale={.7} /><Tree x={158} y={-13} scale={.75} /></>}
  </Ground>;
}

export default function LandmarkModel({ destination, className = "atlas-landmark-art", landscape = true }: { destination: DestinationId; className?: string; landscape?: boolean }) {
  return <svg viewBox="0 0 280 216" className={className} data-landmark={destination} aria-hidden="true">
    {destination === "palace" ? <PalaceLandmark /> : <CampusLandmark landscape={landscape} />}
  </svg>;
}
