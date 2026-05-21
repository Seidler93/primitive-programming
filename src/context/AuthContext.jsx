import React, { createContext, useContext, useEffect, useState } from "react";
import {
  ensureUserDocument,
  isTrainerUser,
  loadUserMaxes,
  loadUserPreferences,
  loadUserProfile,
  saveUserMaxes as saveCloudUserMaxes,
} from "../db";
import { logout, observeAuth } from "../services/firebase";
import { mergeUserProfile, saveUserDistanceUnit, saveUserMaxes as saveLocalUserMaxes, saveUserWeightUnit } from "../utils/appHelpers";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [isTrainer, setIsTrainer] = useState(false);

  async function hydrateUser(nextUser) {
    if (!nextUser) {
      setUser(null);
      setShowProfileSetup(false);
      setIsTrainer(false);
      return null;
    }

    const [profile, cloudMaxes, preferences, rootUser] = await Promise.all([
      loadUserProfile(nextUser.uid),
      loadUserMaxes(nextUser.uid),
      loadUserPreferences(nextUser.uid),
      ensureUserDocument(nextUser),
    ]);
    saveLocalUserMaxes(nextUser.uid, cloudMaxes);
    saveUserWeightUnit(nextUser.uid, preferences.weightUnit);
    saveUserDistanceUnit(nextUser.uid, preferences.distanceUnit);
    const profiledUser = mergeUserProfile(nextUser, { ...rootUser, ...profile, preferences });
    const nextTrainer = await isTrainerUser(profiledUser);
    setUser(profiledUser);
    setIsTrainer(nextTrainer);
    setShowProfileSetup(profile.profileSetupCompleted !== true);
    return { user: profiledUser, isTrainer: nextTrainer };
  }

  useEffect(() => observeAuth((nextUser) => {
    setChecking(true);
    setUser(mergeUserProfile(nextUser));
    hydrateUser(nextUser).finally(() => setChecking(false));
  }), []);

  function handleProfileSaved(profile) {
    setUser((currentUser) => ({ ...currentUser, ...profile }));
  }

  function handleProfileSetupComplete(profile) {
    setUser((currentUser) => ({ ...currentUser, ...profile }));
    setShowProfileSetup(false);
  }

  async function syncUserMaxes(userId, maxes) {
    if (!userId) return { synced: false };
    saveLocalUserMaxes(userId, maxes);
    const result = await saveCloudUserMaxes(userId, maxes);
    setUser((currentUser) => (
      currentUser?.uid === userId ? { ...currentUser, maxes } : currentUser
    ));
    return result;
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    setShowProfileSetup(false);
    setIsTrainer(false);
    setChecking(false);
  }

  const value = {
    checking,
    handleLogout,
    handleProfileSaved,
    handleProfileSetupComplete,
    hydrateUser,
    isTrainer,
    setUser,
    showProfileSetup,
    syncUserMaxes,
    user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
