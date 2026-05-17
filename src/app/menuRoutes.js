import { CalendarDays, ClipboardList, Dumbbell, Flame, MessageCircle, Newspaper, PersonStanding, Settings, ShoppingBag, TrendingUp, Trophy, UserPlus, Utensils, UserRound, UsersRound, } from "lucide-react";

export const menuRoutes = [
  { id: "home", view: "client", label: "Home", icon: CalendarDays },
  { id: "profile", view: "profile", label: "Profile", icon: UserRound },
  { id: "store", view: "store", label: "Store", icon: ShoppingBag },
  { id: "community", view: "community", label: "Communities", icon: UsersRound },
  { id: "friends", view: "friends", label: "Friends", icon: UserPlus },
  { id: "messages", view: "messages", label: "Messages", icon: MessageCircle },
  { id: "news", view: "news", label: "News", icon: Newspaper },
  { id: "programs", view: "programs", label: "Programs", icon: ClipboardList },
  { id: "stored-workouts", view: "stored-workouts", label: "Workouts", icon: Dumbbell },
  { id: "food-log", view: "food-log", label: "Food Log", icon: Utensils },
  { id: "stretches", view: "stretches", label: "Stretches", icon: PersonStanding },
  { id: "warmup-cooldown", view: "warmup-cooldown", label: "Warm Up / Cooldown", icon: Flame },
  { id: "maxes", view: "maxes", label: "Maxes", icon: Trophy },
  { id: "progress", view: "progress", label: "Progress", icon: TrendingUp, hideForTrainer: true },
  { id: "program-builder", view: "program-builder", label: "Program Builder", icon: ClipboardList, trainerOnly: true, hideOnMobile: true },
  { id: "athletes", view: "athletes", label: "Athletes", icon: UsersRound, trainerOnly: true },
  { id: "settings", view: "settings", label: "Settings", icon: Settings },
];

export const defaultMenuButtonOrder = menuRoutes.map((item) => item.id);
export const menuButtonItemMap = Object.fromEntries(menuRoutes.map((item) => [item.id, item]));
