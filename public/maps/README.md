# Culture Hunt city map

`hcmc-style.json` adapts the OpenFreeMap Positron style from <https://tiles.openfreemap.org/styles/positron>, retrieved on 2026-11-12. Changes use Culture Hunt's paper/green palette and simplify city labels and route shields. The style retains OpenFreeMap vector-tile, glyph and sprite sources. It requires a network connection; the collection includes a labeled schematic fallback if the geographic map cannot initialize.

Map renderer: MapLibre GL JS, BSD-3-Clause, installed through npm. Its worker is resolved through `new URL(..., import.meta.url)` as documented for Next.js/Turbopack in <https://maplibre.org/maplibre-gl-js/docs/>. No manually copied worker bundle is required.

Map attribution is displayed beneath the map: OpenFreeMap, © OpenMapTiles, and © OpenStreetMap contributors. Attribution links:

- <https://openfreemap.org/>
- <https://openmaptiles.org/>
- <https://www.openstreetmap.org/copyright>

The two demo destinations are landmark-level positions, not room coordinates or player GPS data. The university destination represents the 227 Nguyễn Văn Cừ campus. In the campus drill-down, markers are explicitly labeled as illustrative story chapters; no physical room locations have been inferred.

## Local names and landmark illustrations

Label expressions prefer `name:vi`, then `name_vi`, the local `name`, and finally `name:latin`. They do not select English or French translations. Official proper names such as Pasteur remain unchanged. Street geometry and names come from the attributed vector tiles rather than an invented street grid.

`components/atlas/LandmarkModels.tsx` contains two individually authored SVG models, with a shared isometric camera. They replace the generic building marker and also supply the campus building in the university detail map.

- Independence Palace: long modernist facade, bamboo-inspired stone screen, recessed central balconies, flat roof and rooftop pavilion, oval lawn and circular fountain. Reference: the bundled `public/images/palace-exterior.webp` and [the Palace's architectural guide](https://dinhdoclap.gov.vn/kien-truc-dinh-doc-lap/).
- University of Science, 227 Nguyễn Văn Cừ: yellow heritage block, tiled hipped roof and deep eaves, wooden louvred shutters, cream bands and balcony. Reference: the bundled `public/images/hcmus-campus.webp` from [the University's anniversary article](https://hcmus.edu.vn/29-nam-truong-dai-hoc-khoa-hoc-tu-nhien-dhqg-hcm-30-3-1996-30-3-2025/).

These are stylized architectural illustrations based on photographs, not measured 3D surveys or navigation floor plans.

Landmark illustrations and their completion halos follow the map camera: their scale is `2 ** (zoom - 14)`, capped at 1.6 for close-ups. The ground anchor stays at the projected destination coordinate. A 44px button remains available as the artwork shrinks. Below scale 0.3, text labels appear on hover or keyboard focus instead of obscuring the overview. The schematic fallback uses the original illustration size.
