"""Publish the reviewed learning script without bundling its grading key in the UI."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "content/palace/learning-journey.source.json"

if __name__ == "__main__":
    bank = json.loads(SOURCE.read_text(encoding="utf-8"))
    answers = {}
    for question in bank["questions"]:
        answers[question["id"]] = {"correct": question.pop("correct"), "solution": question.pop("solution", None)}
    for filename, content in [("question-bank-v3.json", bank), ("question-bank-v3.answers.json", answers)]:
        (ROOT / "content/palace" / filename).write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
