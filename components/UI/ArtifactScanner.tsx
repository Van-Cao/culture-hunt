"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Aperture,
  Camera,
  Check,
  Crosshair,
  ImagePlus,
  LoaderCircle,
  ScanLine,
  Sparkles,
  VideoOff,
  Zap,
  ZapOff,
} from "lucide-react";
import type { Place } from "./game-data";
import { useLanguage } from "./LanguageProvider";

export default function ArtifactScanner({
  onCapture,
  complete,
  place,
}: {
  onCapture: () => void;
  complete: boolean;
  place: Place;
}) {
  const { t } = useLanguage();
  const [scanning, setScanning] = useState(false);
  const [camera, setCamera] = useState(false);
  const [cameraPending, setCameraPending] = useState(false);
  const [bright, setBright] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const upload = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stream.current?.getTracks().forEach((track) => track.stop());
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (camera && video.current && stream.current)
      video.current.srcObject = stream.current;
  }, [camera]);
  useEffect(
    () => () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  async function toggleCamera() {
    if (camera) {
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
      setCamera(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice(
        t(
          "Camera chưa khả dụng. Bạn có thể tải ảnh hoặc thử ảnh mẫu.",
          "Camera unavailable. Upload a photo or try the sample instead.",
        ),
      );
      return;
    }
    setCameraPending(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (!mounted.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      setPreview(null);
      setCamera(true);
      setNotice(
        t(
          "Camera đã sẵn sàng. Chụp ảnh để trải nghiệm câu chuyện và quiz mẫu.",
          "Camera ready. Capture a photo to try the sample story and quiz.",
        ),
      );
    } catch {
      if (mounted.current)
        setNotice(
          t(
            "Chưa mở được camera. Hãy kiểm tra quyền truy cập, hoặc thử ảnh mẫu nhé.",
            "Could not open the camera. Check permissions or try the sample.",
          ),
        );
    } finally {
      if (mounted.current) setCameraPending(false);
    }
  }

  async function loadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setNotice(
        t(
          "Chọn ảnh JPG, PNG hoặc WebP có dung lượng tối đa 10 MB nhé.",
          "Choose a JPG, PNG or WebP image up to 10 MB.",
        ),
      );
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const check = new window.Image();
      check.src = url;
      await check.decode();
      if (!mounted.current) {
        URL.revokeObjectURL(url);
        return;
      }
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
      setCamera(false);
      setPreview(url);
      setNotice(
        t(
          "Đã chọn ảnh. Bản demo sẽ mở câu chuyện và quiz mẫu của địa điểm này.",
          "Photo selected. This demo opens the location's sample story and quiz.",
        ),
      );
    } catch {
      URL.revokeObjectURL(url);
      if (mounted.current)
        setNotice(
          t(
            "Ảnh này không đọc được. Hãy chọn một ảnh khác nhé.",
            "This image could not be read. Please choose another.",
          ),
        );
    }
  }

  function capture() {
    if (scanning) return;
    if (complete) {
      onCapture();
      return;
    }
    if (camera && video.current) {
      if (!video.current.videoWidth) {
        setNotice(
          t(
            "Camera đang khởi động. Bạn thử lại sau một chút nhé.",
            "The camera is warming up. Try again in a moment.",
          ),
        );
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = video.current.videoWidth;
      canvas.height = video.current.videoHeight;
      canvas.getContext("2d")?.drawImage(video.current, 0, 0);
      setPreview(canvas.toDataURL("image/jpeg", 0.85));
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
      setCamera(false);
    }
    setScanning(true);
    setNotice(t("Đang mở khóa câu chuyện mẫu…", "Unlocking the sample story…"));
    timer.current = setTimeout(
      () => {
        setScanning(false);
        setNotice(
          t(
            "Đã mở khóa câu chuyện. Tiếp tục giải mã để nhận XP!",
            "Story unlocked. Complete the quiz to earn XP!",
          ),
        );
        onCapture();
      },
      reduced ? 250 : 1800,
    );
  }

  return (
    <section
      className="scanner-panel"
      aria-label={t("Trạm quét hiện vật", "Artifact scanner")}
    >
      <div className={`scanner-view ${bright ? "scanner-bright" : ""}`}>
        <div className="scanner-grid" />
        <div className="scanner-topline">
          <span>
            <span className="live-dot" />
            {camera
              ? t("CAMERA TRỰC TIẾP", "LIVE CAMERA")
              : t("GÓC NHÌN THÁM HIỂM", "EXPLORER VIEW")}
          </span>
          <span className="demo-label">
            {t("BẢN TRẢI NGHIỆM", "DEMO MODE")}
          </span>
        </div>
        <div className="viewfinder-tools">
          <button
            className={`scanner-tool ${bright ? "active" : ""}`}
            aria-label={t("Làm sáng khung hình", "Brighten view")}
            aria-pressed={bright}
            onClick={() => setBright(!bright)}
          >
            {bright ? <Zap size={18} /> : <ZapOff size={18} />}
          </button>
          <button
            className={`scanner-tool ${camera ? "active" : ""}`}
            disabled={cameraPending || scanning}
            aria-label={
              camera
                ? t("Tắt camera", "Turn camera off")
                : t("Bật camera", "Turn camera on")
            }
            onClick={toggleCamera}
          >
            {cameraPending ? (
              <LoaderCircle className="spin" size={18} />
            ) : camera ? (
              <VideoOff size={18} />
            ) : (
              <Camera size={18} />
            )}
          </button>
        </div>
        <div className="radar-circle radar-one" />
        <div className="radar-circle radar-two" />
        <div className="scanner-specimen">
          {camera ? (
            <video
              ref={video}
              autoPlay
              playsInline
              muted
              className="camera-video"
            />
          ) : preview ? (
            <Image
              src={preview}
              alt={t("Ảnh bạn đã chọn", "Your selected photo")}
              fill
              unoptimized
              className="uploaded-image"
            />
          ) : (
            <motion.div
              className="specimen-float"
              animate={reduced ? {} : { scale: [1, 1.035, 1] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src={place.image}
                alt={place.name}
                fill
                sizes="(max-width: 760px) 100vw, 800px"
                preload
                className="place-image"
              />
            </motion.div>
          )}
        </div>
        <div className={`viewfinder ${scanning ? "is-scanning" : ""}`}>
          <i className="corner top-left" />
          <i className="corner top-right" />
          <i className="corner bottom-left" />
          <i className="corner bottom-right" />
          <span className="crosshair crosshair-top" />
          <span className="crosshair crosshair-bottom" />
          <AnimatePresence>
            {scanning && (
              <motion.div
                className="scan-beam"
                initial={{ top: "0%", opacity: 0 }}
                animate={{ top: ["0%", "100%", "0%"], opacity: [0, 1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.7 }}
              />
            )}
          </AnimatePresence>
          <span className="target-plus">+</span>
        </div>
        {!camera && !preview && (
          <>
            <span className="specimen-tag">
              <span />
              {t("ĐIỂM KHÁM PHÁ", "DISCOVERY POINT")} #001
            </span>
            <span className="specimen-coordinate">
              {place.id === "palace" ? "DINH ĐỘC LẬP" : "HCMUS"}
              <br />
              HỒ CHÍ MINH
            </span>
          </>
        )}
        <div className="scanner-caption">
          <span className="scanner-status">
            <Crosshair size={14} />
            {scanning
              ? t("ĐANG GIẢI MÃ DẤU VẾT…", "DECODING THE CLUES…")
              : t("DẤU VẾT ĐÃ TRONG TẦM NGẮM", "DISCOVERY IN SIGHT")}
          </span>
          <h2>
            {scanning
              ? t("Câu chuyện đang thức giấc…", "A story is coming to life…")
              : t("Lịch sử ở ngay trước mắt.", "History is right before you.")}
          </h2>
          <p>
            {t(
              "Đưa hiện vật vào khung ngắm. Để câu chuyện bắt đầu.",
              "Frame a discovery. Let its story begin.",
            )}
          </p>
        </div>
        <span className="scanner-corner-label">CH / SCANNER v.01</span>
      </div>
      <div className="scanner-console">
        <button
          className="upload-button"
          onClick={() => upload.current?.click()}
          disabled={scanning}
        >
          <span className="console-icon">
            <ImagePlus size={21} />
          </span>
          <span>{t("Tải ảnh lên", "Upload photo")}</span>
        </button>
        <div className="capture-wrap">
          <motion.button
            className="capture-button"
            aria-label={
              complete
                ? t("Xem thành tựu", "View achievements")
                : t("Quét hiện vật", "Scan discovery")
            }
            onClick={capture}
            disabled={scanning}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
          >
            <span>
              {scanning ? (
                <LoaderCircle size={30} className="spin" />
              ) : complete ? (
                <Check size={31} />
              ) : (
                <Aperture size={33} strokeWidth={1.6} />
              )}
            </span>
          </motion.button>
          <strong>
            {scanning
              ? t("ĐANG QUÉT…", "SCANNING…")
              : complete
                ? t("ĐÃ CHINH PHỤC", "QUEST COMPLETE")
                : t("QUÉT & KHÁM PHÁ", "SCAN & DISCOVER")}
          </strong>
        </div>
        <button
          className="upload-button"
          onClick={() => {
            setPreview(null);
            if (camera) {
              stream.current?.getTracks().forEach((track) => track.stop());
              stream.current = null;
              setCamera(false);
            }
            setNotice(
              t(
                "Đã chọn ảnh mẫu. Nhấn nút quét để bắt đầu!",
                "Sample selected. Tap scan to begin!",
              ),
            );
          }}
          disabled={scanning}
        >
          <span className="console-icon">
            <Sparkles size={21} />
          </span>
          <span>{t("Thử ảnh mẫu", "Try a sample")}</span>
        </button>
        <input
          ref={upload}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={loadImage}
          aria-label={t("Tải ảnh hiện vật", "Upload discovery photo")}
        />
      </div>
      <div className="scanner-notice" role="status">
        <ScanLine size={14} />
        <span>
          {notice ||
            t(
              "Ảnh chỉ xử lý trên thiết bị · Câu chuyện & quiz mẫu",
              "Photos stay on your device · Sample stories & quizzes",
            )}
        </span>
      </div>
    </section>
  );
}
