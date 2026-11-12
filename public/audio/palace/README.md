# Palace story narration — demo

Ten MP3 files cover the five stable Palace checkpoints in Vietnamese and English. Written scripts are in [stories.json](../../../content/palace/stories.json). Each track is about 30–41 seconds. The player explicitly selects VI/EN, switches text and audio together, stops the previous narration, supports pause/resume, seeking, replay and playback speed, and displays the transcript even if audio fails.

## Voices and provenance

- Vietnamese facade, reception and bunker: Microsoft Edge online TTS, `vi-VN-HoaiMyNeural`.
- All five English tracks: Microsoft Edge online TTS, `en-US-JennyNeural`.
- Vietnamese cabinet and rooftop: Google Translate TTS through gTTS, used as a clearly labeled demo fallback after the Microsoft demo service repeatedly closed without audio. These are not Google Cloud Chirp voices.

Microsoft tracks were generated through the community [edge-tts client](https://github.com/rany2/edge-tts). This is not an Azure Speech subscription/free-tier API integration. Google fallback tracks use the community [gTTS client](https://github.com/pndurette/gTTS). Neither service is called by visitors; the web app plays the saved MP3s. No provider credentials are shipped to the browser.

[manifest.json](./manifest.json) records the provider, voice, exact spoken-text SHA-256, byte length and measured duration for each file. The content is an authored interpretation, not a historical first-person quotation. Sources: [Palace architecture](https://dinhdoclap.gov.vn/kien-truc-dinh-doc-lap/), [official Palace photo report](https://dinhdoclap.gov.vn/anh-dinh-doc-lap-noi-luu-giu-dau-an-sau-50-nam-giai-phong/), and the supplied question bank. The Cabinet Room story describes visible objects without inventing the unverified screen/bronze-drum exhibit.

## Regeneration

Install Python dependencies with `python -m pip install edge-tts mutagen gTTS`, then run `python scripts/generate-palace-audio.py` from the project root. Unchanged, validated tracks are reused. `--google-missing` explicitly fills missing/stale tracks with the Google demo voice and records their provenance. Completed files are validated before replacing assets. Production hosting can replace this generation step with the team's chosen authenticated TTS service while preserving the same player contract.
