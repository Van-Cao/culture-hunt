"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, BookOpen, Check, Flag, LockKeyhole, MapPin, RotateCcw, Trophy } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import "./tutorial.css";

export default function JourneyTutorial({ onDone }: { onDone?: () => void }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const steps = [
    {
      title: t("Chọn trạm đầu tiên", "Pick your first stop"),
      body: t("Trong Khám phá, chọn Dinh Độc Lập hoặc ĐH Khoa học Tự nhiên. Tại Dinh, chạm “Mặt tiền Dinh” trên sơ đồ rồi chọn “Bắt đầu nhiệm vụ”. Các trạm có ổ khóa sẽ mở lần lượt khi bạn hoàn thành trạm trước.", "In Explore, choose Independence Palace or the University of Science. At the Palace, tap “The Palace façade” on the map, then “Start this mission”. Each locked stop opens when you finish the one before it."),
    },
    {
      title: t("Đưa dấu vết vào khung", "Frame the clue"),
      body: t("Ở trạm Mặt tiền Dinh, tìm góc thấy cả tòa nhà và thảm cỏ. Mở camera để chụp, tải ảnh có sẵn hoặc chọn “Dùng ảnh mẫu của điểm này”. Bấm “Nhận diện địa điểm”. Nếu ảnh chưa khớp, đổi góc rồi thử lại.", "At the Palace façade, look for a view of both the building and the lawn. Take a photo, upload one, or choose “Use this checkpoint’s sample”. Press “Identify location”. If it doesn’t match, try another angle."),
    },
    {
      title: t("Quan sát rồi trả lời", "Look closely, then answer"),
      body: t("Thử trả lời câu hỏi trong ảnh minh họa. Khi chơi tại Dinh, bạn có thể phóng to ảnh tư liệu, mở gợi ý rồi bấm “Xác nhận đáp án”. Ở tuyến đại học, bạn đọc câu chuyện trước khi làm câu hỏi.", "Try the example photo question. At the Palace, you can enlarge the evidence photo, read a hint, then press “Confirm answer”. On the campus trail, read the story before starting the quiz."),
    },
    {
      title: t("Mang dấu ấn về hộ chiếu", "Collect your first discovery"),
      body: t("Giải xong bộ câu hỏi tại Dinh để mở câu chuyện và nghe thuyết minh. Mỗi checkpoint hoàn thành lần đầu mang về 150 XP. Mở mục Dấu ấn để xem bộ sưu tập, hoặc trở lại Hành trình để chơi trạm kế tiếp.", "Finish the Palace questions to unlock the story and its narration. Your first completion of a checkpoint earns 150 XP. Open Collection to see your discoveries, or return to Journeys for the next stop."),
    },
  ];
  const firstStop = t("Mặt tiền Dinh", "The Palace façade");
  const last = step === steps.length - 1;
  function move(next: number) {
    setStep(next);
    setAnswer(null);
  }
  return (
    <div className="journey-tutorial">
      <div className="tutorial-kicker"><BookOpen size={16} />{t("HƯỚNG DẪN CHƠI", "HOW TO PLAY")}</div>
      <div className="tutorial-progress" aria-hidden="true">
        {steps.map((item, index) => <i key={item.title} className={index <= step ? "is-filled" : ""} />)}
      </div>
      <div className="tutorial-layout">
        <div className="tutorial-copy" aria-live="polite" aria-atomic="true">
          <small>{t("Bước", "Step")} {step + 1} / {steps.length}</small>
          <h2>{steps[step].title}</h2>
          <p>{steps[step].body}</p>
        </div>
        <div className={`tutorial-example example-${step}`}>
          <div className="tutorial-image">
            <Image src="/images/palace-exterior.webp" fill sizes="(max-width: 700px) 90vw, 500px"
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
