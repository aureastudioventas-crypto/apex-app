import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { supabase } from './cloudSync';
import { NATIVE_AUTH_REDIRECT } from './authRedirect';

export async function handleNativeAuthUrl(url: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !url.startsWith(NATIVE_AUTH_REDIRECT)) return false;
  const parsed = new URL(url);
  const error = parsed.searchParams.get('error_description') || parsed.searchParams.get('error');
  if (error) throw new Error(decodeURIComponent(error));
  const code = parsed.searchParams.get('code');
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return true;
  }
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (sessionError) throw sessionError;
    return true;
  }
  return false;
}

export async function installNativeAuthListener(onAuthenticated?: () => void): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) return () => undefined;
  const handle = async (url: string) => {
    try {
      if (await handleNativeAuthUrl(url)) onAuthenticated?.();
    } catch (error) {
      console.error('APEX native auth callback failed', error);
    }
  };
  const listener = await App.addListener('appUrlOpen', ({ url }) => { void handle(url); });
  const launch = await App.getLaunchUrl();
  if (launch?.url) await handle(launch.url);
  return () => { void listener.remove(); };
}
