import { Platform } from 'react-native';

const ENV_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';
export const BASE_URL = Platform.OS === 'web' ? 'http://localhost:4000/api' : ENV_URL;

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (opts.token) {
    headers['Authorization'] = `Bearer ${opts.token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? `Request failed (${res.status})`);
  }

  return json as T;
}

export async function uploadPhoto(uri: string, token: string | null): Promise<{ url: string }> {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    // On web, uri may be a data URI or blob URL — fetch it and append as Blob
    const blob = await fetch(uri).then((r) => r.blob());
    formData.append('photo', blob, 'photo.jpg');
  } else {
    const filename = uri.split('/').pop() ?? 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('photo', { uri, name: filename, type } as unknown as Blob);
  }

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/uploads`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `Upload failed (${res.status})`);
  return json as { url: string };
}
