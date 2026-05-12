import React from "react";
import { Flame } from "lucide-react";

export function WarmupCooldownPage() {
  return (
    <section className="programs-panel">
      <div className="section-heading">
        <Flame size={20} />
        <h2>Warm Up / Cooldown</h2>
      </div>
      <p className="empty-list-copy">Warm-up and cooldown flows will live here.</p>
    </section>
  );
}
