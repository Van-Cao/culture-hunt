<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Culture Hunt — Project memory

Read this entire file and `rules.md` before each work session and after any reload.
Confirmed with the project owner on 2026-11-12. The final decisions below take
precedence over older ideas in `proposal.docx`.

## Product and confirmed rules

Culture Hunt is a mobile web exploration game. A successful, server-validated
photo scan identifies the destination and records a check-in. The player then
receives its quiz/story content. Photo recognition is the Tech Lead's work.

- Both guests and signed-in players can save progress. A guest returns through
  the same browser's saved session; clearing site data or signing out loses that
  guest credential. Do not promise device fingerprinting or recovery without it.
- A correct answer awards 150 XP once per stable mission ID per destination.
  A wrong answer still counts as attempted and advances to the next question.
  A later replay may earn the first correct-answer reward for a previously wrong
  answer. Retries/reloads must never award the same reward twice.
- Attempting every question completes the destination, regardless of accuracy.
  Completion awards 100 XP once and unlocks its destination badge.
- Re-scanning the same destination does not create an extra unique check-in.
- Persist the quiz snapshot and individual mission progress, so the player can
  resume, review, or replay. Re-scans must not reset the saved quiz or progress.
- Achievement groups: completed destinations; 1, 3, and 5 distinct check-ins;
  rank titles at 150, 500, and 1,000 XP. Display names may be changed later.
- Optional check-in photo, destination and timestamps; no GPS storage for v1.
  A photo upload failure must not undo a check-in, XP, or progress.
- On guest-to-account sign-in merge the progress, deduplicating mission rewards,
  unique places and completion bonuses. Never simply add the two totals.

## Stack and ownership

Required: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Supabase, Vercel.
The repository currently uses Next 16.4.5. Read its bundled docs before coding.
Do not add UI frameworks or replace teammates' work.

This owner's role is Database & Storage Logic: `lib/supabase.ts`, data helpers,
database SQL, storage, and data-only Next.js handlers under `app/api/game/`.
Keep exactly two application tables initially: `public.users` and
`public.checkins`; extra progress fields/JSON are allowed. Supabase's own
`auth`/`storage` schemas do not count as additional application tables.

Other teammates own:
- Tech Lead: camera, `app/api/vision/`, AI recognition, core AI integration.
- UI: `components/UI/`, game layout, animations and UI event wiring.
- Prompt/data: `lib/prompts.ts`, content, quiz scripts and test photos.

Only accept validated scan results from a server caller. Never expose an HTTP
endpoint that awards XP based on a browser-provided `isCorrect`, score, or user
ID. Answer keys, admin keys, and database write privileges stay on the server.
Use transactions and unique constraints for retries/concurrent requests.

## Branches and integration status

- `main`: initial skeleton, no game UI.
- `UI/UX`: teammates' demo; browser-local progress, Google login with Auth.js,
  fixtures, camera UI. These are not yet connected to the database layer.
- Work for this owner: `feature/database-checkins`, based on `main`.
- Authorized UI build fix is isolated on `fix/ui-vision-dependency`, based on
  `UI/UX`: add the missing `@google/generative-ai` dependency, no UI rewrite.
- The owner explicitly approved that SDK addition. Supabase SDKs belong to the
  required stack; use pinned versions. Ask before any unrelated new library.
- Do not merge/push directly to `main` or `UI/UX`. Push dedicated branches and
  hand off through pull requests. Do not force-push.
- Auth.js currently in UI/UX is not a Supabase session. Provide a documented
  Supabase Auth data adapter; coordinate UI sign-in integration rather than
  silently replacing the existing login flow.

## Working order and verification

Step 1 (proposal, code review, business alignment) is complete and approved.
Step 2: commit this project memory and `rules.md` before core implementation.
Step 3: SQL, connection/data functions, meaningful tests, integration handoff.
Report honestly whether verification used a local test database or the actual
Supabase project. Never claim cloud setup or UI synchronization without proof.
