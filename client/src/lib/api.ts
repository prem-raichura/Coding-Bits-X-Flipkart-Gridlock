import { BASE_URL } from '../config/api'

interface RequestOptions {
  method?: string
  body?: unknown
  token?: string | null
}

function getToken(): string | null {
  return typeof localStorage !== 'undefined' ? localStorage.getItem('btp_token') : null
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = opts.token ?? getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? `Request failed (${res.status})`)
  }
  return json as T
}

export async function uploadCsv(file: File, token: string | null): Promise<{ run_id: string; status: string }> {
  const fd = new FormData()
  fd.append('file', file)

  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}/csv`, {
    method: 'POST',
    headers,
    body: fd,
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? `Upload failed (${res.status})`)
  }
  return json as { run_id: string; status: string }
}
