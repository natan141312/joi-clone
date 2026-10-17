import { notFound } from "next/navigation";
import { ChatView } from "@/components/sites/joi/chat-view";
import { getOwnedChat } from "@/lib/companion/access";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await getOwnedChat(id);
  if (!owned) notFound();
  return <ChatView initialChat={owned.chat} character={owned.character} />;
}
