import { endSession } from "@/lib/companion/auth";

export async function POST() {
  await endSession();
  return new Response(null, { status: 204 });
}
