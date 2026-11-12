import type { Locale } from "@/components/UI/LanguageProvider";
import { getPlaces, type Place } from "@/components/UI/game-data";
import { getCheckpoints } from "@/lib/palace/checkpoints";
import type { PalaceState } from "@/lib/palace/types";

export type DestinationId = Place["id"];
export type AtlasStop = { id: string; title: string; story: string; photo: string; done: boolean; at?: string; method?: string };
export type AtlasDestination = { id: DestinationId; title: string; shortTitle: string; subtitle: string; address: string; coordinates: [number, number]; photo: string; completed: number; total: number; xp: number; stops: AtlasStop[]; at?: string };
export type AtlasBadge = { id: string; title: string; description: string; earned: boolean; progress: number; total: number; destinationId?: DestinationId; at?: string; icon: "compass" | "palace" | "science" | "city" };
export type ShareTarget = { kind: "city" | "destination" | "checkpoint" | "badge"; title: string; subtitle: string; completed: number; total: number; xp: number; destinationId?: DestinationId; badgeId?: string; at?: string; marks?: { id: DestinationId; completed: number; total: number }[] };

export const destinationLocations = [
  { id: "palace" as const, coordinates: [106.6953, 10.7770] as [number, number], city: "hcmc" },
  { id: "hcmus" as const, coordinates: [106.6822, 10.7629] as [number, number], city: "hcmc" },
];

export function atlasDestinations(locale: Locale, palace: PalaceState | null, universityProgress: number): AtlasDestination[] {
  const places = getPlaces(locale);
  return destinationLocations.map(location => {
    const place = places.find(p => p.id === location.id)!;
    const stops: AtlasStop[] = location.id === "palace" ? getCheckpoints(locale).map(cp => {
      const visits = (palace?.runs || []).flatMap(run => run.visits[cp.id]?.completedAt ? [run.visits[cp.id]!] : []).sort((a, b) => a.completedAt!.localeCompare(b.completedAt!));
      const first = visits[0];
      return { id: cp.id, title: cp.name, story: cp.mission.story, photo: cp.photo, done: palace?.discovered.includes(cp.id) || false, at: first?.completedAt || undefined, method: first?.mode };
    }) : place.missions.map((m, i) => ({ id: `chapter-${i + 1}`, title: m.title, story: m.story, photo: place.coverImage, done: i < Math.max(0, Math.min(place.missions.length, universityProgress)) }));
    const completed = stops.filter(s => s.done).length;
    return { id: location.id, title: place.name, shortTitle: place.shortName, subtitle: locale === "vi" ? location.id === "palace" ? "Kiến trúc · Lịch sử · Ký ức" : "Tri thức · Cội nguồn · Khám phá" : location.id === "palace" ? "Architecture · History · Memory" : "Science · Origins · Discovery", address: place.address, coordinates: location.coordinates, photo: place.coverImage, completed, total: stops.length, xp: completed * 150, stops, at: stops.flatMap(s => s.at ? [s.at] : []).sort().at(-1) };
  });
}

export function atlasBadges(destinations: AtlasDestination[], locale: Locale): AtlasBadge[] {
  const vi = locale === "vi";
  const total = destinations.reduce((n, d) => n + d.completed, 0);
  const dates = destinations.flatMap(d => d.stops.flatMap(s => s.at ? [s.at] : [])).sort();
  return [
    { id: "first-step", title: vi ? "Bước chân đầu tiên" : "First footsteps", description: vi ? "Hoàn thành checkpoint đầu tiên ở bất kỳ địa điểm nào." : "Complete your first checkpoint at any destination.", earned: total > 0, progress: Math.min(1, total), total: 1, at: destinations.some(d => d.id === "hcmus" && d.completed > 0) ? undefined : dates[0], icon: "compass" },
    ...destinations.map(d => ({ id: `${d.id}-explorer`, title: vi ? d.id === "palace" ? "Nhà thám hiểm Dinh" : "Người theo dấu tri thức" : d.id === "palace" ? "Palace explorer" : "Knowledge seeker", description: vi ? `Hoàn thành ${d.total} checkpoint tại ${d.shortTitle}.` : `Complete all ${d.total} checkpoints at ${d.shortTitle}.`, earned: d.completed === d.total, progress: d.completed, total: d.total, destinationId: d.id, at: d.at, icon: d.id === "palace" ? "palace" as const : "science" as const })),
    { id: "saigon-connected", title: vi ? "Sài Gòn kết nối" : "Saigon connections", description: vi ? "Hoàn thành hành trình ở cả hai địa điểm của bản demo." : "Complete the journeys at both demo destinations.", earned: destinations.every(d => d.completed === d.total), progress: destinations.filter(d => d.completed === d.total).length, total: destinations.length, at: destinations.every(d => d.at) ? dates.at(-1) : undefined, icon: "city" },
  ];
}

export function destinationShare(d: AtlasDestination): ShareTarget {
  return { kind: "destination", title: d.shortTitle, subtitle: d.subtitle, completed: d.completed, total: d.total, xp: d.xp, destinationId: d.id, at: d.at };
}
