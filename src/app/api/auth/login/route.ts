import { cookies } from "next/headers";
import { ANON_COOKIE, findUserByEmail, startSession, toPublic, validateCredentials, verifyPassword } from "@/lib/companion/auth";
import { claimAnonymousData } from "@/lib/companion/store";

export async function POST(req: Request) {
  const { email, password, errors } = validateCredentials(await req.json().catch(() => null), { signup: false });
  if (errors.length) return Response.json({ errors }, { status: 400 });
  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json({ errors: ["Wrong email or password"] }, { status: 401 });
  }
  const anon = (await cookies()).get(ANON_COOKIE)?.value;
  if (anon) await claimAnonymousData(anon, user.id);
  await startSession(toPublic(user));
  return Response.json(toPublic(user));
}
