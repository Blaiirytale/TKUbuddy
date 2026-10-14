import * as SecureStore from 'expo-secure-store';

// One place that knows the server address and the login token.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'auth_token';

let token: string | null = null;

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function saveToken(newToken: string) {
  token = newToken;
  await SecureStore.setItemAsync(TOKEN_KEY, newToken);
}

async function clearToken() {
  token = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

type Options = { method?: string; body?: unknown };

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  // Stop waiting after 10 seconds (wrong wifi or a stopped server would otherwise spin forever)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new ApiError(res.status, data?.message ?? `Request failed (${res.status})`, data?.error);
    }
    return data as T;
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    if (e?.name === 'AbortError') {
      throw new ApiError(0, 'The server did not answer. Is it running, and are you on the same wifi?');
    }
    throw new ApiError(0, 'Could not reach the server');
  } finally {
    clearTimeout(timer);
  }
}

export type Department = { name_en: string; name_zh: string };

export type StudentProfile = {
  student_id: string;
  name_zh: string;
  nickname: string | null;
  department: string | null;
  entry_year: number | null;
};

export type RegisterInput = {
  student_id: string;
  name_zh: string;
  nickname?: string;
  password: string;
  department?: string;
  entry_year?: number;
};

export async function login(student_id: string, password: string) {
  const data = await api<{ token: string }>('/auth/login', {
    method: 'POST',
    body: { student_id, password },
  });
  await saveToken(data.token);
}

export async function register(input: RegisterInput) {
  const data = await api<{ token: string }>('/auth/register', {
    method: 'POST',
    body: input,
  });
  await saveToken(data.token); // registering also logs the student in
}

export async function logout() {
  await clearToken();
}

export async function getMyProfile(): Promise<StudentProfile> {
  return api<StudentProfile>('/me');
}

// Called when the app starts. 'ok' = go to Home, 'none' = show Login, 'offline' = server problem.
export async function restoreSession(): Promise<'ok' | 'none' | 'offline'> {
  const saved = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!saved) return 'none';

  token = saved;
  try {
    await api('/me'); // does the server still accept this token?
    return 'ok';
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      await clearToken(); // expired or invalid: start fresh
      return 'none';
    }
    return 'offline'; // keep the token, the server just isn't reachable right now
  }
}