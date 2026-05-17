import { useEffect, useMemo, useState } from "react";
import { ChevronRight, MessageCircle, Plus, Search, Send, UserRound } from "lucide-react";
import { ensureConversation, loadUserConversations, loadUserFriends, markConversationRead, sendConversationMessage } from "../../db";
import { useNotifications } from "../../context/NotificationContext";

export function MessagesPage({ user }) {
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateConversation, setShowCreateConversation] = useState(false);
  const [creatingUserId, setCreatingUserId] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messageStatus, setMessageStatus] = useState("");
  const { refreshNotifications } = useNotifications();

  const friendById = useMemo(() => new Map(friends.map((friend) => [friend.userId, friend])), [friends]);
  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId);

  const filteredConversations = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((conversation) => {
      const title = conversationTitle(conversation).toLowerCase();
      const latestMessage = conversation.messages.at(-1)?.message?.toLowerCase() || "";
      return title.includes(term) || latestMessage.includes(term);
    });
  }, [conversations, searchQuery, friendById]);

  async function refreshMessages() {
    if (!user?.uid) return;
    setLoading(true);
    const [nextConversations, nextFriends] = await Promise.all([
      loadUserConversations(user.uid),
      loadUserFriends(user.uid),
    ]);
    setConversations(nextConversations);
    setFriends(nextFriends);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      loadUserConversations(user?.uid),
      loadUserFriends(user?.uid),
    ]).then(([nextConversations, nextFriends]) => {
      if (!active) return;
      setConversations(nextConversations);
      setFriends(nextFriends);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user?.uid]);

  function conversationTitle(conversation) {
    const otherUsers = conversation.users.filter((userId) => userId !== user?.uid);
    return otherUsers.map((userId) => friendById.get(userId)?.name || userId).join(", ") || "Conversation";
  }

  function conversationPhoto(conversation) {
    const otherUserId = conversation.users.find((userId) => userId !== user?.uid);
    return friendById.get(otherUserId)?.photoURL || "";
  }

  function activityLabel(conversation) {
    const activityDate = conversation.messages.at(-1)?.sentAt || conversation.updatedAt;
    if (!activityDate) return "";
    const date = new Date(activityDate);
    if (Number.isNaN(date.getTime())) return "";

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function unreadCount(conversation) {
    const readAt = conversation.readBy?.[user?.uid] || "";
    return conversation.messages.filter((message) => (
      message.userId !== user?.uid
      && (!readAt || String(message.sentAt).localeCompare(String(readAt)) > 0)
    )).length;
  }

  async function openConversation(conversation) {
    setSelectedConversationId(conversation.id);
    if (unreadCount(conversation) > 0) {
      await markConversationRead(user.uid, conversation.id);
      await Promise.all([refreshMessages(), refreshNotifications()]);
    }
  }

  async function startConversation(friend) {
    try {
      setCreatingUserId(friend.userId);
      const result = await ensureConversation(user.uid, friend.userId);
      setMessageStatus(result.synced ? "Conversation ready." : "Conversation created on this device.");
      setShowCreateConversation(false);
      await refreshMessages();
      await refreshNotifications();
    } catch (error) {
      setMessageStatus(error.message || "Could not start conversation.");
    } finally {
      setCreatingUserId("");
    }
  }

  function closeThread() {
    setSelectedConversationId("");
    setMessageText("");
  }

  async function submitMessage(event) {
    event.preventDefault();
    const text = messageText.trim();
    if (!text || !selectedConversation?.id) return;
    try {
      const result = await sendConversationMessage(user.uid, selectedConversation.id, text);
      setMessageText("");
      setMessageStatus(result.synced ? "Message sent." : "Message saved on this device.");
      await refreshMessages();
      await refreshNotifications();
    } catch (error) {
      setMessageStatus(error.message || "Could not send message.");
    }
  }

  return (
    <section className="messages-panel messages-inbox-panel">
      <div className="messages-inbox-header">
        <div className="section-heading">
          <MessageCircle size={20} />
          <h2>Messages</h2>
        </div>
      </div>
      {messageStatus && <p className="empty-list-copy">{messageStatus}</p>}
      <div className="messages-inbox-shell">
        {loading ? (
          <p className="empty-list-copy">Loading messages...</p>
        ) : filteredConversations.length ? (
          <div className="conversation-list messages-inbox-list" aria-label="Conversations">
            {filteredConversations.map((conversation) => {
              const title = conversationTitle(conversation);
              const photoURL = conversationPhoto(conversation);
              const latestMessage = conversation.messages.at(-1)?.message || "No messages yet";
              const unread = unreadCount(conversation);
              return (
                <button className="conversation-button message-preview-row" type="button" key={conversation.id} onClick={() => openConversation(conversation)}>
                  <span className="friend-avatar message-avatar">
                    {photoURL ? <img src={photoURL} alt="" /> : <UserRound size={22} />}
                  </span>
                  <span className="message-preview-main">
                    <strong>{title}</strong>
                    <span>{latestMessage}</span>
                  </span>
                  <span className="message-preview-meta">
                    {activityLabel(conversation) && <span>{activityLabel(conversation)}</span>}
                    {unread > 0 && <span className="message-unread-badge">{unread > 99 ? "99+" : unread}</span>}
                    <ChevronRight size={18} />
                  </span>
                </button>
              );
            })}
          </div>
        ) : searchQuery.trim() ? (
          <p className="empty-list-copy">No conversations match that search.</p>
        ) : (
          <p className="empty-list-copy">Start a conversation from a friend profile to see it here.</p>
        )}
      </div>
      <div className="messages-bottom-bar" aria-label="Message actions">
        <label className="messages-search-field">
          <Search size={18} />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search" />
        </label>
        <button className="primary messages-create-button" type="button" onClick={() => setShowCreateConversation(true)} aria-label="Create conversation">
          <Plus size={20} />
        </button>
      </div>
      {showCreateConversation && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel modal-form friend-search-modal" role="dialog" aria-modal="true" aria-labelledby="new-conversation-title">
            <div>
              <p className="eyebrow">New message</p>
              <h2 id="new-conversation-title">Create conversation</h2>
            </div>
            <div className="friend-search-results">
              {friends.length ? (
                friends.map((friend) => (
                  <div className="friend-search-result" key={friend.userId}>
                    <span className="friend-avatar">
                      {friend.photoURL ? <img src={friend.photoURL} alt="" /> : <UserRound size={22} />}
                    </span>
                    <strong>{friend.name}</strong>
                    <button className="secondary" type="button" onClick={() => startConversation(friend)} disabled={creatingUserId === friend.userId}>
                      {creatingUserId === friend.userId ? "Creating..." : "Create"}
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-list-copy">Add friends before creating a conversation.</p>
              )}
            </div>
            <div className="modal-action-row">
              <button className="secondary" type="button" onClick={() => setShowCreateConversation(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedConversation && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel message-thread-modal" role="dialog" aria-modal="true" aria-labelledby="message-thread-title">
            <div className="message-thread-header">
              <h3 id="message-thread-title">{conversationTitle(selectedConversation)}</h3>
            </div>
            <div className="message-list">
              {selectedConversation.messages.length ? (
                selectedConversation.messages.map((message, index) => (
                  <div className={message.userId === user?.uid ? "message-bubble mine" : "message-bubble"} key={`${message.sentAt}:${index}`}>
                    <p>{message.message}</p>
                    <span>{message.userId === user?.uid ? "You" : friendById.get(message.userId)?.name || message.userId}</span>
                  </div>
                ))
              ) : (
                <p className="empty-list-copy">No messages yet.</p>
              )}
            </div>
            <form className="message-compose" onSubmit={submitMessage}>
              <input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Write a message" autoFocus />
              <button className="primary" type="submit" disabled={!messageText.trim()}>
                <Send size={16} />
                Send
              </button>
            </form>
            <div className="modal-action-row">
              <button className="secondary" type="button" onClick={closeThread}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
