import { useEffect, useState } from "react";
import { Plus, UsersRound } from "lucide-react";
import { createCommunity, joinCommunity, loadUserCommunities } from "../../db";

export function CommunityPage({ user }) {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showJoinCommunity, setShowJoinCommunity] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [communityCode, setCommunityCode] = useState("");
  const [communityMessage, setCommunityMessage] = useState("");

  async function refreshCommunities() {
    if (!user?.uid) return;
    setLoading(true);
    const nextCommunities = await loadUserCommunities(user.uid);
    setCommunities(nextCommunities);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadUserCommunities(user?.uid).then((nextCommunities) => {
      if (!active) return;
      setCommunities(nextCommunities);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user?.uid]);

  async function submitCreateCommunity(event) {
    event.preventDefault();
    const name = communityName.trim();
    if (!name) return;
    try {
      const result = await createCommunity(user.uid, name);
      setCommunityName("");
      setShowCreateCommunity(false);
      setCommunityMessage(result.synced ? "Community created." : "Community created on this device.");
      await refreshCommunities();
    } catch (error) {
      setCommunityMessage(error.message || "Could not create community.");
    }
  }

  async function submitJoinCommunity(event) {
    event.preventDefault();
    const code = communityCode.trim();
    if (!code) return;
    try {
      const result = await joinCommunity(user.uid, code);
      setCommunityCode("");
      setShowJoinCommunity(false);
      setCommunityMessage(result.synced ? "Community joined." : "Community joined on this device.");
      await refreshCommunities();
    } catch (error) {
      setCommunityMessage(error.message || "Could not join community.");
    }
  }

  return (
    <section className="programs-panel community-panel">
      <div className="community-header">
        <div className="section-heading">
          <UsersRound size={20} />
          <h2>Communities</h2>
        </div>
        <div className="community-actions">
          <button className="secondary" type="button" onClick={() => setShowJoinCommunity(true)}>
            <UsersRound size={17} />
            Join community
          </button>
          <button className="primary" type="button" onClick={() => setShowCreateCommunity(true)}>
            <Plus size={17} />
            Create community
          </button>
        </div>
      </div>
      {communityMessage && <p className="empty-list-copy">{communityMessage}</p>}
      {loading ? (
        <p className="empty-list-copy">Loading communities...</p>
      ) : communities.length ? (
        <div className="community-grid">
          {communities.map((community) => (
            <article className="community-card" key={community.id}>
              <div>
                <p className="eyebrow">{community.id}</p>
                <h3>{community.name}</h3>
              </div>
              <p>{community.memberCount === 1 ? "1 member" : `${community.memberCount} members`}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-list-copy">Join or create a community to see it here.</p>
      )}
      {showCreateCommunity && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal-panel modal-form" onSubmit={submitCreateCommunity} role="dialog" aria-modal="true" aria-labelledby="create-community-title">
            <div>
              <p className="eyebrow">New community</p>
              <h2 id="create-community-title">Create community</h2>
            </div>
            <label>
              Community name
              <input value={communityName} onChange={(event) => setCommunityName(event.target.value)} placeholder="Barbell Club" autoFocus />
            </label>
            <div className="modal-action-row">
              <button className="secondary" type="button" onClick={() => setShowCreateCommunity(false)}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={!communityName.trim()}>
                Create community
              </button>
            </div>
          </form>
        </div>
      )}
      {showJoinCommunity && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal-panel modal-form" onSubmit={submitJoinCommunity} role="dialog" aria-modal="true" aria-labelledby="join-community-title">
            <div>
              <p className="eyebrow">Community invite</p>
              <h2 id="join-community-title">Join community</h2>
            </div>
            <label>
              Community code
              <input value={communityCode} onChange={(event) => setCommunityCode(event.target.value)} placeholder="barbell-club" autoFocus />
            </label>
            <div className="modal-action-row">
              <button className="secondary" type="button" onClick={() => setShowJoinCommunity(false)}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={!communityCode.trim()}>
                Join community
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
