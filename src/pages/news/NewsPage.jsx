import React from "react";
import { Newspaper } from "lucide-react";

export function NewsPage() {
  return (
    <section className="programs-panel">
      <div className="section-heading">
        <Newspaper size={20} />
        <h2>News</h2>
      </div>
      <p className="empty-list-copy">News updates will live here.</p>
    </section>
  );
}
