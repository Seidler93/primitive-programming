import { exerciseSuggestions, similarExercises } from "../../data/exerciseLibrary";

function normalizeExerciseSuggestion(value) {
  return value.includes(" - ") ? value.split(" - ").at(-1) : value;
}

export function ExerciseAutocomplete({ value, onChange, placeholder, id }) {
  return (
    <>
      <input
        value={value}
        onChange={(event) => onChange(normalizeExerciseSuggestion(event.target.value))}
        list={id}
        placeholder={placeholder}
      />
      <datalist id={id}>
        {exerciseSuggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </>
  );
}

export function SimilarExerciseButtons({ exerciseName, onSelect }) {
  const suggestions = similarExercises(exerciseName, 5);
  if (!suggestions.length) return null;

  return (
    <div className="similar-exercise-list">
      {suggestions.map((name) => (
        <button className="similar-exercise-button" type="button" key={name} onClick={() => onSelect(name)}>
          {name}
        </button>
      ))}
    </div>
  );
}
