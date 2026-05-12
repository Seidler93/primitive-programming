import React from "react";
import { Plus, Utensils } from "lucide-react";

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
              <strong>{macro.remaining}{macro.unit}</strong>
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
