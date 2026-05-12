import React from "react";
import { ShoppingBag } from "lucide-react";
import { storePrograms } from "../../app/config";

export function StorePage() {
  return (
    <section className="programs-panel store-panel">
      <div className="section-heading">
        <ShoppingBag size={20} />
        <h2>Store</h2>
      </div>

      <div className="store-grid">
        {storePrograms.map((program) => (
          <article className="store-card" key={program.id}>
            <div>
              <p className="eyebrow">{program.eyebrow}</p>
              <h3>{program.name}</h3>
            </div>
            <p>{program.description}</p>
            <div className="store-card-footer">
              <strong>{program.price}</strong>
              <button className="primary" type="button">
                <ShoppingBag size={17} />
                Buy program
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
