import React, { useState } from "react";
import { ArrowLeft, Bell, ChevronRight, LogOut, PencilLine, Plus, Save, Settings } from "lucide-react";
import { appVersion, bodyMetricFields, defaultBodyMetricSettings, settingsSections } from "../../app/config";
import { saveUserProfile } from "../../db";
import { requestNotificationAccess } from "../../services/firebase";
import { loadBodyMetricSettings, loadUserDistanceUnit, loadUserWeightUnit, saveBodyMetricSettings, saveUserDistanceUnit, saveUserWeightUnit } from "../../utils/appHelpers";

export function SettingsPage({ onOpenSection }) {
  const [showRedeemCode, setShowRedeemCode] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemMessage, setRedeemMessage] = useState("");

  function redeemAccessCode(event) {
    event.preventDefault();
    const code = redeemCode.trim();
    if (!code) return;
    setRedeemMessage("Code redemption will be available soon.");
  }

  return (
    <section className="profile-panel settings-panel">
      <div className="profile-header">
        <span className="profile-avatar">
          <Settings size={34} />
        </span>
        <div>
          <p className="eyebrow">Profile settings</p>
          <h2>Settings</h2>
        </div>
      </div>

      <div className="settings-option-list" aria-label="Settings options">
        {settingsSections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <button className="settings-option" type="button" key={section.id} onClick={() => onOpenSection(section.id)}>
              <span className="settings-option-icon">
                <SectionIcon size={19} />
              </span>
              <span>
                <strong>{section.title}</strong>
                <small>{section.eyebrow}</small>
              </span>
              <ChevronRight size={18} />
            </button>
          );
        })}
      </div>

      <button className="secondary redeem-code-button" type="button" onClick={() => {
        setRedeemMessage("");
        setShowRedeemCode(true);
      }}>
        <Plus size={18} />
        Redeem code
      </button>

      <p className="app-version">Version {appVersion}</p>

      {showRedeemCode && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal-panel modal-form" role="dialog" aria-modal="true" aria-labelledby="redeem-code-title" onSubmit={redeemAccessCode}>
            <div>
              <p className="eyebrow">Program access</p>
              <h2 id="redeem-code-title">Redeem code</h2>
            </div>
            <label>
              Access code
              <input value={redeemCode} onChange={(event) => {
                setRedeemCode(event.target.value.toUpperCase());
                setRedeemMessage("");
              }} placeholder="ENTER CODE" autoCapitalize="characters" />
            </label>
            <div className="modal-action-row">
              <button className="secondary" type="button" onClick={() => setShowRedeemCode(false)}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={!redeemCode.trim()}>
                Redeem
              </button>
            </div>
            {redeemMessage && <p className="save-status">{redeemMessage}</p>}
          </form>
        </div>
      )}
    </section>
  );
}

