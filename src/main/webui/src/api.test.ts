import {authFetch} from './api';
import authStore from './stores/AuthStore';

const jwt = (expInSeconds: number) =>
    'h.' + btoa(JSON.stringify({exp: Math.floor(Date.now() / 1000) + expInSeconds})) + '.s';

const json = (status: number, body: object = {}) =>
    Promise.resolve(new Response(JSON.stringify(body), {status}));

const refreshResponse = (token: string, refreshToken: string) =>
    json(200, {username: 'u', role: 'user', token, refreshToken});

const callsTo = (mock: jest.Mock, path: string) =>
    mock.mock.calls.filter(([url]) => String(url).endsWith(path));

describe('authFetch', () => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
        localStorage.clear();
        authStore.setAuth('u', jwt(3600), 'user', 'r1');
        fetchMock = jest.fn();
        global.fetch = fetchMock;
    });

    it('sends the current access token', async () => {
        fetchMock.mockImplementation(() => json(200));
        await authFetch('/api/users', {headers: {Authorization: 'Bearer stale'}});
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${authStore.token}`);
    });

    it('refreshes an expired token before the request', async () => {
        const fresh = jwt(3600);
        authStore.setAuth('u', jwt(-10), 'user', 'r1');
        fetchMock.mockImplementation((url: string) =>
            url.endsWith('/auth/refresh') ? refreshResponse(fresh, 'r2') : json(200));

        const res = await authFetch('/api/users');

        expect(res.status).toBe(200);
        expect(JSON.parse(callsTo(fetchMock, '/auth/refresh')[0][1].body)).toEqual({refreshToken: 'r1'});
        expect(callsTo(fetchMock, '/api/users')[0][1].headers.Authorization).toBe(`Bearer ${fresh}`);
        expect(localStorage.getItem('refreshToken')).toBe('r2');
    });

    it('refreshes and retries once on 401', async () => {
        const fresh = jwt(3600);
        let usersCalls = 0;
        fetchMock.mockImplementation((url: string) => {
            if (url.endsWith('/auth/refresh')) return refreshResponse(fresh, 'r2');
            return json(usersCalls++ === 0 ? 401 : 200);
        });

        const res = await authFetch('/api/users');

        expect(res.status).toBe(200);
        expect(callsTo(fetchMock, '/api/users')).toHaveLength(2);
        expect(callsTo(fetchMock, '/api/users')[1][1].headers.Authorization).toBe(`Bearer ${fresh}`);
    });

    it('refreshes only once for parallel requests (refresh tokens are single-use)', async () => {
        authStore.setAuth('u', jwt(-10), 'user', 'r1');
        fetchMock.mockImplementation((url: string) =>
            url.endsWith('/auth/refresh') ? refreshResponse(jwt(3600), 'r2') : json(200));

        await Promise.all([authFetch('/api/users'), authFetch('/api/shifts'), authFetch('/api/constraints')]);

        expect(callsTo(fetchMock, '/auth/refresh')).toHaveLength(1);
    });

    it('adopts tokens another tab already refreshed instead of using the spent refresh token', async () => {
        authStore.setAuth('u', jwt(-10), 'user', 'r1');
        const fromOtherTab = jwt(3600);
        localStorage.setItem('token', fromOtherTab);
        localStorage.setItem('refreshToken', 'r2');
        fetchMock.mockImplementation(() => json(200));

        await authFetch('/api/users');

        expect(callsTo(fetchMock, '/auth/refresh')).toHaveLength(0);
        expect(authStore.token).toBe(fromOtherTab);
    });

    it('logs out when the refresh token is rejected', async () => {
        authStore.setAuth('u', jwt(-10), 'user', 'r1');
        fetchMock.mockImplementation((url: string) =>
            url.endsWith('/auth/refresh') ? json(401) : json(401));

        await authFetch('/api/users');

        expect(authStore.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('refreshToken')).toBeNull();
    });
});
