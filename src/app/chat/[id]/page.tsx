import { notFound } from "next/navigation";
import { ChatView } from "@/components/sites/joi/chat-view";
import { getCharacter, getChat } from "@/lib/companion/store";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chat = await getChat(id);
  const character = chat ? await getCharacter(chat.characterId) : null;
  if (!chat || !character) notFound();
  return <ChatView initialChat={chat} character={character} />;
}
