import { useEffect, useState } from "react";
import { MessageCircle, Plus, Search, UserPlus, UserRound } from "lucide-react";
import { acceptFriendInvite, declineFriendInvite, ensureConversation, loadUserFriends, searchFriendUsers, sendFriendInvite } from "../../db";
import { useNotifications } from "../../context/NotificationContext";

export function FriendsPage({ user }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendMessage, setFriendMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState("");
  const [handlingInviteId, setHandlingInviteId] = useState("");
  const { notifications, refreshNotifications } = useNotifications();
  const friendInvites = notifications.filter((notification) => notification.type === "friend-invite" && notification.status !== "read");

  async function refreshFriends() {
    if (!user?.uid) return;
    setLoading(true);
    const nextFriends = await loadUserFriends(user.uid);
    setFriends(nextFriends);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadUserFriends(user?.uid).then((nextFriends) => {
      if (!active) return;
      setFriends(nextFriends);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!showAddFriend) return;
    let active = true;
    const query = searchQuery.trim();
    const friendIds = new Set(friends.map((friend) => friend.userId));
    setSearchResults([]);
    if (query.length < 2) {
      setSearching(false);
      return () => {
        active = false;
      };
    }

    setSearching(true);
    const timer = setTimeout(() => {
      searchFriendUsers(query, user?.uid).then((results) => {
        if (!active) return;
        setSearchResults(results.filter((result) => !friendIds.has(result.userId)));
        setSearching(false);
      });
    }, 220);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [friends, searchQuery, showAddFriend, user?.uid]);

  function closeAddFriend() {
    setShowAddFriend(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearching(false);
    setAddingUserId("");
  }

  async function addFriendFromResult(friend) {
    if (!friend?.userId || !friend?.name) return;
    try {
      setAddingUserId(friend.userId);
      const result = await sendFriendInvite(user, {
        userId: friend.userId,
        name: friend.name,
        photoURL: friend.photoURL,
      });
      closeAddFriend();
      setFriendMessage(result.synced ? "Friend invite sent." : "Friend invite saved on this device.");
      await refreshNotifications();
      await refreshFriends();
    } catch (error) {
      setFriendMessage(error.message || "Could not send friend invite.");
    } finally {
      setAddingUserId("");
    }
  }

  async function acceptInvite(invite) {
    try {
      setHandlingInviteId(invite.id);
      const result = await acceptFriendInvite(user, invite);
      setFriendMessage(result.synced ? "Friend added." : "Friend added on this device.");
      await Promise.all([refreshFriends(), refreshNotifications()]);
    } catch (error) {
      setFriendMessage(error.message || "Could not accept friend invite.");
    } finally {
      setHandlingInviteId("");
    }
  }

  async function declineInvite(invite) {
    try {
      setHandlingInviteId(invite.id);
      await declineFriendInvite(user.uid, invite.id);
      setFriendMessage("Friend invite dismissed.");
      await refreshNotifications();
    } catch (error) {
      setFriendMessage(error.message || "Could not dismiss friend invite.");
    } finally {
      setHandlingInviteId("");
    }
  }

  async function startConversation(friend) {
    try {
      const result = await ensureConversation(user.uid, friend.userId);
      setFriendMessage(result.synced ? "Conversation ready." : "Conversation created on this device.");
    } catch (error) {
      setFriendMessage(error.message || "Could not start conversation.");
    }
  }

  return (
    <section className="programs-panel community-panel">
      <div className="community-header">
        <div className="section-heading">
          <UserPlus size={20} />
          <h2>Friends</h2>
        </div>
        <div className="community-actions">
          <button className="primary" type="button" onClick={() => setShowAddFriend(true)}>
            <Plus size={17} />
            Add friend
          </button>
        </div>
      </div>
      {friendMessage && <p className="empty-list-copy">{friendMessage}</p>}
      {friendInvites.length > 0 && (
        <div className="friend-invite-list" aria-label="Friend invites">
          {friendInvites.map((invite) => (
            <article className="friend-invite-card" key={invite.id}>
              <div className="friend-summary">
                <span className="friend-avatar">
                  {invite.actorPhotoURL ? <img src={invite.actorPhotoURL} alt="" /> : <UserRound size={22} />}
                </span>
                <div>
                  <h3>{invite.actorName || "Friend invite"}</h3>
                  <p>{invite.body || "Sent you a friend invite."}</p>
                </div>
              </div>
              <div className="friend-invite-actions">
                <button className="secondary" type="button" onClick={() => declineInvite(invite)} disabled={handlingInviteId === invite.id}>
                  Decline
                </button>
                <button className="primary" type="button" onClick={() => acceptInvite(invite)} disabled={handlingInviteId === invite.id}>
                  Accept
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {loading ? (
        <p className="empty-list-copy">Loading friends...</p>
      ) : friends.length ? (
        <div className="community-grid">
          {friends.map((friend) => (
            <article className="community-card friend-card" key={friend.userId}>
              <div className="friend-summary">
                <span className="friend-avatar">
                  {friend.photoURL ? <img src={friend.photoURL} alt="" /> : <UserRound size={22} />}
                </span>
                <h3>{friend.name}</h3>
              </div>
              <button className="secondary" type="button" onClick={() => startConversation(friend)}>
                <MessageCircle size={16} />
                Message
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-list-copy">Add friends to see them here.</p>
      )}
      {showAddFriend && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel modal-form friend-search-modal" role="dialog" aria-modal="true" aria-labelledby="add-friend-title">
            <div>
              <p className="eyebrow">New friend</p>
              <h2 id="add-friend-title">Add friend</h2>
            </div>
            <label className="friend-search-field">
              Search by email or profile name
              <span>
                <Search size={17} />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search users" autoFocus />
              </span>
            </label>
            <div className="friend-search-results" aria-live="polite">
              {searchQuery.trim().length < 2 ? (
                <p className="empty-list-copy">Enter at least 2 characters to search.</p>
              ) : searching ? (
                <p className="empty-list-copy">Searching...</p>
              ) : searchResults.length ? (
                searchResults.map((result) => (
                  <div className="friend-search-result" key={result.userId}>
                    <span className="friend-avatar">
                      {result.photoURL ? <img src={result.photoURL} alt="" /> : <UserRound size={22} />}
                    </span>
                    <strong>{result.name}</strong>
                    <button className="secondary" type="button" onClick={() => addFriendFromResult(result)} disabled={addingUserId === result.userId}>
                      {addingUserId === result.userId ? "Sending..." : "Invite"}
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-list-copy">No users found.</p>
              )}
            </div>
            <div className="modal-action-row">
              <button className="secondary" type="button" onClick={closeAddFriend}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
