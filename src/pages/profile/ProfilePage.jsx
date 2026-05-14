import React, { useState } from "react";
import { PencilLine, Plus, Save, UserRound } from "lucide-react";
import { maxFields } from "../../app/config";
import { saveUserProfile } from "../../db";
import { uploadUserProfileImage } from "../../services/firebase";
import {
  dataUrlToBlob,
  imageFileToDataUrl,
  loadUserMaxes,
} from "../../utils/appHelpers";

export function ProfileAvatar({ user, iconSize = 34 }) {
  return (
    <span className="profile-avatar">
      {user.photoURL ? <img src={user.photoURL} alt="" /> : <UserRound size={iconSize} />}
    </span>
  );
}

export function ProfilePage({ user, isTrainer, workouts, onOpenEdit }) {
  const maxes = loadUserMaxes(user.uid);
  const completedCount = Object.values(workouts).filter((workout) => workout.completed).length;
  const lastUpdated = Object.values(workouts)
    .map((workout) => workout.updatedAt)
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

      <div className="profile-block">
        <h3>Training</h3>
        <dl className="profile-list">
          <div>
            <dt>Completed workouts</dt>
            <dd>{completedCount}</dd>
          </div>
          <div>
            <dt>Workout records</dt>
            <dd>{Object.keys(workouts).length}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{lastUpdated ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(lastUpdated)) : "No workouts yet"}</dd>
          </div>
        </dl>
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
