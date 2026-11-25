# Culture Hunt

Playable heritage-exploration demo focused on **Dinh Độc Lập**, with a secondary sample experience for **Trường ĐH Khoa học Tự nhiên, ĐHQG-HCM**.

## Run locally

```sh
npm install # Node.js 22.13 or newer (SQLite support)
npm run dev
```

Open http://localhost:3000. Production checks: `npm run build` and `npm run lint`.

## Present the Palace demo

Open [the Palace journey](http://localhost:3000/?play=1&place=palace&view=journeys&lang=vi), or choose **Khám phá Dinh Độc Lập** from the app. The landing-page destination cards also remember the destination through guest entry.

1. Start at **Mặt tiền Dinh**, the only available checkpoint. The map can be dragged and zoomed; the explorer represents game progress.
2. Select **Khám phá điểm này**, then **Dùng ảnh mẫu của điểm này** and **Nhận diện địa điểm**. No AI key is needed for the sample kit.
3. Solve four evidence-led tasks at each checkpoint to unlock its written/audio story and record the discovery. The reviewed journey contains 20 bilingual tasks and five photograph-based reveals. Wrong answers can be retried; reload resumes the next unanswered question. Earlier banks and photo/puzzle/circuit mini games are retired.

4. Claim the discovery. The checkpoint and route illuminate, the explorer moves, and the next checkpoint opens. Continue through **Phòng Khánh tiết**, **Phòng Nội các**, **Trực thăng trên mái**, and **Thông tin dưới hầm**.
5. After all five, open **Dấu ấn** to see the complete discovery atlas, Palace Explorer badge, dated visits, recognition method, and answer attempts. Filter the map by run or view all lifetime discoveries.
6. **Chơi lượt mới** retains earlier visits and starts a fresh route. Each checkpoint awards 150 lifetime XP once; replay cannot farm XP. Reloading resumes the current run.

The photo kit also lets you download any reference photo, upload it through the real file input, and identify it again. Selecting another checkpoint's sample produces a mismatch and does not unlock the current checkpoint.

The map is an authored illustrative atlas, not a measured floor plan or physical-navigation service. Sample play and uploaded-photo recognition do not prove attendance at the Palace.

### Map design checkpoint

The original architectural atlas and the complete working demo are preserved in Git commit `3d078bd`, tagged `palace-atlas-v1`. The current map uses five 2.5D stage dioramas, a winding route, an explorer that walks after reward dialogs close, and illuminated completion tokens. Both designs share the same checkpoint IDs, recognition, quizzes, and saved history.

Room dioramas now follow the visible features of the official photographs: patterned red carpet and ceremonial seating; an open-centred oval conference table, microphones and dark leather chairs; the camouflaged rooftop UH-1; and desk-mounted teletypes beside a concrete corridor. Selecting an available stage opens a side-by-side diorama/photo study. These are cutaway illustrations rather than measured architectural reconstructions.

### Supplied question banks

[Current workbook source](content/palace/question-bank-v2.source.json) preserves 30 tasks and five story drafts from `CultureHunt.xlsx`. [Reviewed bilingual learning journey](content/palace/question-bank-v3.json) publishes 20 tasks with visible clues, source photographs and one reveal per checkpoint. The workbook originals and earlier review remain archived. [Editorial notes and sources](content/palace/README.md) document these decisions. The previous bank is retired. Unfinished active visits update automatically; completed history remains saved.

The server snapshots the workbook at recognition and awards unique XP only after every question is correct. Unfinished active visits automatically adopt the workbook. Earlier attempts, completed/abandoned history and lifetime awards are preserved. Removed mini game endpoints cannot complete checkpoints.

## Persistence and image recognition

### Collection / Explorer passport demo

Open `/?play=1&view=collection&lang=vi`. The Collection starts with a MapLibre geographic map of central Ho Chi Minh City, styled with OpenFreeMap/OSM data, with Palace and University of Science landmark markers. Selecting a landmark opens its local discovery atlas. Browser back/forward and the `atlas` / `atlasTab` query parameters preserve the city/destination/tab context.

- Palace discovery maps, visit timestamps and runs use the existing server history. HCMUS at 227 Nguyễn Văn Cừ now uses four checkpoints, in order: Giảng đường 1, Tòa I, Tòa A, Tòa B. Stable IDs and bilingual sign-reading activities are defined in `lib/hcmus/checkpoints.ts`; verified building-specific stories and photos can be added later. The diagram shows journey order, not surveyed building positions; images are campus overviews. No HCMUS AI model is enabled. Browser progress uses `culture-hunt-hcmus-checkpoints-v2` (0–4); older seven-stop and three-story progress entries are retained but never counted against the reordered journey. XP remains 150 per completed checkpoint; no timestamps or earlier runs are invented.
- Four badges derive from saved completion: first checkpoint, Palace journey, university journey, and both destinations. Replay does not inflate the totals. Where legacy progress has no date, the passport does not invent an earned date.
- Save destination cards using the existing favorites, or bookmark individual checkpoint stories in `culture-hunt-atlas-favorites-v1`. Saved stories survive reload in the same browser.
- Share the whole passport, a destination, an unlocked checkpoint, or an earned badge. The preview is the same PNG offered for download or native file sharing: 1080×1350 for posts, 1080×1920 for stories. Name and card-creation date are hidden by default. Generated cards are labeled as in-game demo achievements. The native share sheet depends on browser/device support; download and copy-text actions remain available. No public share-page hosting or automatic posting is involved.
- The geographic map loads external map resources only when the city Collection map is mounted. A labeled schematic with usable destination buttons remains available if WebGL or the network is unavailable. [Map sources and attribution](public/maps/README.md).

This implementation changes the Collection experience; the existing landing page, journeys, scanner, quizzes, and persistence services retain their behavior.

- Palace runs, recognition events, answer attempts, and unique XP awards live in a SQLite database at `.culture-hunt/palace.sqlite`. Database files are ignored by Git. Set `CULTURE_HUNT_DATA_DIR` to a persistent writable directory when hosting.
- An HTTP-only, same-site cookie identifies the demo browser profile. History survives reloads and server restarts with the same database and cookie. This profile is currently separate from Google account sign-in; cross-device/account synchronization is not implemented.
- The server validates checkpoint order, photo recognition, and quiz answers; duplicate successful submissions do not create additional XP. All five checkpoint IDs are shared by the catalog, atlas, recognition service, and journal.
- **Sample mode** deliberately uses a selected bundled reference and is labeled as such. **Reference mode** conservatively identifies near-identical uploaded images using their decoded image signature. Unrelated images do not match; new viewpoints require AI.
- **AI mode** sends the uploaded photo and five labeled reference images to the OpenAI Responses API. Configure `OPENAI_API_KEY`, optionally `OPENAI_VISION_MODEL` (default `gpt-4.1-mini`) and `OPENAI_BASE_URL`. Unknown, ambiguous, mismatched, or failed AI results never unlock a checkpoint. Failed service requests retain the usable reference-photo kit.
- Photos are decoded and resized on the server. Uploaded bytes are not retained in the database. AI analysis can send images to the configured provider; the capture UI explains this before submission. Limits: JPG/PNG/WebP, 5 MB, 25 megapixels.
- Use a persistent Node server/volume for this SQLite demo. A serverless deployment with ephemeral disks or multiple replicas needs a shared database and rate limiter before relying on durable history.

`GET /api/palace` returns the current browser profile's runs and lifetime discoveries. `POST /api/palace` starts/replays a run or submits an answer. `POST /api/palace/recognize` accepts a multipart photo or an explicitly selected sample. `/api/vision` shares that new multipart recognition contract.

```sh
npm test              # Isolated SQLite + reference recognition tests; no paid API requests
npm run check:vision  # Optional live AI smoke check; requires valid credentials
```

## Experience

- A travel-journal introduction with warm paper surfaces, Vietnamese-ready Lora headings, destination photography, a curiosity-pass motif, and a three-step how-to.
- **Bắt đầu khám phá / Start exploring** opens Google sign-in or guest entry. `/` opens the introduction; `/?play=1` opens the app. Browser back/forward keeps this flow usable, and the app logo returns to the introduction.
- A mobile-first ink-and-paper travel interface, with destination filters, swipeable cards, saved places and a five-action bottom navigation with a central scanner button.
- VI / EN language selection, remembered in this browser.
- `?lang=vi` / `?lang=en` also render the language on the server. Language selection, Start exploring and guest entry use native GET forms as a fallback while hydration scripts are loading. The existing streamed app shell still requires JavaScript to reveal its resolved content. The landing text stays visible without waiting for an animation; mobile text enlargement can grow the layout instead of covering the header.
- Camera permission flow, photo upload, and a credited reference-photo kit. The Palace supports uploads up to 5 MB; the secondary sample scanner accepts up to 10 MB locally.
- Animated scanner, spring-animated story cards, device text-to-speech in Vietnamese / English.
- Five server-validated Palace checkpoint challenges with 20 reviewed learning tasks for new visits, plus the secondary sample quizzes, hints, retries, fireworks, XP, and badges.
- SQLite Palace history, localStorage secondary sample progress, native share / clipboard, and an exported PNG achievement card.
- Responsive layouts, keyboard-accessible dialogs and reduced-motion support.

The university scanner still opens **sample content** locally. The Palace uses the recognition and persistence pipeline above. Device text-to-speech voices vary by platform. Social sharing uses the device share sheet or copied text; PNG cards can be posted manually.

## Google / Gmail sign-in

The Google OAuth flow uses Auth.js with encrypted JWT sessions. No database is required for account sign-in. Only the basic Google profile and email are requested; the app does not access Gmail messages.

1. Create a **Web application** OAuth client in Google Cloud Console and configure its consent screen / test users as appropriate.
2. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. Add your deployed origin with the same callback path for production.
3. Copy `.env.example` to `.env.local` and fill `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET` and `AUTH_URL`. Generate a secret with `npx auth secret`.
4. Restart the dev server. Configure these variables in your hosting environment for deployment.

Without these variables, the account dialog explains that Google sign-in is not yet connected and offers guest mode. No fake account is created. Palace history is saved under the demo browser cookie, independently of Google sign-in. Actual Google sign-in requires valid OAuth credentials and has not been verified with a real account in this demo.

Auth.js setup: https://authjs.dev/getting-started/providers/google

## Main files

- `components/UI/CultureHunt.tsx`: main game layout and progress flow.
- `components/UI/LandingPage.tsx`: introductory page and destination previews.
- `components/UI/landing.css`: responsive travel-journal styling for the introduction.
- `components/UI/GameElements.tsx`: shared brand, language switch, XP bar and badges.
- `components/UI/ArtifactScanner.tsx`: camera, local images, scanner animation.
- `components/UI/StoryCard.tsx`, `QuizCard.tsx`, `Fireworks.tsx`: storytelling and game feedback.
- `components/UI/LanguageProvider.tsx`: language preference and bilingual UI.
- `components/UI/game-data.ts`: typed bilingual fixtures, designed to be replaced by the upcoming dataset/API.
- `components/UI/game.css`: responsive visual system.
- [PalaceExperience](components/palace/PalaceExperience.tsx): map, recognition, story, quiz, completion and journal screens.
- [Checkpoint catalog](lib/palace/checkpoints.ts): five bilingual checkpoints, credited photographs and curated quizzes.
- [Persistence service](lib/palace/store.ts): transactional SQLite runs, visits, attempts and unique XP.
- [Recognition service](lib/palace/recognition.ts): conservative reference matching and optional live AI.
- [Core tests](tests/palace.test.ts): progression, replay, isolation and image-recognition regression checks.
- `auth.ts`, `app/api/auth/[...nextauth]/route.ts`: Google OAuth integration.

## Content and photographs

Sample texts and photographs are sourced from the official destination websites. Sources are also linked from each story card:

- Dinh Độc Lập: https://dinhdoclap.gov.vn/kien-truc-dinh-doc-lap/
- Palace panorama: https://dinhdoclap.gov.vn/anh-dinh-doc-lap-noi-luu-giu-dau-an-sau-50-nam-giai-phong/
- University of Science: https://hcmus.edu.vn/29-nam-truong-dai-hoc-khoa-hoc-tu-nhien-dhqg-hcm-30-3-1996-30-3-2025/

Photographs remain the property of their respective rights holders. No affiliation with the destinations is implied.

The four additional Palace photographs are downloaded from the official photo article above: reception (`9976-7.jpg`), cabinet (`9976-16.jpg`), rooftop (`9976-19.jpg`), and bunker (`9976-22.jpg`), and optimized as local WebP assets. The historical information and visual observation prompts are curated for this educational demo.

Development skills used: `frontend-design`, the installed OpenAI `playwright` skill, and the custom `culture-hunt-gameplay` skill (installed in the developer's Codex skills directory).

## Palace quiz and narration

The Palace demo follows **identify a photo -> complete four evidence-led tasks -> unlock written/audio storytelling**. Old detail-finding, picture-puzzle and circuit mini games are removed from the interface and API. Learning interactions include single/multiple selection, ordering and matching, supported by credited high-resolution photographs and contextual records.

- [Reviewed learning script](content/palace/question-bank-v3.json)
- [Quiz interface](components/palace/PalaceQuestionInput.tsx)
- [Bilingual story scripts](content/palace/stories-v3.json)
- [Narration provenance](public/audio/palace-learning/manifest.json)

Saved MP3 previews remain consistent with their transcripts. Tests cover active-bank migration, quiz gates, replay and unique XP.
