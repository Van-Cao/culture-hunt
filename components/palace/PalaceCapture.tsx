"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  CameraOff,
  ImagePlus,
  LoaderCircle,
  ScanLine,
  Sparkles,
  Download,
  Check,
} from "lucide-react";
import {
  getCheckpoints,
  type Checkpoint,
  type CheckpointId,
} from "@/lib/palace/checkpoints";
import { useLanguage } from "@/components/UI/LanguageProvider";

export default function PalaceCapture({
  checkpoint,
  busy,
  aiAvailable,
  onAnalyze,
}: {
  checkpoint: Checkpoint;
  busy: boolean;
  aiAvailable: boolean;
  onAnalyze: (photo: File | CheckpointId) => Promise<void>;
}) {
  const { locale, t } = useLanguage();
  const [photo, setPhoto] = useState<File | CheckpointId | null>(null);
  const [preview, setPreview] = useState(checkpoint.photo);
  const [notice, setNotice] = useState("");
  const [camera, setCamera] = useState(false);
  const [opening, setOpening] = useState(false);
  const [gallery, setGallery] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);
  useEffect(() => {
    if (camera && video.current) video.current.srcObject = stream.current;
  }, [camera]);
  useEffect(
    () => () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  function stopCamera() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setCamera(false);
  }
  async function toggleCamera() {
    if (camera) {
      stopCamera();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice(
        t(
          "Camera cần HTTPS hoặc localhost. Bạn vẫn có thể tải ảnh hoặc dùng ảnh mẫu.",
          "Camera needs HTTPS or localhost. Upload a photo or use a sample instead.",
        ),
      );
      return;
    }
    setOpening(true);
    setNotice("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
        audio: false,
      });
      if (!mounted.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      setCamera(true);
      setPhoto(null);
    } catch {
      if (mounted.current)
        setNotice(
          t(
            "Chưa mở được camera. Kiểm tra quyền truy cập hoặc dùng ảnh mẫu.",
            "Camera unavailable. Check permissions or use a reference photo.",
          ),
        );
    } finally {
      if (mounted.current) setOpening(false);
    }
  }
  function chooseSample(id: CheckpointId) {
    stopCamera();
    setPhoto(id);
    setPreview(getCheckpoints(locale).find((cp) => cp.id === id)!.photo);
    setNotice(
      t(
        "Đã chọn ảnh mẫu. Đây là chế độ tham chiếu, không phải xác thực có mặt tại Dinh.",
        "Sample selected. Reference mode does not verify physical attendance.",
      ),
    );
  }
  function chooseFile(file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setNotice(
        t(
          "Chọn ảnh JPG, PNG hoặc WebP tối đa 5 MB.",
          "Choose a JPG, PNG or WebP photo up to 5 MB.",
        ),
      );
      return;
    }
    stopCamera();
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setNotice(
      t(
        "Ảnh sẽ được gửi đến máy chủ để đối chiếu; AI có thể xử lý nếu đã cấu hình.",
        "The photo will be sent to the server for reference matching and AI analysis if configured.",
      ),
    );
  }
  async function takePhoto() {
    if (!video.current?.videoWidth) {
      setNotice(
        t(
          "Camera đang khởi động, thử lại sau một chút.",
          "The camera is warming up. Try again shortly.",
        ),
      );
      return;
    }
    const canvas = document.createElement("canvas");
    const ratio = Math.min(
      1,
      1280 / Math.max(video.current.videoWidth, video.current.videoHeight),
    );
    canvas.width = Math.round(video.current.videoWidth * ratio);
    canvas.height = Math.round(video.current.videoHeight * ratio);
    const context = canvas.getContext("2d");
    if (!context) {
      setNotice(
        t(
          "Thiết bị chưa hỗ trợ chụp ảnh. Hãy tải ảnh lên.",
          "Capture is unavailable. Upload a photo instead.",
        ),
      );
      return;
    }
    context.drawImage(video.current, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (blob && mounted.current)
      chooseFile(new File([blob], "palace-camera.jpg", { type: "image/jpeg" }));
  }
  return (
    <div className="palace-capture">
      <div className="palace-capture-view">
        {camera ? (
          <video
            ref={video}
            autoPlay
            muted
            playsInline
            aria-label={t("Hình ảnh camera trực tiếp", "Live camera feed")}
          />
        ) : (
          <Image
            src={preview}
            alt={
              photo
                ? t("Ảnh đã chọn để nhận diện", "Selected recognition photo")
                : checkpoint.name
            }
            fill
            unoptimized={preview.startsWith("blob:")}
            sizes="(max-width: 700px) 100vw, 550px"
          />
        )}
        <span className="palace-capture-tag">
          {camera
            ? t("CAMERA TRỰC TIẾP", "LIVE CAMERA")
            : typeof photo === "string"
              ? t("ẢNH MẪU ĐÃ CHỌN", "SAMPLE SELECTED")
              : photo
                ? t("ẢNH CỦA BẠN", "YOUR PHOTO")
                : t("ẢNH THAM CHIẾU", "REFERENCE PHOTO")}
        </span>
        <span className="palace-viewfinder" aria-hidden="true" />
        {busy && (
          <div className="palace-analyzing" role="status">
            <LoaderCircle className="spin" size={32} />
            <strong>
              {t("Đang đối chiếu dấu vết…", "Matching your discovery…")}
            </strong>
            <span>
              {t(
                "Ảnh mới có thể cần thêm thời gian để phân tích.",
                "New photos may take a moment to analyze.",
              )}
            </span>
          </div>
        )}
      </div>
      <div className="palace-capture-copy">
        <span className="palace-overline">
          {t("NHẬN DIỆN CHECKPOINT", "IDENTIFY THE CHECKPOINT")}
        </span>
        <h2>{checkpoint.name}</h2>
        <p>{checkpoint.clue}</p>
        <span className="palace-mode">
          <span />
          {aiAvailable
            ? t(
                "Đã cấu hình AI · Có bộ ảnh tham chiếu",
                "AI configured · Reference kit available",
              )
            : t(
                "Chế độ đối chiếu ảnh tham chiếu",
                "Reference-photo matching mode",
              )}
        </span>
        <button
          className="palace-button palace-button-light"
          onClick={() => chooseSample(checkpoint.id)}
          disabled={busy || opening}
        >
          <Sparkles size={18} />
          {t("Dùng ảnh mẫu của điểm này", "Use this checkpoint’s sample")}
        </button>
        <div className="palace-capture-actions">
          <button onClick={toggleCamera} disabled={busy || opening}>
            {opening ? (
              <LoaderCircle className="spin" size={18} />
            ) : camera ? (
              <CameraOff size={18} />
            ) : (
              <Camera size={18} />
            )}
            {camera
              ? t("Tắt camera", "Turn off camera")
              : t("Mở camera", "Open camera")}
          </button>
          <button
            onClick={() => input.current?.click()}
            disabled={busy || opening}
          >
            <ImagePlus size={18} />
            {t("Tải ảnh lên", "Upload photo")}
          </button>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          aria-label={t("Chọn ảnh checkpoint", "Choose a checkpoint photo")}
          onChange={(event) => {
            chooseFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {camera ? (
          <button className="palace-button" onClick={takePhoto} disabled={busy}>
            <Camera size={18} />
            {t("Chụp ảnh", "Capture photo")}
          </button>
        ) : (
          <button
            className="palace-button"
            onClick={() => photo && onAnalyze(photo)}
            disabled={!photo || busy || opening}
          >
            {busy ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <ScanLine size={18} />
            )}
            {busy
              ? t("Đang đối chiếu…", "Matching…")
              : t("Nhận diện địa điểm", "Identify location")}
          </button>
        )}
        <p className="palace-inline-notice" role="status">
          {notice ||
            t(
              "Chưa có ảnh? Dùng bộ ảnh mẫu để trải nghiệm trọn hành trình.",
              "No photo yet? Use the reference kit to try the whole journey.",
            )}
        </p>
        <button
          className="palace-text-button"
          onClick={() => setGallery(!gallery)}
          aria-expanded={gallery}
          disabled={busy}
        >
          {t("Xem bộ ảnh demo / tải ảnh về", "Browse / download demo photos")}
        </button>
      </div>
      {gallery && (
        <div className="palace-photo-kit">
          {getCheckpoints(locale).map((cp) => (
            <div key={cp.id}>
              <button
                onClick={() => chooseSample(cp.id)}
                disabled={busy}
                aria-label={`${t("Chọn ảnh mẫu", "Select sample")} ${cp.name}`}
              >
                <Image src={cp.photo} alt={cp.name} width={180} height={120} />
                <span>
                  {cp.name}
                  {photo === cp.id && <Check size={14} />}
                </span>
              </button>
              <a href={cp.photo} download={`culture-hunt-${cp.id}.webp`}>
                <Download size={13} />
                {t("Tải ảnh", "Download photo")}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
