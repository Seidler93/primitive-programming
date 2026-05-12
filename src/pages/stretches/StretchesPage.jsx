import React from "react";
import { PersonStanding } from "lucide-react";

export function StretchesPage() {
  return (
    <section className="programs-panel">
      <div className="section-heading">
        <PersonStanding size={20} />
        <h2>Stretches</h2>
      </div>
      <p className="empty-list-copy">Stretch routines will live here.</p>
    </section>
  );
}
