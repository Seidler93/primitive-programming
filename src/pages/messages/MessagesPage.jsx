import React from "react";
import { MessageCircle } from "lucide-react";

export function MessagesPage() {
  return (
    <section className="programs-panel">
      <div className="section-heading">
        <MessageCircle size={20} />
        <h2>Messages</h2>
      </div>
      <p className="empty-list-copy">Messages will live here.</p>
    </section>
  );
}
