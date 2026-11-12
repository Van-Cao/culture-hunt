import Image from "next/image";
import type { Checkpoint } from "@/lib/palace/checkpoints";
import { useLanguage } from "@/components/UI/LanguageProvider";
import { StageScenery } from "./PalaceScenery";

export default function PalaceRoomStudy({ checkpoint }: { checkpoint: Checkpoint }) {
  const { t } = useLanguage();
  return <div className="palace-room-study">
    <figure className="palace-room-model">
      <svg viewBox="-158 -190 316 265" role="img" aria-label={`${t("Tiểu cảnh", "Diorama")}: ${checkpoint.name}`}><StageScenery id={checkpoint.id} /></svg>
      <figcaption>{t("Tiểu cảnh 2.5D", "2.5D diorama")}</figcaption>
    </figure>
    <figure>
      <Image src={checkpoint.photo} alt={checkpoint.name} width={700} height={430} />
      <figcaption>{t("Ảnh thật · Di tích Dinh Độc Lập", "Reference photo · Independence Palace")}</figcaption>
    </figure>
  </div>;
}
