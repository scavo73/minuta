import type { AuthResponse } from "./api";
import { saveAuthSession, type UserProfile } from "./authStorage";

export function getAuthToken(response: AuthResponse) {
  return response.token ?? response.accessToken ?? null;
}

export function getProfileFromAuthResponse(
  response: AuthResponse,
  fallbackEmail: string,
): UserProfile {
  return {
    id: response.user?.id,
    name: response.user?.name,
    email: response.user?.email ?? fallbackEmail,
    createdAt: response.user?.createdAt ?? response.user?.created_at,
    syncStatus: "Sesión iniciada",
  };
}

export async function saveSessionFromAuthResponse(
  token: string,
  response: AuthResponse,
  fallbackEmail: string,
) {
  await saveAuthSession(
    token,
    getProfileFromAuthResponse(response, fallbackEmail),
  );
}
