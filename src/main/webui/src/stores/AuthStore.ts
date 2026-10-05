import {makeAutoObservable, runInAction} from 'mobx';
import config from '../config';

// Refresh a bit before the access token actually expires, so in-flight requests don't race the expiry
const EXPIRY_MARGIN_MS = 30 * 1000;

class AuthStore {
  username: string | null = null;
  token: string | null = null;
  refreshToken: string | null = null;
  role: string | null = null;

  // Only one refresh at a time: refresh tokens are single-use, so parallel refreshes would invalidate each other
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const savedUsername = localStorage.getItem('username');
    const savedToken = localStorage.getItem('token');
    if (savedUsername && savedToken) {
      this.username = savedUsername;
      this.token = savedToken;
      this.refreshToken = localStorage.getItem('refreshToken');
      this.role = localStorage.getItem('role');
    }
  }

  setAuth(username: string, token: string, role: string, refreshToken: string) {
    this.username = username;
    this.token = token;
    this.role = role;
    this.refreshToken = refreshToken;
    localStorage.setItem('username', username);
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('refreshToken', refreshToken);
  }

  logout() {
    const refreshToken = this.refreshToken;
    this.clearAuth();
    if (refreshToken) {
      // Best effort: invalidate the refresh token on the server
      fetch(`${config.API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({refreshToken})
      }).catch(() => {
      });
    }
  }

  private clearAuth() {
    this.username = null;
    this.token = null;
    this.role = null;
    this.refreshToken = null;
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('refreshToken');
  }

  getAuthHeaders(): Record<string, string> {
    if (this.token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      };
    }
    return {
      'Content-Type': 'application/json'
    };
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  isAdmin(): boolean {
    return this.role === 'admin';
  }

  // Helper to decode JWT and check expiration
  isTokenExpired(token: string | null = this.token, marginMs = 0): boolean {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return false;
      // exp is in seconds, Date.now() in ms
      return Date.now() + marginMs >= payload.exp * 1000;
    } catch (e) {
      return true;
    }
  }

  /**
   * Makes sure there's a usable access token, refreshing it if it's expired or about to expire.
   * @returns false if the session can't be recovered (the user has to log in again)
   */
  async ensureFreshToken(): Promise<boolean> {
    if (!this.isAuthenticated()) return false;
    if (!this.isTokenExpired(this.token, EXPIRY_MARGIN_MS)) return true;
    return this.refresh();
  }

  /**
   * Exchanges the refresh token for a new access + refresh token. Logs out if that fails.
   */
  refresh(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.doRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async doRefresh(): Promise<boolean> {
    // Another tab may have refreshed already (and used up our refresh token): adopt its tokens
    const storedToken = localStorage.getItem('token');
    if (storedToken && storedToken !== this.token && !this.isTokenExpired(storedToken, EXPIRY_MARGIN_MS)) {
      runInAction(() => this.loadFromStorage());
      return true;
    }

    const refreshToken = localStorage.getItem('refreshToken') || this.refreshToken;
    if (!refreshToken) {
      runInAction(() => this.clearAuth());
      return false;
    }
    try {
      const res = await fetch(`${config.API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({refreshToken})
      });
      if (!res.ok) {
        // Unless another tab refreshed with the same token in the meantime, the session is over
        const tokenFromOtherTab = localStorage.getItem('token');
        if (tokenFromOtherTab && tokenFromOtherTab !== this.token && !this.isTokenExpired(tokenFromOtherTab)) {
          runInAction(() => this.loadFromStorage());
          return true;
        }
        runInAction(() => this.clearAuth());
        return false;
      }
      const data = await res.json();
      runInAction(() => this.setAuth(data.username, data.token, data.role, data.refreshToken));
      return true;
    } catch (e) {
      // Network error: keep the session, the next request will try again
      return false;
    }
  }

  /**
   * Changes the signed-in user's own name and/or password (both need the current password) and switches to the new
   * tokens the server returns.
   * @returns the error to show, or null on success
   */
  async updateAccount(changes: {username?: string; newPassword?: string; currentPassword: string}): Promise<string | null> {
    // Not authFetch: it imports this store
    if (!(await this.ensureFreshToken())) return 'החיבור פג, יש להתחבר מחדש';
    try {
      const res = await fetch(`${config.API_BASE_URL}/auth/account`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(changes)
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) return body?.error ?? 'עדכון החשבון נכשל';
      const oldRefreshToken = this.refreshToken;
      runInAction(() => this.setAuth(body.username, body.token, body.role, body.refreshToken));
      // Best effort: the old refresh token isn't needed any more (a password change already revoked it)
      if (oldRefreshToken) {
        fetch(`${config.API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({refreshToken: oldRefreshToken})
        }).catch(() => {
        });
      }
      return null;
    } catch (e) {
      return 'עדכון החשבון נכשל';
    }
  }

  async ensureValidSession(navigate?: (path: string) => void) {
    if (!this.isAuthenticated()) return;
    const valid = await this.ensureFreshToken();
    if (!valid && !this.isAuthenticated() && navigate) {
      navigate('/login');
    }
  }
}

const authStore = new AuthStore();
export default authStore;
