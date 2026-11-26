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

- Palace discovery maps, visit timestamps and runs use the existing server history. HCMUS at 227 Nguyễn Văn Cừ now uses four checkpoints, in order: Giảng đường 1, Tòa I, Tòa A, Tòa B. Stable IDs and bilingual sign-reading activities are defined in `lib/hcmus/checkpoints.ts`; verified building-specific stories and photos can be added later. The diagram shows journey order, not surveyed building positions; images are campus overviews. No HCMUS AI model is enabled. Legacy browser progress from `culture-hunt-hcmus-checkpoints-v2` (0–4) is imported into the server profile; older seven-stop and three-story entries are never counted against the reordered journey. XP remains 150 per completed checkpoint; no timestamps or earlier runs are invented.
- Four badges derive from saved completion: first checkpoint, Palace journey, university journey, and both destinations. Replay does not inflate the totals. Where legacy progress has no date, the passport does not invent an earned date.
- Saved destinations and checkpoint-story bookmarks are stored in PostgreSQL and follow the account across devices. Old `culture-hunt-atlas-favorites-v1` bookmarks are imported once for guest profiles.
- Share the whole passport, a destination, an unlocked checkpoint, or an earned badge. The preview is the same PNG offered for download or native file sharing: 1080×1350 for posts, 1080×1920 for stories. Name and card-creation date are hidden by default. Generated cards are labeled as in-game demo achievements. The native share sheet depends on browser/device support; download and copy-text actions remain available. No public share-page hosting or automatic posting is involved.
- The geographic map loads external map resources only when the city Collection map is mounted. A labeled schematic with usable destination buttons remains available if WebGL or the network is unavailable. [Map sources and attribution](public/maps/README.md).

This implementation changes the Collection experience; the existing landing page, journeys, scanner, quizzes, and persistence services retain their behavior.

- Palace runs, recognition events, answer attempts and unique XP awards are stored in Supabase PostgreSQL. The former SQLite database is retained as a local archive and an isolated test backend.
- HTTP-only cookies identify guest profiles and verified Supabase sessions. History survives reloads and server restarts; signing in transfers guest discoveries to the account.
- The server validates checkpoint order, photo recognition, and quiz answers; duplicate successful submissions do not create additional XP. All five checkpoint IDs are shared by the catalog, atlas, recognition service, and journal.
- **Sample mode** deliberately uses a selected bundled reference and is labeled as such. **Reference mode** conservatively identifies near-identical uploaded images using their decoded image signature. Unrelated images do not match; new viewpoints require AI.
- **AI mode** sends the uploaded photo and five labeled reference images to the OpenAI Responses API. Configure `OPENAI_API_KEY`, optionally `OPENAI_VISION_MODEL` (default `gpt-4.1-mini`) and `OPENAI_BASE_URL`. Unknown, ambiguous, mismatched, or failed AI results never unlock a checkpoint. Failed service requests retain the usable reference-photo kit.
- Photos are decoded and resized on the server. Uploaded bytes are not retained in the database. AI analysis can send images to the configured provider; the capture UI explains this before submission. Limits: JPG/PNG/WebP, 5 MB, 25 megapixels.
- Vercel uses the shared PostgreSQL transaction pooler. Recognition throttling remains process-local for this course demo; use shared throttling before a larger public release.

`GET /api/palace` returns the current browser profile's runs and lifetime discoveries. `POST /api/palace` starts/replays a run or submits an answer. `POST /api/palace/recognize` accepts a multipart photo or an explicitly selected sample. `/api/vision` shares that new multipart recognition contract.

```sh
npm test              # Isolated SQLite + reference recognition tests; no paid API requests
npm run check:vision  # Optional live AI smoke check; requires valid credentials
```

## Experience

- A travel-journal introduction with warm paper surfaces, Vietnamese-ready Lora headings, destination photography, a curiosity-pass motif, and a three-step how-to.
- **Bắt đầu khám phá / Start exploring** opens email sign-in / signup or guest entry. `/` opens the introduction; `/?play=1` opens the app. Browser back/forward keeps this flow usable, and the app logo returns to the introduction.
- A mobile-first ink-and-paper travel interface, with destination filters, swipeable cards, saved places and a five-action bottom navigation with a central scanner button.
- VI / EN language selection, remembered in this browser.
- `?lang=vi` / `?lang=en` also render the language on the server. Language selection, Start exploring and guest entry use native GET forms as a fallback while hydration scripts are loading. The existing streamed app shell still requires JavaScript to reveal its resolved content. The landing text stays visible without waiting for an animation; mobile text enlargement can grow the layout instead of covering the header.
- Camera permission flow, photo upload, and a credited reference-photo kit. The Palace supports uploads up to 5 MB; the secondary sample scanner accepts up to 10 MB locally.
- Animated scanner, spring-animated story cards, device text-to-speech in Vietnamese / English.
- Five server-validated Palace checkpoint challenges with 20 reviewed learning tasks for new visits, plus the secondary sample quizzes, hints, retries, fireworks, XP, and badges.
- PostgreSQL Palace history, account-synced campus progress and favorites, native share / clipboard, and an exported PNG achievement card.
- Responsive layouts, keyboard-accessible dialogs and reduced-motion support.

