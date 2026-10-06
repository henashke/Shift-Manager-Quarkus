import authStore from './stores/AuthStore';

/**
 * fetch() for authenticated API calls: refreshes the access token when it's (about to be) expired, and retries once
 * after refreshing if the server still answers 401. If the session can't be refreshed, sends the user to /login.
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
    await authStore.ensureFreshToken();
    let response = await fetch(input, withAuthHeader(init));
    if (response.status !== 401) return response;

    if (await authStore.refresh()) {
        response = await fetch(input, withAuthHeader(init));
    }
    if (response.status === 401 && !authStore.isAuthenticated() && window.location.pathname !== '/login') {
        window.location.assign('/login');
    }
    return response;
}

// Always send the current token (callers may pass headers built with an older one)
function withAuthHeader(init: RequestInit): RequestInit {
    return {
        ...init,
        headers: {
            ...(init.headers as Record<string, string> | undefined),
            ...authStore.getAuthHeaders()
        }
    };
}

// The last response body per kind of data, with the value the store built from it. Refetching data that hasn't changed
// (every tab refetches when it opens) can then keep the store's existing objects instead of replacing them with equal
// copies, which would re-render everything that shows them. `current` must still be that value: any local change
// replaces it (the stores assign new arrays), so a locally changed collection is always refreshed.
const lastResponses = new Map<string, { body: string, value: unknown }>();

export const isUnchangedResponse = (key: string, body: string, current: unknown) => {
    const last = lastResponses.get(key);
    return !!last && last.body === body && last.value === current;
};

export const rememberResponse = (key: string, body: string, value: unknown) => {
    lastResponses.set(key, {body, value});
};
