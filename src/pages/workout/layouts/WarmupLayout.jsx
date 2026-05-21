import React from "react";
import { Minus, PencilLine, Plus, Save } from "lucide-react";
import { ExerciseAutocomplete, SimilarExerciseButtons } from "../../../components/exercise/ExerciseAutocomplete";

export function WarmupLayout({
  addCustomSet,
  collapsedExercises,
  customSetSummary,
  exerciseCollapseId,
  exerciseMenuId,
  isCustomExerciseComplete,
  onToggleCollapse,
  onToggleMenu,
  openExerciseMenu,
  removeCustomExercise,
  removeCustomSetOrExercise,
  saveExerciseEdit,
  typed = false,
  updateCustomExerciseField,
  updateCustomSet,
  warmups,
}) {
  return (
    <>
      {warmups.map((exercise) => {
        const collapseId = exerciseCollapseId("custom", exercise.id);
        const menuId = exerciseMenuId("custom", exercise.id);
        const isCollapsed = collapsedExercises[collapseId];
        const isComplete = isCollapsed && isCustomExerciseComplete(exercise);

        return (
          <div className={`exercise-row custom-exercise-row warmup-exercise-row ${typed ? "typed-warmup-row" : ""} ${isCollapsed ? "collapsed" : ""} ${isComplete ? "exercise-complete" : ""}`} key={exercise.id}>
            <div className="exercise-info" onClick={() => onToggleCollapse(collapseId)} role="button" tabIndex={0}>
              <div>
                <strong>{exercise.name}</strong>
                <small>{exercise.trackWeights ? "Warm-up | Track weights" : "Warm-up | Completion only"}</small>
                <span className="collapsed-set-summary">{customSetSummary(exercise)}</span>
              </div>
              <div className="exercise-edit-wrap">
                <button className="icon-button exercise-edit-button" type="button" onClick={(event) => {
                  event.stopPropagation();
                  onToggleMenu(menuId);
                }} aria-label={`Edit ${exercise.name}`} title="Edit warm-up">
                  <PencilLine size={16} />
                </button>
                {openExerciseMenu === menuId && (
                  <div className="exercise-edit-menu">
                    <div className="exercise-edit-menu-header">
                      <strong>Change warm-up</strong>
                      <span>Replaces this warm-up for this session.</span>
                    </div>
                    <label>
                      New warm-up
                      <ExerciseAutocomplete value={exercise.name} onChange={(value) => updateCustomExerciseField(exercise.id, { name: value })} id={`warmup-edit-${exercise.id}`} placeholder="Mobility, drills, easy prep" />
                    </label>
                    <SimilarExerciseButtons exerciseName={exercise.name} onSelect={(value) => updateCustomExerciseField(exercise.id, { name: value })} />
                    <label className="checkbox-field">
                      <input
                        checked={exercise.trackWeights}
                        onChange={(event) => updateCustomExerciseField(exercise.id, { trackWeights: event.target.checked })}
                        type="checkbox"
                      />
                      Track weights used
                    </label>
                    <div className="exercise-edit-action-row">
                      <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomExercise(exercise.id)}>
                        Remove warm-up
                      </button>
                      <button className="quiet-button" type="button" onClick={saveExerciseEdit}>
                        <Save size={16} />
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {!isCollapsed && (
              <div className="set-list">
                {exercise.sets.map((set) => (
                  <label className={`set-row ${exercise.trackWeights ? "tracked-set-row" : "check-set-row"}`} key={set.id}>
                    <input
                      value={set.reps}
                      onChange={(event) => updateCustomSet(exercise.id, set.id, { reps: event.target.value })}
                      placeholder={typed ? "Prep" : "Reps"}
                    />
                    {exercise.trackWeights && (
                      <input
                        value={set.weight}
                        onChange={(event) => updateCustomSet(exercise.id, set.id, { weight: event.target.value })}
                        placeholder="Weight"
                      />
                    )}
                    <input
                      checked={set.done}
                      onChange={(event) => updateCustomSet(exercise.id, set.id, { done: event.target.checked })}
                      type="checkbox"
                    />
                  </label>
                ))}
                <div className="set-action-row">
                  <div className="set-action-group">
                    <button className="quiet-button" type="button" onClick={() => addCustomSet(exercise.id)}>
                      <Plus size={16} />
                      Add set
                    </button>
                    <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomSetOrExercise(exercise)}>
                      <Minus size={16} />
                      {exercise.sets.length <= 1 ? "Remove warm-up" : "Remove set"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
