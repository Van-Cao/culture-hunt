import Image from "next/image";
import { useState } from "react";
import { Box, Image as Photo } from "lucide-react";
import type { Checkpoint } from "@/lib/palace/checkpoints";
import { useLanguage } from "@/components/UI/LanguageProvider";
import { StageScenery } from "./PalaceScenery";

export default function PalaceRoomStudy({ checkpoint }: { checkpoint: Checkpoint }) {
  const { t } = useLanguage();
  const [model, setModel] = useState(false);
  return (
    <div className="palace-room-study">
      <div className="room-view-options" role="group" aria-label={t("Góc nhìn checkpoint", "Checkpoint views")}>
        <button type="button" aria-pressed={!model} onClick={() => setModel(false)}>
          <Photo size={18} />{t("Ảnh thật", "Photo")}
        </button>
        <button type="button" aria-pressed={model} onClick={() => setModel(true)}>
          <Box size={18} />{t("Tiểu cảnh 2.5D", "2.5D diorama")}
        </button>
      </div>
      <figure>
        <div className="room-view-image">
          {model ? (
            <svg viewBox="-158 -190 316 265" role="img" aria-label={checkpoint.name}><StageScenery id={checkpoint.id} /></svg>
          ) : (
            <Image src={checkpoint.photo} alt={checkpoint.name} fill sizes="(max-width: 760px) 95vw, 620px" />
          )}
        </div>
        <figcaption>{model ? t("Tiểu cảnh 2.5D", "2.5D diorama") : t("Ảnh thật · Di tích Dinh Độc Lập", "Reference photo · Independence Palace")}</figcaption>
      </figure>
    </div>
  );
}
