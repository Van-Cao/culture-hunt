import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const googleAuthConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID &&
  process.env.AUTH_GOOGLE_SECRET &&
  process.env.AUTH_SECRET,
);
export const { handlers, auth } = NextAuth({
  providers: [
    Google({ authorization: { params: { prompt: "select_account" } } }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/", error: "/" },
});
