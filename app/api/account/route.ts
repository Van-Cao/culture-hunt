import { supabaseServer, currentAccount } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { checkOrigin, gameError, gameResponse, guestId } from "@/lib/palace/http";
import { claimGuest, GameError, hasGuestProgress, saveProfile } from "@/lib/palace/store";

export async function GET() {
  try {
    const user = await currentAccount();
    if (user) {
      await saveProfile(user.id, user.name);
      const guest = await guestId();
      // Recover a login whose Auth step succeeded but whose database merge was interrupted.
      if (await hasGuestProgress(guest)) { await claimGuest(guest, `user:${user.id}`); await guestId(true); }
    } else {
      // Establish one guest identity before the game starts its parallel data reads.
      await guestId();
    }
    return gameResponse({ user, configured: supabaseConfigured });
  }
  catch (error) { return gameError(error); }
}

function authMessage(code?: string) {
  if (code === "invalid_credentials") return "Email hoặc mật khẩu chưa đúng. / Incorrect email or password.";
  if (code === "user_already_exists" || code === "email_exists") return "Email đã được đăng ký. Hãy đăng nhập. / Email already registered. Please sign in.";
  if (code === "email_not_confirmed") return "Tài khoản đang chờ xác nhận email. Bản demo cần tắt Confirm email trong Supabase. / Email confirmation is enabled for this demo project.";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") return "Bạn thử hơi nhanh. Vui lòng thử lại sau. / Too many attempts. Please try again shortly.";
  return "Chưa hoàn tất đăng nhập. Kiểm tra thông tin và thử lại. / Could not sign in. Check your details and retry.";
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const raw = await request.text();
    if (raw.length > 2000) throw new GameError("Yêu cầu quá lớn. / Request too large.", 413);
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new GameError("Yêu cầu không hợp lệ. / Invalid request.");
    const client = await supabaseServer();
    if (!client || !process.env.DATABASE_URL) throw new GameError("Kết nối tài khoản chưa được cấu hình. / Account connection is not configured.", 503);
    if (body.action === "signout") {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw new GameError("Chưa đăng xuất được. Thử lại. / Could not sign out. Please retry.", 503);
      await guestId(true);
      return gameResponse({ user: null });
    }
    if (body.action !== "signin" && body.action !== "signup") throw new GameError("Yêu cầu không hợp lệ. / Invalid action.");
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 8 || password.length > 128 || (body.action === "signup" && (!name || name.length > 80)))
      throw new GameError("Điền email hợp lệ, tên tối đa 80 ký tự và mật khẩu ít nhất 8 ký tự. / Use a valid email, a name up to 80 characters and a password of at least 8 characters.");
    const guest = await guestId();
    const result = body.action === "signup" ? await client.auth.signUp({ email, password, options: { data: { display_name: name } } }) : await client.auth.signInWithPassword({ email, password });
    if (result.error) throw new GameError(authMessage(result.error.code), result.error.status === 429 ? 429 : 400);
    if (!result.data.session) throw new GameError(authMessage("email_not_confirmed"), 409);
    const user = await currentAccount();
    if (!user) throw new GameError("Chưa xác thực được tài khoản. / Could not verify account.", 503);
    await saveProfile(user.id, user.name);
    await claimGuest(guest, `user:${user.id}`);
    await guestId(true);
    return gameResponse({ user });
  } catch (error) { return gameError(error); }
}