export function SettingsSectionPage({ section, user, isTrainer, serviceWorkerRegistration, updateRegistration, onApplyUpdate, onLogout, onBack, onProfileSaved }) {
  const [bodyMetricSettings, setBodyMetricSettings] = useState(() => loadBodyMetricSettings(user.uid));
  const [weightUnit, setWeightUnit] = useState(() => loadUserWeightUnit(user.uid));
  const [distanceUnit, setDistanceUnit] = useState(() => loadUserDistanceUnit(user.uid));
  const [preferencesEditing, setPreferencesEditing] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesSaved, setPreferencesSaved] = useState(false);
  const [preferenceDraft, setPreferenceDraft] = useState(() => ({
    weightUnit: loadUserWeightUnit(user.uid),
    distanceUnit: loadUserDistanceUnit(user.uid),
  }));
  const [measurementSystem, setMeasurementSystem] = useState(user.measurementSystem || (loadUserWeightUnit(user.uid) === "lb" ? "imperial" : "metric"));
  const initialHeight = String(user.height || "");
  const initialHeightInches = user.heightUnit === "in" ? Number(initialHeight) || 0 : 0;
  const [heightCm, setHeightCm] = useState(user.heightUnit === "cm" ? initialHeight : "");
  const [heightFeet, setHeightFeet] = useState(user.heightFeet || (initialHeightInches ? String(Math.floor(initialHeightInches / 12)) : ""));
  const [heightInches, setHeightInches] = useState(user.heightInches || (initialHeightInches ? String(initialHeightInches % 12) : ""));
  const [bodyweight, setBodyweight] = useState(user.bodyweight || "");
  const [gender, setGender] = useState(user.gender || "");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [notificationState, setNotificationState] = useState(() => {
    if (!("Notification" in window)) return { status: "unsupported", message: "This browser does not support notifications." };
    return { status: Notification.permission, message: Notification.permission === "granted" ? "Notifications are allowed on this device." : "Notifications are off on this device." };
  });
  const [savingNotifications, setSavingNotifications] = useState(false);
  const releaseNotes = [
    {
      title: "PWA install and updates",
      body: "Added the app manifest, icon, service worker registration, offline shell caching, and an update prompt when a new version is ready.",
    },
    {
      title: "Push notification foundation",
      body: "Added Firebase Cloud Messaging setup for foreground messages, background notifications, locked-phone delivery, notification click handling, and device token saving.",
    },
    {
      title: "Settings improvements",
      body: "Added notification controls, program history, app version visibility, and this release breakdown in one place.",
    },
    {
      title: "Coach and workout flow",
      body: "Kept the recent coach program tools, athlete progress views, profile updates, and workout logging refinements in the live build.",
    },
  ];

  async function enableNotifications() {
    setSavingNotifications(true);
    try {
      const result = await requestNotificationAccess(user.uid, serviceWorkerRegistration);
      setNotificationState(result);
    } catch (error) {
      setNotificationState({ status: "error", message: error.message || "Could not enable notifications." });
    } finally {
      setSavingNotifications(false);
    }
  }

  function updateBodyMetricSetting(key, patch) {
    const nextSettings = {
      ...bodyMetricSettings,
      [key]: { ...bodyMetricSettings[key], ...patch },
    };
    setBodyMetricSettings(nextSettings);
    saveBodyMetricSettings(user.uid, nextSettings);
  }

  function beginPreferenceEdit() {
    setPreferenceDraft({ weightUnit, distanceUnit });
    setPreferencesSaved(false);
    setPreferencesEditing(true);
  }

  async function savePreferences(event) {
    event.preventDefault();
    setPreferencesSaving(true);
    setPreferencesSaved(false);
    try {
      saveUserWeightUnit(user.uid, preferenceDraft.weightUnit);
      saveUserDistanceUnit(user.uid, preferenceDraft.distanceUnit);
      setWeightUnit(preferenceDraft.weightUnit);
      setDistanceUnit(preferenceDraft.distanceUnit);
      setPreferencesEditing(false);
      setPreferencesSaved(true);
    } finally {
      setPreferencesSaving(false);
    }
  }

  async function savePhysicalProfile(event) {
    event.preventDefault();
    setProfileSaving(true);
    setProfileSaved(false);
    setProfileError("");
    const nextWeightUnit = measurementSystem === "imperial" ? "lb" : "kg";
    const nextHeightUnit = measurementSystem === "imperial" ? "in" : "cm";
    const imperialHeightEntered = heightFeet.trim() || heightInches.trim();
    const heightValue = measurementSystem === "imperial"
      ? imperialHeightEntered
        ? String((Number(heightFeet) || 0) * 12 + (Number(heightInches) || 0))
        : ""
      : heightCm.trim();
    const profile = {
      profileSetupCompleted: true,
      measurementSystem,
      gender,
      height: heightValue,
      heightUnit: nextHeightUnit,
      heightFeet: measurementSystem === "imperial" ? heightFeet.trim() : "",
      heightInches: measurementSystem === "imperial" ? heightInches.trim() : "",
      bodyweight: bodyweight.trim(),
      bodyweightUnit: nextWeightUnit,
    };
    try {
      saveUserWeightUnit(user.uid, nextWeightUnit);
      setWeightUnit(nextWeightUnit);
      if (bodyweight.trim()) {
        const entries = loadBodyMetrics(user.uid);
        saveBodyMetrics(user.uid, [
          ...entries,
          {
            id: `profile-${Date.now()}`,
            date: new Date().toISOString(),
            bodyweight: Number(bodyweight) || "",
            bodyFat: "",
            muscleMass: "",
          },
        ]);
      }
      const savedProfile = await saveUserProfile(user.uid, profile);
      onProfileSaved?.(savedProfile);
      setProfileSaved(true);
    } catch {
      setProfileError("Could not save profile settings.");
    } finally {
      setProfileSaving(false);
    }
  }

  const sectionConfig = settingsSections.find((item) => item.id === section) || settingsSections[0];
  const SectionIcon = sectionConfig.icon;

  return (
    <section className="profile-panel settings-panel">
      <div className="profile-header">
        <span className="profile-avatar">
          <SectionIcon size={34} />
        </span>
        <div>
          <p className="eyebrow">Settings</p>
          <h2>{sectionConfig.title}</h2>
        </div>
      </div>

      <button className="text-button settings-section-back" type="button" onClick={onBack}>
        <ArrowLeft size={17} />
        Settings
      </button>

      {section === "preferences" ? (
        <div className="settings-preferences">
          <div className="settings-block preference-settings-row">
            <div>
              <p className="eyebrow">Device</p>
              <h3>Notifications</h3>
              <p>{notificationState.message}</p>
            </div>
            <button className="secondary" type="button" onClick={enableNotifications} disabled={savingNotifications || notificationState.status === "granted"}>
              <Bell size={18} />
              {savingNotifications ? "Enabling..." : notificationState.status === "granted" ? "Enabled" : "Enable notifications"}
            </button>
          </div>
          <form className="settings-preference-form" onSubmit={savePreferences}>
            <div className="settings-block preference-settings-row">
              <div>
                <p className="eyebrow">Weight unit</p>
                <h3>Training weights</h3>
                <p>Used for maxes, goals, workout loads, and bodyweight metrics.</p>
              </div>
              {preferencesEditing ? (
                <select
                  value={preferenceDraft.weightUnit}
                  onChange={(event) => setPreferenceDraft((current) => ({ ...current, weightUnit: event.target.value }))}
                  aria-label="Weight unit"
                >
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              ) : (
                <strong className="preference-value">{weightUnit}</strong>
              )}
            </div>
            <div className="settings-block preference-settings-row">
              <div>
                <p className="eyebrow">Distance unit</p>
                <h3>Running and conditioning</h3>
                <p>Used anywhere distance-based work is shown or logged.</p>
              </div>
              {preferencesEditing ? (
                <select
                  value={preferenceDraft.distanceUnit}
                  onChange={(event) => setPreferenceDraft((current) => ({ ...current, distanceUnit: event.target.value }))}
                  aria-label="Distance unit"
                >
                  <option value="km">km</option>
                  <option value="mi">mi</option>
                </select>
              ) : (
                <strong className="preference-value">{distanceUnit}</strong>
              )}
            </div>
            <div className="preference-action-row">
              {preferencesEditing ? (
                <>
                  <button className="text-button" type="button" onClick={() => {
                    setPreferenceDraft({ weightUnit, distanceUnit });
                    setPreferencesEditing(false);
                  }}>
                    Cancel
                  </button>
                  <button className="primary" type="submit" disabled={preferencesSaving}>
                    <Save size={18} />
                    {preferencesSaving ? "Saving..." : "Save preferences"}
                  </button>
                </>
              ) : (
                <button className="secondary" type="button" onClick={beginPreferenceEdit}>
                  <PencilLine size={18} />
                  Edit preferences
                </button>
              )}
            </div>
            {preferencesSaved && <p className="save-status">Preferences saved.</p>}
          </form>
        </div>
      ) : section === "metrics" ? (
        <div className="settings-metrics">
          {bodyMetricFields.map((field) => {
            const setting = bodyMetricSettings[field.key] || defaultBodyMetricSettings[field.key];
            return (
              <div className="settings-block metric-settings-row" key={field.key}>
                <label className="checkbox-field">
                  <input
                    checked={setting.enabled}
                    onChange={(event) => updateBodyMetricSetting(field.key, { enabled: event.target.checked })}
                    type="checkbox"
                  />
                  {field.label}
                </label>
                <select
                  value={setting.mode}
                  onChange={(event) => updateBodyMetricSetting(field.key, { mode: event.target.value })}
                  aria-label={`${field.label} display mode`}
                  disabled={!setting.enabled}
                >
                  <option value="static">Static value</option>
                  <option value="goal">Compare to goal</option>
                </select>
              </div>
            );
          })}
        </div>
      ) : section === "updates" ? (
        <div className="settings-updates">
          <div className="whats-new-card">
            <div>
              <p className="eyebrow">Version {appVersion}</p>
              <h3>What's new</h3>
            </div>
            <div className="release-note-list">
              {releaseNotes.map((note) => (
                <article className="release-note" key={note.title}>
                  <strong>{note.title}</strong>
                  <p>{note.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="settings-actions">
          <div className="profile-block">
            <h3>Account info</h3>
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
          <form className="profile-settings-form" onSubmit={savePhysicalProfile}>
            <div className="settings-block-heading">
              <p className="eyebrow">Profile</p>
              <h3>Body details</h3>
              <p>Height and weight used for goals and body metrics.</p>
            </div>
            <label>
              Gender
              <select value={gender} onChange={(event) => setGender(event.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
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
                <input value={heightCm} onChange={(event) => setHeightCm(event.target.value)} inputMode="decimal" placeholder="cm" />
              )}
            </label>
            <label>
              Weight
              <input value={bodyweight} onChange={(event) => setBodyweight(event.target.value)} inputMode="decimal" placeholder={measurementSystem === "imperial" ? "lb" : "kg"} />
            </label>
            <button className="primary" type="submit" disabled={profileSaving}>
              <Save size={18} />
              {profileSaving ? "Saving..." : "Save preferences"}
            </button>
            {profileSaved && <p className="save-status">Profile settings saved.</p>}
            {profileError && <p className="form-error">{profileError}</p>}
          </form>
          {updateRegistration && (
            <div className="settings-block">
              <div>
                <p className="eyebrow">App update</p>
                <h3>New version ready</h3>
                <p>Restart the app to load the newest installed version.</p>
              </div>
              <button className="primary" type="button" onClick={onApplyUpdate}>
                Update now
              </button>
            </div>
          )}
          <button className="secondary" type="button" onClick={onLogout}>
            <LogOut size={18} />
            Log out
          </button>
        </div>
      )}

      <p className="app-version">Version {appVersion}</p>
    </section>
  );
}
