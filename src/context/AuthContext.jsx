import React, { createContext, useContext, useEffect, useState } from "react";
import {
  ensureUserDocument,
  isTrainerUser,
  loadUserMaxes as loadCloudUserMaxes,
  loadUserProfile,
  logout,
  observeAuth,
  saveUserMaxes as saveCloudUserMaxes,
} from "../services/firebase";
import { mergeUserProfile, saveUserMaxes } from "../utils/appHelpers";

const AuthContext = createContext(null);

export async function syncUserMaxes(userId, maxes) {
  saveUserMaxes(userId, maxes);
  return saveCloudUserMaxes(userId, maxes);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isTrainer, setIsTrainer] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  async function hydrateUser(nextUser) {
    if (!nextUser) {
      setUser(null);
      setShowProfileSetup(false);
      setIsTrainer(false);
      return null;
    }

    const [profile, cloudMaxes, rootUser] = await Promise.all([
      loadUserProfile(nextUser.uid),
      loadCloudUserMaxes(nextUser.uid),
      ensureUserDocument(nextUser),
    ]);
    saveUserMaxes(nextUser.uid, cloudMaxes);
    const profiledUser = mergeUserProfile(nextUser, { ...rootUser, ...profile });
    const nextTrainer = await isTrainerUser(nextUser);
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
