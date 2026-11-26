import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfigured } from "./config";

export async function supabaseServer() {
  if (!supabaseConfigured) return null;
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: Boolean(process.env.VERCEL) },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: values => { values.forEach(({ name, value, options }) => jar.set(name, value, options)); },
    },
  });
}

export async function currentAccount() {
  const client = await supabaseServer();
  if (!client) return null;
  // Verify with Auth on every data request; never authorize from unverified cookie claims.
  const { data, error } = await client.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError" && (!error.status || error.status >= 500)) throw new Error("Authentication unavailable");
  const user = data.user;
  return user ? { id: user.id, name: String(user.user_metadata?.display_name || user.email?.split("@")[0] || "Nhà thám hiểm"), email: user.email || "" } : null;
}
