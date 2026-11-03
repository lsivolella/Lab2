// Wrapper around fetch for the Spring Boot API.
// - Session cookie (JSESSIONID) is sent automatically (same origin via Vite proxy).
// - For POST/PUT/PATCH/DELETE, copies the XSRF-TOKEN cookie into X-XSRF-TOKEN.
// - Throws ApiError with the backend "problem details" (status, detail, errors).

/** Error body returned by the backend (RFC 9457 problem details). */
export interface ProblemDetail {
    status: number;
    title?: string;
    detail?: string;
    errors?: Record<string, string>;
}

export class ApiError extends Error {
    readonly status: number;
    /** Per-field validation messages, e.g. { "cpf": "Invalid CPF." }. */
    readonly errors: Record<string, string>;

    constructor(status: number, body: ProblemDetail | null) {
        super(body?.detail ?? `Request failed with status ${status}`);
        this.status = status;
        this.errors = body?.errors ?? {};
    }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
    method?: HttpMethod;
    body?: unknown;
}

function readCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

export async function api<T>(
    path: string,
    { method = 'GET', body }: RequestOptions = {},
): Promise<T> {
    const headers: Record<string, string> = {};

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    if (method !== 'GET') {
        const token = readCookie('XSRF-TOKEN');
        if (token) {
            headers['X-XSRF-TOKEN'] = token;
        }
    }

    const response = await fetch(`/api${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const data: unknown = await response.json().catch(() => null);

    if (!response.ok) {
        throw new ApiError(response.status, data as ProblemDetail | null);
    }

    return data as T;
}
