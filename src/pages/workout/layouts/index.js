import { BikingLayout } from "./BikingLayout";
import { RowingLayout } from "./RowingLayout";
import { RunningLayout } from "./RunningLayout";
import { SportLayout } from "./SportLayout";
import { StrengthLayout } from "./StrengthLayout";
import { SwimmingLayout } from "./SwimmingLayout";
import { WalkingLayout } from "./WalkingLayout";

export { AddCardioModalLayout } from "./AddCardioModal";
export { AddExerciseModalLayout } from "./AddExerciseModal";
export { AddWarmupModalLayout } from "./AddWarmupModal";
export { WarmupLayout } from "./WarmupLayout";

export const workoutTypeLayouts = {
  strength: StrengthLayout,
  biking: BikingLayout,
  rowing: RowingLayout,
  running: RunningLayout,
  sport: SportLayout,
  swimming: SwimmingLayout,
  walking: WalkingLayout,
};
