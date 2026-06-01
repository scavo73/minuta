import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "minuta_auth_token";
const PROFILE_KEY = "minuta_auth_profile";

export type UserProfile = {
  id?: string;
  name?: string;
  email?: string;
  createdAt?: string;
  syncStatus?: string;
};

export function saveToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function deleteToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const storedProfile = await SecureStore.getItemAsync(PROFILE_KEY);

  if (!storedProfile) return null;

  try {
    return JSON.parse(storedProfile) as UserProfile;
  } catch {
    return null;
  }
}

export async function updateUserProfile(
  updates: Partial<UserProfile>,
): Promise<UserProfile> {
  const currentProfile = await getUserProfile();
  const nextProfile = {
    ...(currentProfile ?? {}),
    ...updates,
  };

  await saveUserProfile(nextProfile);

  return nextProfile;
}

export function deleteUserProfile(): Promise<void> {
  return SecureStore.deleteItemAsync(PROFILE_KEY);
}

export async function saveAuthSession(
  token: string,
  profile: UserProfile,
): Promise<void> {
  await Promise.all([saveToken(token), saveUserProfile(profile)]);
}

export async function clearAuthSession(): Promise<void> {
  await Promise.all([deleteToken(), deleteUserProfile()]);
}
