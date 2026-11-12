import type { ReactNode } from "react";
import { Compass } from "lucide-react";

export default function JourneyHeader({
  chapter,
  edition,
  title,
  description,
  heading = "h1",
  children,
}: {
  chapter: string;
  edition: string;
  title: ReactNode;
  description: string;
  heading?: "h1" | "h2";
  children: ReactNode;
}) {
  const Title = heading;
  return (
    <>
      <div className="palace-title-row">
        <div>
          <span className="palace-overline">{chapter}</span>
          <Title>{title}</Title>
          <p>{description}</p>
        </div>
        <span className="palace-edition" aria-hidden="true">
          <Compass size={26} strokeWidth={1.2} />
          <span>SAIGON<br />HERITAGE / {edition}</span>
        </span>
      </div>
      <div className="palace-summary-strip">{children}</div>
    </>
  );
}
