import React from "react";
import { MessageCircle, Plus, TrendingUp, Utensils } from "lucide-react";

const bottomNavItems = [
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "food-log", label: "Food Log", icon: Utensils },
];

export function BottomNav({ onAddWorkout, onOpenView, view }) {
  return (
    <nav className="bottom-nav" aria-label="Primary shortcuts">
      <button className="bottom-nav-button bottom-nav-add" type="button" onClick={onAddWorkout} aria-label="Add workout for today" title="Add workout">
        <Plus size={24} />
      </button>
      {bottomNavItems.map((item) => (
        <button
          className={view === item.id ? "bottom-nav-button active" : "bottom-nav-button"}
          type="button"
          key={item.id}
          onClick={() => onOpenView(item.id)}
          aria-label={item.label}
          title={item.label}
        >
          <item.icon size={21} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
