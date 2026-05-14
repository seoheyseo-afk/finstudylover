import type { AuthSession } from "./idb";
import type { StudyData } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

type SupabaseUser = {
  id: string;
  email?: string;
};

type SupabaseAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: SupabaseUser;
};

type StudyDataRow = {
  data: StudyData;
  updated_at: string;
};

function requireConfig() {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  return { supabaseUrl, supabaseAnonKey };
}

function authHeaders(accessToken?: string) {
  const config = requireConfig();
  return {
    apikey: config.supabaseAnonKey,
    authorization: `Bearer ${accessToken || config.supabaseAnonKey}`,
    "content-type": "application/json",
  };
}

function createSession(response: SupabaseAuthResponse): AuthSession {
  if (!response.access_token || !response.refresh_token || !response.user?.id) {
    throw new Error("로그인 응답이 올바르지 않습니다.");
  }

  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresAt: Date.now() + (response.expires_in || 3600) * 1000,
    user: {
      id: response.user.id,
      email: response.user.email,
    },
  };
}

async function requestAuth(path: string, body: Record<string, unknown>) {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/auth/v1/${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Supabase 인증 요청에 실패했습니다.");
  }

  return response.json() as Promise<SupabaseAuthResponse>;
}

export async function signInWithPassword(email: string, password: string) {
  const response = await requestAuth("token?grant_type=password", { email, password });
  return createSession(response);
}

export async function signUpWithPassword(email: string, password: string) {
  const response = await requestAuth("signup", { email, password });
  if (!response.access_token) return null;
  return createSession(response);
}

export async function refreshAuthSession(session: AuthSession) {
  if (session.expiresAt - Date.now() > 60_000) return session;
  const response = await requestAuth("token?grant_type=refresh_token", { refresh_token: session.refreshToken });
  return createSession(response);
}

export async function loadCloudStudyData(session: AuthSession): Promise<StudyDataRow | null> {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/study_data?select=data,updated_at&user_id=eq.${session.user.id}&limit=1`,
    {
      headers: authHeaders(session.accessToken),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "공부 데이터를 불러오지 못했습니다.");
  }

  const rows = (await response.json()) as StudyDataRow[];
  return rows[0] || null;
}

export async function saveCloudStudyData(session: AuthSession, data: StudyData) {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/study_data?on_conflict=user_id`, {
    method: "POST",
    headers: {
      ...authHeaders(session.accessToken),
      prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      user_id: session.user.id,
      data,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "공부 데이터를 저장하지 못했습니다.");
  }
}
