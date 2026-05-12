import {
  Flame,
  MessageCircle,
  Newspaper,
  PersonStanding,
  Plus,
  ShoppingBag,
  Utensils,
} from "lucide-react";
import { storePrograms } from "../app/config";

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

export function FoodLogPage() {
  const calorieGoal = 2400;
  const macroTargets = [
    { label: "Protein", remaining: 180, unit: "g" },
    { label: "Carbs", remaining: 260, unit: "g" },
    { label: "Fat", remaining: 75, unit: "g" },
  ];
  const mealSections = ["Breakfast", "Lunch", "Dinner", "Snacks"];

  return (
    <section className="programs-panel food-log-panel">
      <div className="section-heading">
        <Utensils size={20} />
        <h2>Food Log</h2>
      </div>

      <div className="food-summary">
        <div className="calorie-card">
          <span>Calories remaining</span>
          <strong>{calorieGoal.toLocaleString()}</strong>
        </div>
        <div className="macro-grid">
          {macroTargets.map((macro) => (
            <div className="macro-card" key={macro.label}>
              <span>{macro.label}</span>
              <strong>
                {macro.remaining}
                {macro.unit}
              </strong>
              <small>remaining</small>
            </div>
          ))}
        </div>
      </div>

      <div className="meal-section-list">
        {mealSections.map((meal) => (
          <section className="meal-section" key={meal} aria-labelledby={`${meal.toLowerCase()}-meal-title`}>
            <div>
              <h3 id={`${meal.toLowerCase()}-meal-title`}>{meal}</h3>
              <p className="empty-list-copy">No foods logged yet.</p>
            </div>
            <button className="add-food-button" type="button">
              <Plus size={18} />
              Add food
            </button>
          </section>
        ))}
      </div>
    </section>
  );
}

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
