/** Client HTTP de l'API FastAPI. En dev, Vite proxifie `/api` vers le backend (voir `vite.config.ts`). */
const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api/v1').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type Query = Record<string, string | number>;

// FastAPI renvoie `detail` en texte (HTTPException) ou en liste d'erreurs (validation Pydantic).
function errorMessage(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail))
    return detail.map((d: { msg?: string }) => (d.msg ?? String(d)).replace(/^Value error, /, '')).join(' · ');
  return `Erreur serveur (${status})`;
}

export async function request<T>(method: string, path: string, options: { query?: Query; body?: unknown } = {}): Promise<T> {
  const search = options.query
    ? `?${new URLSearchParams(Object.entries(options.query).map(([k, v]) => [k, String(v)]))}`
    : '';

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}${search}`, {
      method,
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('Serveur injoignable : vérifiez que le backend est lancé.', 0);
  }

  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(errorMessage(body, res.status), res.status);
  return body as T;
}
