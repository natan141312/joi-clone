import { notFound } from "next/navigation";
import { ChatView } from "@/components/sites/joi/chat-view";
import { getOwnedChat } from "@/lib/companion/access";
import { getCurrentUser, getViewerId } from "@/lib/companion/auth";
import { avatarFor } from "@/lib/companion/avatar";
import { getCharacter, getChat, newChatDraft } from "@/lib/companion/store";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ c?: string | string[] }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  let owned = await getOwnedChat(id);
  if (!owned) {
    // Not on this server: show a fresh chat (or the browser's saved copy) for ?c=<character>.
    // It is saved on the first message. Chats that belong to someone else stay hidden.
    const characterId = typeof sp.c === "string" ? sp.c : "";
    const character = characterId ? await getCharacter(characterId) : null;
    if (!character || !/^[a-zA-Z0-9-]{1,80}$/.test(id) || (await getChat(id))) notFound();
    const [user, viewer] = await Promise.all([getCurrentUser(), getViewerId()]);
    owned = { chat: newChatDraft(character, user?.name ?? "friend", viewer ?? "", id), character };
  }
  return <ChatView initialChat={owned.chat} character={{ ...owned.character, avatar: avatarFor(owned.character) }} />;
}
