import { cookies } from "next/headers";
import { ANON_COOKIE, hashPassword, startSession, toPublic, validateCredentials } from "@/lib/companion/auth";
import { claimAnonymousData, createUser, findUserByEmail } from "@/lib/companion/store";

export async function POST(req: Request) {
  const { email, password, name, errors } = validateCredentials(await req.json().catch(() => null), { signup: true });
  if (errors.length) return Response.json({ errors }, { status: 400 });
  if (await findUserByEmail(email)) return Response.json({ errors: ["An account with this email already exists"] }, { status: 409 });
  const user = await createUser({ name, email, passwordHash: await hashPassword(password) });
  const anon = (await cookies()).get(ANON_COOKIE)?.value;
  if (anon) await claimAnonymousData(anon, user.id);
  await startSession(toPublic(user));
  return Response.json(toPublic(user), { status: 201 });
}
