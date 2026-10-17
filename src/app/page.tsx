import { JoiHome, type HomeCard } from "@/components/sites/joi/joi-home";
import { listCharacters } from "@/lib/companion/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const characters = await listCharacters();
  const cards: HomeCard[] = characters.map((c) => ({
    id: c.id,
    tagline: c.tagline,
    name: c.name,
    age: c.age,
    blurb: c.description,
    likes: "New",
    chats: "0",
    badge: "Original",
    image: c.avatar,
  }));
  return <JoiHome cards={cards} />;
}
