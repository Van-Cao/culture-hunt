import { Suspense } from "react";
import { connection } from "next/server";
import CultureHunt from "@/components/UI/CultureHunt";
import { auth, googleAuthConfigured } from "@/auth";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <Suspense
      fallback={
        <main className="loading-screen" role="status">
          <span>✦</span>
          <strong>CULTURE HUNT</strong>
          <p>Đang mở hành trình · Loading your adventure…</p>
        </main>
      }
    >
      <AuthenticatedGame searchParams={searchParams} />
    </Suspense>
  );
}

async function AuthenticatedGame({
  searchParams,
}: Pick<PageProps<"/">, "searchParams">) {
  await connection();
  const query = await searchParams;
  const value = (key: string) => {
    const entry = query[key];
    return Array.isArray(entry) ? entry[0] : entry;
  };
  const language = value("lang");
  const destination = value("place");
  const view = value("view");
  const session = googleAuthConfigured ? await auth() : null;
  return (
    <CultureHunt
      session={session}
      googleEnabled={googleAuthConfigured}
      initialLocale={
        language === "vi" || language === "en" ? language : undefined
      }
      initialPlay={value("play") === "1"}
      initialStart={value("start") === "1"}
      initialAuthFailed={Boolean(value("error"))}
      initialDestination={
        destination === "palace" || destination === "hcmus"
          ? destination
          : undefined
      }
      initialView={
        view === "home" ||
        view === "journeys" ||
        view === "scan" ||
        view === "collection"
          ? view
          : undefined
      }
    />
  );
}
