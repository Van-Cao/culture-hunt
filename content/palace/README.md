# Palace learning journey

The active journey is **recognition -> four evidence-led tasks per checkpoint -> visual reveal -> written/audio story -> recorded discovery**. There are 20 bilingual tasks. Necessary dates and clues are supplied before answering. XP and the next checkpoint unlock after all four correct answers; retries, reload/resume and replay remain supported. Existing map and recognition photographs are unchanged.

## Current reviewed script v3

[Authored source](./learning-journey.source.json) traces merged questions back to the workbook rows. Build with `python scripts/build-palace-learning-bank.py`: [public task metadata](./question-bank-v3.json) contains no grading keys; [server grading keys](./question-bank-v3.answers.json) are imported only by the persistence service. Incomplete visits migrate to v3 without losing recognition or earlier attempts. Completed and abandoned snapshots and lifetime XP remain unchanged.

Five reveals: facade task 2 (Tam), reception task 3 (painting), cabinet task 2 (archival comparison), rooftop task 2 (red circles), bunker task 3 (illustrative information workflow). The bunker workflow is explicitly a simplified educational illustration, not a real message, floor plan or wiring route.

[Photo manifest](./learning-assets.json) records dimensions, hashes, credits and source URLs. `python scripts/prepare-palace-learning-assets.py` prepares WebP photographs independently of the map/scanner photos. The 2017 wide Reception Hall photograph and high-resolution painting replace obstructed/low-resolution learning views. CSS crops preserve source detail; no generative reconstruction is used.

[New bilingual story scripts](./stories-v3.json) match the ten tracks in `public/audio/palace-learning/manifest.json`. Generate with `python scripts/generate-palace-audio.py --learning`. `--google-missing` fills only missing tracks while reusing matching cached tracks. Provider/voice, duration and transcript SHA-256 are recorded per track. The previous story/audio files are retained as archives.

## Archived workbook review v2

[Verbatim workbook export](./question-bank-v2.source.json) preserves all 30 tasks, the original answer/feedback cells, the five story drafts, sheet row numbers and workbook SHA-256. [Reviewed bilingual bank](./question-bank-v2.json) publishes **26 tasks**: façade 6, reception 4, cabinet 7, rooftop 6, bunker 3. The workbook replaces all earlier playable banks. Unfinished active visits update immediately, preserving recognition and earlier attempts. Completed/abandoned history and XP remain saved.

Five response types are supported: single answer, multiple answers, ordered cards, numeric entry and matching pairs. All are graded on the server. Invalid shapes, duplicate multiple selections, incomplete sequences and out-of-range answers are rejected. Multi selections are order-independent; sequences and matching positions are order-sensitive. Numeric answers are integer strings. An additive `attempts.answer_json` column retains structured responses without changing old integer answers.

Four source tasks are retained for review and **not graded**:

| Excel row | Reason |
| --- | --- |
| 14 | The date/person matching key is incomplete and inconsistent; needs explicit events and a corrected key. |
| 15 | Painting signature/detail capture needs a close-up and calibrated image targets. |
| 18 | The six-seat reasoning task lacks a precise diagram needed to uniquely validate the supplied answer. |
| 36 | A supplied radio photo is not an object-level recognition model; the current scanner identifies rooms/checkpoints. |

Editorial adaptations are recorded in the reviewed bank. Row 6 keeps six sortable events because the supplied seven-event prompt omits one event from its key. Row 7 corrects **390 → main gate**, corroborated by the [official Palace historical introduction](https://dinhdoclap.gov.vn/di-tich-lich-su-dinh-doc-lap/). Row 10 omits the credential-ceremony premise to avoid mixing up separate rooms. Row 11 repairs shifted feedback cells and labels its sequence illustrative. Row 13 is a calculation exercise rather than a measured room claim. Row 22 distinguishes the earlier broadcast appeal from the later surrender announcement. Row 24 recovers B from the workbook's explicit success script. Row 28 distinguishes the planned allocation for the Palace from the total bombs. Other supplied claims are retained as user-authored content, not represented as independently authenticated.

The five supplied story drafts remain in the source export. The v3 scripts above supersede the earlier active narrations while retaining the earlier files.

Rebuild the reviewed bank with `python scripts/import-palace-question-bank.py`. The app reads the generated JSON, so Python/openpyxl are not runtime dependencies. Earlier question modules and mini game endpoints are removed. Historical snapshots remain in SQLite and cannot be submitted as new challenges.
