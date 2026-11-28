"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, BookOpen, Check, Flag, LockKeyhole, MapPin, RotateCcw, Trophy } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import "./tutorial.css";

export default function JourneyTutorial({ onDone }: { onDone?: () => void }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const reading = useRef<HTMLDivElement>(null);
  const changedStep = useRef(false);
  useEffect(() => {
    if (!changedStep.current) return;
    changedStep.current = false;
    reading.current?.scrollTo({ top: 0, behavior: "instant" });
    heading.current?.focus({ preventScroll: true });
    if (!onDone && heading.current && heading.current.getBoundingClientRect().top < 0) {
      heading.current.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }, [step, onDone]);
  const steps = [
    {
      title: t("Chọn trạm đầu tiên", "Pick your first stop"),
      instructions: [
        t("Mở Khám phá và chọn Dinh Độc Lập hoặc ĐH Khoa học Tự nhiên.", "Open Explore and choose Independence Palace or the University of Science."),
        t("Tại Dinh, chạm “Mặt tiền Dinh” trên sơ đồ rồi chọn “Bắt đầu nhiệm vụ”.", "At the Palace, tap “The Palace façade” on the map, then “Start this mission”."),
        t("Hoàn thành trạm hiện tại để mở trạm có ổ khóa kế tiếp.", "Finish your current stop to unlock the next one."),
      ],
    },
    {
      title: t("Đưa dấu vết vào khung", "Frame the clue"),
      instructions: [
        t("Tìm góc thấy cả mặt tiền Dinh và thảm cỏ như trong ảnh.", "Frame both the Palace façade and the lawn, as in the photo."),
        t("Mở camera, tải ảnh lên hoặc chọn “Dùng ảnh mẫu của điểm này”.", "Open the camera, upload a photo or choose “Use this checkpoint’s sample”."),
        t("Bấm “Nhận diện địa điểm”. Nếu ảnh chưa khớp, chụp lại từ một góc khác.", "Press “Identify location”. If the photo does not match, try another angle."),
      ],
    },
    {
      title: t("Quan sát rồi trả lời", "Look closely, then answer"),
      instructions: [
        t("Nhìn vào giữa thảm cỏ rồi thử trả lời câu hỏi dưới ảnh.", "Look at the centre of the lawn and try the question under the photo."),
        t("Khi làm nhiệm vụ tại Dinh, bạn có thể phóng to ảnh và mở gợi ý trước khi bấm “Xác nhận đáp án”.", "At the Palace, enlarge the evidence photo or read a hint before pressing “Confirm answer”."),
        t("Ở tuyến đại học, đọc câu chuyện trước khi trả lời.", "On the campus trail, read the story before answering."),
      ],
    },
    {
      title: t("Mang dấu ấn về hộ chiếu", "Collect your first discovery"),
      instructions: [
        t("Giải xong bộ câu hỏi tại Dinh để mở câu chuyện và nghe thuyết minh.", "Finish the Palace questions to unlock the story and listen to its narration."),
        t("Hoàn thành một checkpoint lần đầu để nhận 150 XP.", "Earn 150 XP the first time you complete a checkpoint."),
        t("Vào Dấu ấn để xem bộ sưu tập hoặc trở lại Hành trình để chơi trạm kế tiếp.", "Open Collection to see your discoveries, or return to Journeys for the next stop."),
      ],
    },
  ];
  const firstStop = t("Mặt tiền Dinh", "The Palace façade");
  const last = step === steps.length - 1;
  function move(next: number) {
    changedStep.current = true;
    setStep(next);
    setAnswer(null);
  }
  return (
    <div className="journey-tutorial">
      <div className="tutorial-kicker"><BookOpen size={20} />{t("HƯỚNG DẪN CHƠI", "HOW TO PLAY")}</div>
      <div className="tutorial-progress" aria-hidden="true">
        {steps.map((item, index) => <i key={item.title} className={index <= step ? "is-filled" : ""} />)}
      </div>
      <div className="tutorial-layout" ref={reading}>
        <div className="tutorial-copy">
          <small>{t("Bước", "Step")} {step + 1} / {steps.length}</small>
          <h2 ref={heading} tabIndex={-1}>{steps[step].title}</h2>
          <ul>{steps[step].instructions.map(instruction => <li key={instruction}>{instruction}</li>)}</ul>
        </div>
        <div className={`tutorial-example example-${step}`}>
          <div className="tutorial-image">
            <Image src="/images/palace-exterior.webp" fill sizes="(max-width: 800px) 95vw, 600px"
              alt={t("Mặt tiền Dinh Độc Lập nhìn qua thảm cỏ tròn có đài phun nước ở giữa", "The Palace façade beyond a circular lawn with a fountain at its centre")} />
            {step === 1 && <span className="tutorial-frame" aria-hidden="true"><i /><i /><i /><i /></span>}
            {step === 3 && <span className="tutorial-stamp"><Trophy size={30} />+150 XP</span>}
          </div>
          {step === 0 && <div className="tutorial-route">
            <strong><MapPin size={17} />{firstStop}</strong>
            <span><LockKeyhole size={15} />{t("Phòng Khánh tiết", "Reception Hall")}</span>
          </div>}
          {step === 1 && <p className="tutorial-caption"><MapPin size={17} />{t("Ảnh mẫu", "Sample photo")} · {firstStop}</p>}
          {step === 2 && <div className="tutorial-practice">
            <strong>{t("Bạn thấy gì ở giữa thảm cỏ?", "What can you see in the middle of the lawn?")}</strong>
            <div>{[t("Đài phun nước", "A fountain"), t("Cột đồng hồ", "A clock tower")].map((label, index) => (
              <button key={label} aria-pressed={answer === index} onClick={() => setAnswer(index)}>{label}</button>
            ))}</div>
            <p role="status">{answer === 0 ? t("Đúng rồi! Vòng tròn nhỏ giữa thảm cỏ là đài phun nước.", "Exactly! The small circle in the lawn is the fountain.") : answer === 1 ? t("Nhìn vòng tròn nhỏ giữa thảm cỏ rồi thử lại nhé.", "Look at the small circle in the lawn and try again.") : ""}</p>
          </div>}
          {step === 3 && <p className="tutorial-caption"><Flag size={17} />{t("Ví dụ dấu ấn đầu tiên", "Example first discovery")} · {firstStop}</p>}
        </div>
      </div>
      <div className="tutorial-controls">
        <button type="button" disabled={step === 0} onClick={() => move(step - 1)}><ArrowLeft size={16} />{t("Quay lại", "Back")}</button>
        <button type="button" className="tutorial-next" onClick={() => last ? onDone ? onDone() : move(0) : move(step + 1)}>
          {last ? onDone ? t("Đã hiểu", "Got it") : t("Xem từ đầu", "Replay guide") : t("Bước tiếp theo", "Next step")}
          {last ? onDone ? <Check size={17} /> : <RotateCcw size={17} /> : <ArrowRight size={17} />}
        </button>
      </div>
    </div>
  );
}
