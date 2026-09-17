import { Capacitor } from '@capacitor/core';

export const NATIVE_AUTH_REDIRECT = 'apex://auth-callback/';

export function getAuthRedirectUrl(): string {
  return Capacitor.isNativePlatform() ? NATIVE_AUTH_REDIRECT : window.location.origin;
}
