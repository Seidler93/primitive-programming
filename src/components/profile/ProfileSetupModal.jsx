import React, { useState } from "react";
import { saveUserProfile } from "../../services/firebase";
import {
  loadBodyMetrics,
  loadUserWeightUnit,
  saveBodyMetrics,
  saveUserWeightUnit,
} from "../../utils/appHelpers";

export function ProfileSetupModal({ user, onComplete }) {
  const initialUnit = loadUserWeightUnit(user.uid);
  const initialHeight = String(user.height || "");
  const initialHeightInches = user.heightUnit === "in" ? Number(initialHeight) || 0 : 0;
  const [measurementSystem, setMeasurementSystem] = useState(initialUnit === "lb" ? "imperial" : "metric");
  const [gender, setGender] = useState(user.gender || "");
  const [heightCm, setHeightCm] = useState(user.heightUnit === "cm" ? initialHeight : "");
  const [heightFeet, setHeightFeet] = useState(user.heightFeet || (initialHeightInches ? String(Math.floor(initialHeightInches / 12)) : ""));
  const [heightInches, setHeightInches] = useState(user.heightInches || (initialHeightInches ? String(initialHeightInches % 12) : ""));
  const [weight, setWeight] = useState(user.bodyweight || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const heightUnit = measurementSystem === "imperial" ? "in" : "cm";
  const weightUnit = measurementSystem === "imperial" ? "lb" : "kg";

  async function finishSetup(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const imperialHeightEntered = heightFeet.trim() || heightInches.trim();
    const heightValue = measurementSystem === "imperial"
      ? imperialHeightEntered
        ? String((Number(heightFeet) || 0) * 12 + (Number(heightInches) || 0))
        : ""
      : heightCm.trim();
    const profile = {
      profileSetupCompleted: true,
      profileSetupCompletedAt: new Date().toISOString(),
      measurementSystem,
      gender,
      height: heightValue,
      heightUnit,
      heightFeet: measurementSystem === "imperial" ? heightFeet.trim() : "",
      heightInches: measurementSystem === "imperial" ? heightInches.trim() : "",
      bodyweight: weight.trim(),
      bodyweightUnit: weightUnit,
    };
    try {
      saveUserWeightUnit(user.uid, weightUnit);
      if (weight.trim()) {
        const entries = loadBodyMetrics(user.uid);
        saveBodyMetrics(user.uid, [
          ...entries,
          {
            id: `setup-${Date.now()}`,
            date: new Date().toISOString(),
            bodyweight: Number(weight) || "",
            bodyFat: "",
            muscleMass: "",
          },
        ]);
      }
      const savedProfile = await saveUserProfile(user.uid, profile);
      onComplete(savedProfile);
    } catch {
      setError("Could not save setup details.");
      setSaving(false);
    }
  }

  async function skipSetup() {
    setSaving(true);
    setError("");
    try {
      const savedProfile = await saveUserProfile(user.uid, {
        profileSetupCompleted: true,
        profileSetupSkippedAt: new Date().toISOString(),
      });
      onComplete(savedProfile);
    } catch {
      setError("Could not skip setup right now.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel setup-modal-panel" role="dialog" aria-modal="true" aria-labelledby="profile-setup-title">
        <div>
          <p className="eyebrow">Profile setup</p>
          <h2 id="profile-setup-title">Finish setting up your profile</h2>
        </div>
        <form className="modal-form setup-form" onSubmit={finishSetup}>
          <label>
            Metric preference
            <select value={measurementSystem} onChange={(event) => setMeasurementSystem(event.target.value)}>
              <option value="metric">Metric (kg, cm)</option>
              <option value="imperial">Imperial (lb, in)</option>
            </select>
          </label>
          <label>
            Gender
            <select value={gender} onChange={(event) => setGender(event.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="nonbinary">Non-binary</option>
              <option value="self-described">Self-described</option>
            </select>
          </label>
          <label>
            Height
            {measurementSystem === "imperial" ? (
              <div className="height-imperial-inputs">
                <span className="unit-input">
                  <input value={heightFeet} onChange={(event) => setHeightFeet(event.target.value)} inputMode="numeric" placeholder="5" aria-label="Height feet" />
                  <small>ft</small>
                </span>
                <span className="unit-input">
                  <input value={heightInches} onChange={(event) => setHeightInches(event.target.value)} inputMode="decimal" placeholder="10" aria-label="Height inches" />
                  <small>in</small>
                </span>
              </div>
            ) : (
              <input value={heightCm} onChange={(event) => setHeightCm(event.target.value)} inputMode="decimal" placeholder={heightUnit} />
            )}
          </label>
          <label>
            Weight
            <input value={weight} onChange={(event) => setWeight(event.target.value)} inputMode="decimal" placeholder={weightUnit} />
          </label>
          <button className="primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save preferences"}
          </button>
          <button className="text-button setup-skip-button" type="button" onClick={skipSetup} disabled={saving}>
            Skip for now
          </button>
          {error && <p className="form-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
