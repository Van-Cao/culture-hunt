# Culture Hunt city map

`hcmc-style.json` adapts the OpenFreeMap Positron style from <https://tiles.openfreemap.org/styles/positron>, retrieved on 2026-11-12. Changes use Culture Hunt's paper/green palette and simplify city labels and route shields. The style retains OpenFreeMap vector-tile, glyph and sprite sources. It requires a network connection; the collection includes a labeled schematic fallback if the geographic map cannot initialize.

Map renderer: MapLibre GL JS, BSD-3-Clause, installed through npm. Its worker is resolved through `new URL(..., import.meta.url)` as documented for Next.js/Turbopack in <https://maplibre.org/maplibre-gl-js/docs/>. No manually copied worker bundle is required.

Map attribution is displayed beneath the map: OpenFreeMap, © OpenMapTiles, and © OpenStreetMap contributors. Attribution links:

- <https://openfreemap.org/>
- <https://openmaptiles.org/>
- <https://www.openstreetmap.org/copyright>

The two demo destinations are landmark-level positions, not room coordinates or player GPS data. The university destination represents the 227 Nguyễn Văn Cừ campus. In the campus drill-down, markers are explicitly labeled as illustrative story chapters; no physical room locations have been inferred.