The university scanner still opens **sample content** locally. The Palace uses the recognition and persistence pipeline above. Device text-to-speech voices vary by platform. Social sharing uses the device share sheet or copied text; PNG cards can be posted manually.

## Accounts and Supabase persistence

The app uses Supabase Auth email/password accounts, with server-verified cookie sessions. Auth.js / Google OAuth are removed. Passwords are managed by Supabase Auth; the application never writes them to its own tables. This course demo includes signup, login and logout. Email confirmation and password recovery are outside this demo's scope.

1. Copy [.env.example](./.env.example) to `.env.local`. Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL` (transaction pooler, 6543) and `DIRECT_URL` (session pooler, 5432).
2. In Supabase Authentication, enable Email and disable **Confirm email** for the internal demo. This allows registration without an email sender.
3. Run `npm run db:migrate`. The private `culture_hunt` schema contains profiles, Palace runs, visits, attempts, recognition logs, unique rewards and explorer progress. In Table Editor, select the `culture_hunt` schema to inspect it. User credentials remain in Supabase Authentication > Users.
4. If migrating this local demo, back up `.culture-hunt/palace.sqlite`, then run `npm run db:import-legacy`. It is idempotent and preserves old runs, attempts, recognition events, bank snapshots and lifetime rewards. Do not import another deployment's guest data without its matching browser identities.
5. Run `npm run dev -- --port 3001`, open `http://localhost:3001/?start=1`, and create an account.

Guest users can still play. Login claims guest history into the verified account, unions lifetime rewards and favorites, and keeps both runs if a guest and account already have progress. The further active run resumes; the other is archived. Logout rotates the guest identity. Different accounts do not share progress. Campus/favorite/story-bookmark browser data is imported once; account progress is then read from PostgreSQL on each device. Badges are derived from recorded checkpoint completion, so they also follow the account.

The **Cá nhân / Profile** tab (`/?play=1&view=profile`) opens a personal explorer passport with account identity, storage status, lifetime XP, checkpoint totals, bookmarked stories, saved destinations, badges and the three latest Palace runs. Continue and discovery-map actions reuse the existing journeys and atlas. Guest profiles explain how sign-in keeps their progress. The responsive account dialog keeps its close control visible while the form scrolls; form labels use 14 px text and inputs use 16 px text.

All data requests validate the Supabase user on the server. Database access is parameterized and owner-scoped; the private schema is not exposed through the public Supabase Data API. Client roles have no direct table access or authority to assign XP. Transaction-scoped profile locks serialize duplicate answers and account merges. Queries use the transaction pooler without prepared statements.

### Vercel

Import this GitHub repository in Vercel with the `culture-hunt` app folder as the root directory (if the repo includes the parent folder). Use a supported Node.js version >=22.13, `npm run build`, and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `DATABASE_URL` as environment variables. `DIRECT_URL` is only needed for migration tooling. Keep `CULTURE_HUNT_STORAGE` unset. Apply migrations before deploying; the deployed app uses PostgreSQL and does not rely on a writable filesystem. Reference images are included in the recognition function's file trace.

Local credentials are not uploaded automatically. No OAuth callback or SMTP setup is needed for this internal demo with email confirmation disabled. Add email verification/recovery before opening unrestricted real-world registration.

`npm test` runs isolated SQLite regression tests without cloud writes. `npm run test:database` explicitly tests the configured PostgreSQL backend with disposable QA profiles and removes only its own QA data afterward.

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
- [Persistence service](lib/palace/store.ts): transactional PostgreSQL runs, visits, attempts, guest claims and unique XP; isolated SQLite test backend.
- [Recognition service](lib/palace/recognition.ts): conservative reference matching and optional live AI.
- [Core tests](tests/palace.test.ts): progression, replay, isolation and image-recognition regression checks.
- [Account API](app/api/account/route.ts) and [Account provider](components/UI/AccountProvider.tsx): Supabase email/password sessions.

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
