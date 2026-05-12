import React, { useState } from "react";
import { PencilLine, Plus, Save, UserRound } from "lucide-react";
import { maxFields } from "../../app/config";
import { saveUserProfile, uploadUserProfileImage } from "../../services/firebase";
import { dataUrlToBlob, imageFileToDataUrl, loadUserMaxes } from "../../utils/appHelpers";

export function ProfileAvatar({ user, iconSize = 34 }) {
  return (
    <span className="profile-avatar">
      {user.photoURL ? <img src={user.photoURL} alt="" /> : <UserRound size={iconSize} />}
    </span>
  );
}

export function ProfilePage({ user, isTrainer, logs, onOpenEdit }) {
  const maxes = loadUserMaxes(user.uid);
  const completedCount = Object.values(logs).filter((log) => log.completed).length;
  const lastUpdated = Object.values(logs)
    .map((log) => log.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <section className="profile-panel">
      <div className="profile-header">
        <ProfileAvatar user={user} />
        <div>
          <p className="eyebrow">{isTrainer ? "Coach profile" : "Athlete profile"}</p>
          <h2>{user.displayName || user.email || "Profile"}</h2>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-block">
          <h3>Account</h3>
          <dl className="profile-list">
            <div>
              <dt>Email</dt>
              <dd>{user.email || "No email on file"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{isTrainer ? "Coach" : "Athlete"}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd>{user.uid}</dd>
            </div>
          </dl>
        </div>

        <div className="profile-block">
          <h3>Training</h3>
          <dl className="profile-list">
            <div>
              <dt>Completed workouts</dt>
              <dd>{completedCount}</dd>
            </div>
            <div>
              <dt>Workout records</dt>
              <dd>{Object.keys(logs).length}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{lastUpdated ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(lastUpdated)) : "No workouts yet"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="profile-block">
        <h3>Saved Maxes</h3>
        <div className="profile-max-grid">
          {maxFields.map((field) => {
            const max = maxes[field.key];
            const value = max?.value ?? max ?? "";
            const unit = max?.unit || "";
            return (
              <div className="profile-max" key={field.key}>
                <span>{field.label}</span>
                <strong>{value ? `${value}${unit}` : "-"}</strong>
              </div>
            );
          })}
        </div>
      </div>

      <div className="profile-actions profile-actions-bottom">
        <button className="primary" type="button" onClick={onOpenEdit}>
          <PencilLine size={18} />
          Edit
        </button>
      </div>
    </section>
  );
}

export function ProfileEditPage({ user, onProfileSaved }) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [email, setEmail] = useState(user.email || "");
  const [profileImage, setProfileImage] = useState(user.photoURL || "");
  const [profileMessage, setProfileMessage] = useState("");
  const [imageMessage, setImageMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [imageError, setImageError] = useState("");

  async function handlePictureUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError("");
    setImageMessage("");
    setUploadingImage(true);
    try {
      const fallbackDataUrl = await imageFileToDataUrl(file);
      setProfileImage(fallbackDataUrl);
      const uploadFile = dataUrlToBlob(fallbackDataUrl);
      const uploadedUrl = await uploadUserProfileImage(user.uid, uploadFile, fallbackDataUrl);
      const savedProfile = await saveUserProfile(user.uid, { photoURL: uploadedUrl });
      setProfileImage(uploadedUrl);
      onProfileSaved(savedProfile);
      setImageMessage("Profile picture saved.");
    } catch {
      setImageError("Could not upload that picture.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function persistProfile(event) {
    event.preventDefault();
    setSaving(true);
    setProfileMessage("Profile saved. Syncing...");
    setProfileError("");
    const profile = {
      displayName: displayName.trim(),
      email: email.trim(),
    };
    onProfileSaved(profile);
    try {
      const savedProfile = await saveUserProfile(user.uid, profile);
      onProfileSaved(savedProfile);
      setProfileMessage("Profile saved.");
    } catch {
      setProfileError("Profile saved on this device. Cloud sync will need another try.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="profile-panel settings-panel">
      <div className="profile-header">
        <ProfileAvatar user={{ ...user, photoURL: profileImage }} />
        <div>
          <p className="eyebrow">Profile details</p>
          <h2>Edit profile</h2>
        </div>
      </div>

      <form className="profile-edit-form" onSubmit={persistProfile}>
        <label>
          Name
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" />
        </label>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" />
        </label>
        <div className="wide profile-upload-field">
          <span>Profile picture</span>
          <label className={uploadingImage || saving ? "upload-picture-button disabled" : "upload-picture-button"}>
            <Plus size={18} />
            {uploadingImage ? "Uploading..." : profileImage ? "Change photo" : "Upload photo"}
            <input type="file" accept="image/*" onChange={handlePictureUpload} disabled={uploadingImage || saving} />
          </label>
        </div>
        <button className="primary" type="submit" disabled={saving || uploadingImage}>
          <Save size={18} />
          {uploadingImage ? "Uploading..." : saving ? "Saving..." : "Save profile"}
        </button>
        {profileMessage && <p className="save-status">{profileMessage}</p>}
        {imageMessage && <p className="save-status">{imageMessage}</p>}
        {profileError && <p className="form-error">{profileError}</p>}
        {imageError && <p className="form-error">{imageError}</p>}
      </form>
    </section>
  );
}

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
