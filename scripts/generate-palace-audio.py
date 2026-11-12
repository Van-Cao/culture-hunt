"""Generate demo narration assets. pip install edge-tts mutagen gTTS.

Uses Microsoft Edge's online TTS via the community edge-tts client, not an
Azure subscription or a paid/free-tier Azure API. Only authored public story
text is sent. The web app plays saved MP3s and never calls this service.
Use --google-missing to fill unavailable tracks via Google Translate's demo
TTS (community gTTS client, not Google Cloud Chirp). Track provenance is saved.
"""
import asyncio
import hashlib
import json
import sys
import re
from pathlib import Path

import edge_tts
from mutagen.mp3 import MP3

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "content/palace/stories.json").read_text(encoding="utf-8"))
DEST = ROOT / "public/audio/palace"


async def main():
    DEST.mkdir(parents=True, exist_ok=True)
    manifest = {"version": DATA["version"], "provider": "Demo narration; see each track for provider", "tracks": {}}
    manifest_path = DEST / "manifest.json"
    previous = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {"tracks": {}}
    failed = []
    for checkpoint, languages in DATA["stories"].items():
        manifest["tracks"][checkpoint] = {}
        for locale, story in languages.items():
            path = DEST / f"{checkpoint}-{locale}.mp3"
            voice = DATA["voices"][locale]
            text = story["text"]
            digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
            cached = previous["tracks"].get(checkpoint, {}).get(locale, {})
            reuse = path.exists() and path.stat().st_size > 10000 and (cached.get("textSha256") == digest or "--resume-existing" in sys.argv)
            provider = cached.get("provider", "Microsoft Edge online TTS (demo)") if reuse else "Microsoft Edge online TTS (demo)"
            if reuse:
                voice = cached.get("voice", voice)
            if not reuse and "--google-missing" in sys.argv:
                from gtts import gTTS
                gTTS(text=text, lang=locale, timeout=30).save(str(path))
                voice = "Google Vietnamese" if locale == "vi" else "Google English"
                provider = "Google Translate TTS (demo; not Cloud Chirp)"
            elif not reuse:
                temporary = path.with_suffix(".pending.mp3")
                for attempt in range(5):
                    try:
                        await asyncio.wait_for(edge_tts.Communicate(text, voice, rate="-4%" if locale == "vi" else "-6%").save(str(temporary)), timeout=35)
                        MP3(temporary)
                        temporary.replace(path)
                        break
                    except Exception:
                        print(f"Retry {path.name} ({attempt + 1})", flush=True)
                        await asyncio.sleep(2)
                else:
                    # Some long VI requests return no frames. Sentence-sized
                    # requests use the same voice/codec and concatenate MPEG
                    # frames without re-encoding the narration.
                    pieces = []
                    try:
                        for sentence in re.split(r"(?<=[.!?])\s+", text):
                            for retry in range(4):
                                try:
                                    frames = bytearray()
                                    async for message in edge_tts.Communicate(sentence, voice, rate="-4%" if locale == "vi" else "-6%", receive_timeout=20).stream():
                                        if message["type"] == "audio":
                                            frames.extend(message["data"])
                                    if not frames:
                                        raise RuntimeError("No audio frames")
                                    pieces.append(bytes(frames))
                                    break
                                except Exception:
                                    if retry == 3:
                                        raise
                                    await asyncio.sleep(1)
                        temporary.write_bytes(b"".join(pieces))
                        MP3(temporary)
                        temporary.replace(path)
                    except Exception:
                        failed.append(path.name)
                        continue
            duration = round(MP3(path).info.length, 2)
            if duration < 10 or path.stat().st_size < 10000:
                raise RuntimeError(f"Invalid narration: {path.name}")
            manifest["tracks"][checkpoint][locale] = {
                "src": f"/audio/palace/{path.name}", "voice": voice,
                "provider": provider,
                "duration": duration, "bytes": path.stat().st_size,
                "textSha256": digest,
            }
            print(f"{path.name}: {duration}s", flush=True)
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            temporary = path.with_suffix(".pending.mp3")
            if temporary.exists():
                temporary.unlink()
    if failed:
        raise RuntimeError("Missing audio; rerun to resume: " + ", ".join(failed))


if __name__ == "__main__":
    asyncio.run(main())
