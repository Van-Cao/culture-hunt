# Culture Hunt

UI/UX prototype for a gamified discovery experience at **Dinh Độc Lập** and **Trường ĐH Khoa học Tự nhiên, ĐHQG-HCM**.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Production checks: `npm run build` and `npm run lint`.

## Experience

- A photo-led introductory page inspired by the supplied travel video, with destination previews, a short how-to and **Get started**.
- Get started opens Google sign-in or guest entry. `/` opens the introduction; `/?play=1` opens the app. Browser back/forward keeps this flow usable, and the app logo returns to the introduction.
- A mobile-first blue-and-white travel interface adapted from the supplied Figma mobile screens, with destination filters, swipeable cards, saved places and a five-action bottom navigation with a central scanner button.
- VI / EN language selection, remembered in this browser.
- `?lang=vi` / `?lang=en` also render the language on the server. Language selection, Get started and guest entry use native GET forms as a fallback while JavaScript is loading. The landing text stays visible without waiting for an animation; mobile text enlargement can grow the layout instead of covering the header.
- Camera permission flow, local photo selection (JPG / PNG / WebP, up to 10 MB), and a sample image.
- Animated scanner, spring-animated story cards, device text-to-speech in Vietnamese / English.
- Three A–D quizzes per destination, hints, retry feedback, Framer Motion fireworks, XP and optional reward sounds.
- Independent destination progress saved in localStorage, badge collection, native share / clipboard, and an exported PNG card for Facebook / Instagram.
- Responsive layouts, keyboard-accessible dialogs and reduced-motion support.

The scanner opens **sample content**. It does not identify an uploaded image, call an AI service, upload photos, validate GPS check-ins, or sync progress between accounts/devices. Text-to-speech voices depend on the device. Social sharing uses the device share sheet or copied text; PNG cards can be posted manually.

## Google / Gmail sign-in

The Google OAuth flow uses Auth.js with encrypted JWT sessions. No database is required for account sign-in. Only the basic Google profile and email are requested; the app does not access Gmail messages.

1. Create a **Web application** OAuth client in Google Cloud Console and configure its consent screen / test users as appropriate.
2. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. Add your deployed origin with the same callback path for production.
3. Copy `.env.example` to `.env.local` and fill `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET` and `AUTH_URL`. Generate a secret with `npx auth secret`.
4. Restart the dev server. Configure these variables in your hosting environment for deployment.

Without these variables, the account dialog explains that Google sign-in is not yet connected and offers guest mode. No fake account is created. Progress remains browser-local even after sign-in. Actual Google account sign-in requires valid OAuth credentials and has not been verified with a real account in this prototype.

Auth.js setup: https://authjs.dev/getting-started/providers/google

## Main files

- `components/UI/CultureHunt.tsx`: main game layout and progress flow.
- `components/UI/LandingPage.tsx`: introductory page and destination previews.
- `components/UI/GameElements.tsx`: shared brand, language switch, XP bar and badges.
- `components/UI/ArtifactScanner.tsx`: camera, local images, scanner animation.
- `components/UI/StoryCard.tsx`, `QuizCard.tsx`, `Fireworks.tsx`: storytelling and game feedback.
- `components/UI/LanguageProvider.tsx`: language preference and bilingual UI.
- `components/UI/game-data.ts`: typed bilingual fixtures, designed to be replaced by the upcoming dataset/API.
- `components/UI/game.css`: responsive visual system.
- `auth.ts`, `app/api/auth/[...nextauth]/route.ts`: Google OAuth integration.

## Content and photographs

Sample texts and photographs are sourced from the official destination websites. Sources are also linked from each story card:

- Dinh Độc Lập: https://dinhdoclap.gov.vn/kien-truc-dinh-doc-lap/
- Palace panorama: https://dinhdoclap.gov.vn/anh-dinh-doc-lap-noi-luu-giu-dau-an-sau-50-nam-giai-phong/
- University of Science: https://hcmus.edu.vn/29-nam-truong-dai-hoc-khoa-hoc-tu-nhien-dhqg-hcm-30-3-1996-30-3-2025/

Photographs remain the property of their respective rights holders. No affiliation with the destinations is implied.
