import { getCurrentUser } from "@/lib/companion/auth";

export async function GET() {
  return Response.json({ user: await getCurrentUser() });
}
