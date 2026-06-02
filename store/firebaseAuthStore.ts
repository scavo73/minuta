import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as signOutFirebase,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";
import { create } from "zustand";

import { clearAuthSession } from "../lib/authStorage";
import { firebaseAuth, firestore } from "../lib/firebase";

export type FirebaseUserProfile = {
  uid: string;
  email: string;
  name?: string;
  bio: string;
  avatarUrl: string | null;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
};

type FirebaseAuthStore = {
  currentUser: User | null;
  profile: FirebaseUserProfile | null;
  isLoading: boolean;
  error: string | null;
  hydrateFirebaseAuth: () => void;
  loadUserProfile: (uid: string) => Promise<FirebaseUserProfile | null>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (
    updates: Partial<Pick<FirebaseUserProfile, "name" | "bio" | "avatarUrl">>,
  ) => Promise<FirebaseUserProfile | null>;
};

let unsubscribeAuth: (() => void) | null = null;

function getFirebaseErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "No se pudo completar la operación.";
}

function getUserProfileRef(uid: string) {
  return doc(firestore, "users", uid);
}

export const useFirebaseAuthStore = create<FirebaseAuthStore>((set, get) => ({
  currentUser: null,
  profile: null,
  isLoading: true,
  error: null,

  hydrateFirebaseAuth: () => {
    if (unsubscribeAuth) return;

    set({ isLoading: true });

    unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        set({
          currentUser: null,
          profile: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      set({
        currentUser: user,
        isLoading: true,
        error: null,
      });

      await get().loadUserProfile(user.uid);
    });
  },

  loadUserProfile: async (uid) => {
    try {
      const profileSnapshot = await getDoc(getUserProfileRef(uid));

      if (!profileSnapshot.exists()) {
        set({
          profile: null,
          isLoading: false,
          error: null,
        });
        return null;
      }

      const profile = profileSnapshot.data() as FirebaseUserProfile;

      set({
        profile,
        isLoading: false,
        error: null,
      });

      return profile;
    } catch (error) {
      set({
        isLoading: false,
        error: getFirebaseErrorMessage(error),
      });
      return null;
    }
  },

  signInWithEmail: async (email, password) => {
    try {
      set({ isLoading: true, error: null });

      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      );

      await clearAuthSession();

      set({
        currentUser: credential.user,
      });

      await get().loadUserProfile(credential.user.uid);
    } catch (error) {
      set({
        isLoading: false,
        error: getFirebaseErrorMessage(error),
      });
      throw error;
    }
  },

  signUpWithEmail: async (email, password, name) => {
    try {
      set({ isLoading: true, error: null });

      const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      );
      const safeName =
        typeof name === "string" && name.trim().length > 0
          ? name.trim()
          : email.split("@")[0];

      await updateProfile(credential.user, {
        displayName: safeName,
      });

      const profile: FirebaseUserProfile = {
        uid: credential.user.uid,
        email: credential.user.email ?? email,
        name: safeName,
        bio: "",
        avatarUrl: null,
        createdAt: null,
        updatedAt: null,
      };

      await setDoc(getUserProfileRef(credential.user.uid), {
        uid: credential.user.uid,
        email: credential.user.email ?? email,
        name: safeName,
        bio: "",
        avatarUrl: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await clearAuthSession();

      set({
        currentUser: credential.user,
        profile,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getFirebaseErrorMessage(error),
      });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });

      await signOutFirebase(firebaseAuth);
      await clearAuthSession();

      set({
        currentUser: null,
        profile: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getFirebaseErrorMessage(error),
      });
      throw error;
    }
  },

  updateUserProfile: async (updates) => {
    const user = get().currentUser;

    if (!user) return null;

    try {
      set({ isLoading: true, error: null });

      const currentProfile = get().profile;
      const updatePayload: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };
      const nextName =
        updates.name !== undefined ? updates.name.trim() : currentProfile?.name;
      const nextProfile: FirebaseUserProfile = {
        uid: user.uid,
        email: currentProfile?.email ?? user.email ?? "",
        name: nextName,
        bio: updates.bio ?? currentProfile?.bio ?? "",
        avatarUrl:
          updates.avatarUrl === undefined
            ? currentProfile?.avatarUrl ?? null
            : updates.avatarUrl,
        createdAt: currentProfile?.createdAt ?? null,
        updatedAt: null,
      };

      if (updates.name !== undefined) {
        updatePayload.name = updates.name.trim();
      }

      if (updates.bio !== undefined) {
        updatePayload.bio = updates.bio;
      }

      if (updates.avatarUrl !== undefined) {
        updatePayload.avatarUrl = updates.avatarUrl;
      }

      await setDoc(getUserProfileRef(user.uid), updatePayload, { merge: true });

      if (updates.name !== undefined) {
        await updateProfile(user, {
          displayName: updates.name.trim(),
        });
      }

      set({
        profile: nextProfile,
        isLoading: false,
        error: null,
      });

      return nextProfile;
    } catch (error) {
      set({
        isLoading: false,
        error: getFirebaseErrorMessage(error),
      });
      throw error;
    }
  },
}));
