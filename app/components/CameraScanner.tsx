"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    const video = videoRef.current;

    async function openCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Trình duyệt không hỗ trợ camera. Vui lòng sử dụng HTTPS hoặc localhost.",
          );
        }

        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        // The permission dialog may resolve after the component unmounts.
        if (cancelled || !video) {
          cameraStream.getTracks().forEach((track) => track.stop());
          return;
        }

        stream = cameraStream;
        video.srcObject = stream;
        await video.play();
      } catch (cause) {
        stream?.getTracks().forEach((track) => track.stop());
        if (cancelled) return;

        setIsReady(false);
        if (cause instanceof DOMException) {
          switch (cause.name) {
            case "NotAllowedError":
              setError("Quyền truy cập camera bị từ chối. Hãy cho phép camera trong trình duyệt.");
              break;
            case "NotFoundError":
              setError("Không tìm thấy camera trên thiết bị.");
              break;
            case "NotReadableError":
              setError("Không thể mở camera. Camera có thể đang được ứng dụng khác sử dụng.");
              break;
            default:
              setError("Không thể mở camera. Vui lòng kiểm tra thiết bị và thử lại.");
          }
        } else {
          setError(cause instanceof Error ? cause.message : "Không thể mở camera.");
        }
      }
    }

    void openCamera();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      if (video) video.srcObject = null;
    };
  }, []);

  function captureImage() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      setError("Camera chưa sẵn sàng. Vui lòng chờ hình ảnh xuất hiện.");
      return;
    }

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Trình duyệt không hỗ trợ chụp ảnh bằng canvas.");
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL("image/jpeg", 0.9);
      console.log("Ảnh vật thể (base64):", base64Image);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể chụp ảnh. Vui lòng thử lại.");
    }
  }

  return (
    <div className="fixed inset-0 isolate overflow-hidden bg-black text-white">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        aria-label="Hình ảnh trực tiếp từ camera sau"
        className="h-screen w-full object-cover"
        onPlaying={() => setIsReady(true)}
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="aspect-square w-[min(75vw,55vh,22rem)] rounded-2xl border-4 border-white shadow-[0_0_0_100vmax_rgba(0,0,0,0.45)]" />
      </div>

      <canvas ref={canvasRef} hidden />

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-6 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {error && (
          <p role="alert" className="max-w-md rounded-xl bg-red-950/90 px-4 py-3 text-center text-sm text-white">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={captureImage}
          disabled={!isReady}
          className="w-full max-w-sm rounded-full bg-emerald-400 px-8 py-4 text-lg font-bold text-black shadow-lg transition hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Quét vật thể
        </button>
      </div>
    </div>
  );
}
