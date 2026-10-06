import {makeAutoObservable, runInAction} from 'mobx';
import {authFetch, isUnchangedResponse, rememberResponse} from '../api';
import config from '../config';
import authStore from './AuthStore';
import notificationStore from "./NotificationStore";
import {User} from "./ShiftStore";

class UserStore {
  users: User[] = [];
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  fetchUsers = async () => {
    if (!authStore.isAuthenticated()) {
      return;
    }
    
    this.loading = true;
    try {
      const res = await authFetch(`${config.API_BASE_URL}/users`, {
        headers: authStore.getAuthHeaders()
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch users: ${res.status}`);
      }
      const body = await res.text();
      runInAction(() => {
        if (!isUnchangedResponse('users', body, this.users)) {
          this.users = (JSON.parse(body) as User[]).sort((a, b) => a.name.localeCompare(b.name));
          rememberResponse('users', body, this.users);
        }
        this.loading = false;
      });
    } catch (e) {
      runInAction(() => {
        this.loading = false;
        console.error('Failed to fetch users', e);
      });
    }
  };

  editUser = async (user: User) => {
    if (!authStore.isAdmin()) {
      notificationStore.showUnauthorizedError();
    }

    try {
      const res = await authFetch(`${config.API_BASE_URL}/users/${user.name}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authStore.getAuthHeaders()
        },
        body: JSON.stringify(user)
      });
      if (!res.ok) {
        throw new Error(`Failed to edit user: ${res.status}`);
      }
      runInAction(() => {
        const index = this.users.findIndex(u => u.name === user.name);
        if (index !== -1) {
          this.users[index] = user;
        }
      });
    } catch (e) {
      console.error('Failed to edit user', e);
      throw e;
    }
  };

  // Admin actions; the server enforces the admin role too
  setReserve = async (username: string, reserve: boolean) => {
    const res = await authFetch(`${config.API_BASE_URL}/users/${encodeURIComponent(username)}/reserve`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json', ...authStore.getAuthHeaders()},
      body: JSON.stringify({reserve})
    });
    if (!res.ok) return showRequestError(res, 'שגיאה בעדכון הכונן');
    this.replaceUser(await res.json());
    notificationStore.showSuccess(reserve ? `המשתמש ${username} הועבר למילואים` : `המשתמש ${username} חזר לכוננים הקבועים`);
  };

  setRole = async (username: string, role: 'admin' | 'user') => {
    const res = await authFetch(`${config.API_BASE_URL}/users/${encodeURIComponent(username)}/role`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json', ...authStore.getAuthHeaders()},
      body: JSON.stringify({role})
    });
    if (!res.ok) return showRequestError(res, 'שגיאה בעדכון ההרשאות');
    this.replaceUser(await res.json());
    notificationStore.showSuccess(role === 'admin' ? `המשתמש ${username} הוא עכשיו מנהל` : `הרשאות המנהל של ${username} הוסרו`);
  };

  private replaceUser = (updated: User) => {
    const index = this.users.findIndex(u => u.name === updated.name);
    if (index !== -1) this.users[index] = updated;
  };

  deleteUser = async (username: string) => {
    if (!authStore.isAdmin()) {
      notificationStore.showUnauthorizedError();
    }

    try {
      const res = await authFetch(`${config.API_BASE_URL}/users/${username}`, {
        method: 'DELETE',
        headers: {
          ...authStore.getAuthHeaders()
        }
      });
      if (!res.ok) {
        throw new Error(`Failed to delete user: ${res.status}`);
      }
      notificationStore.showSuccess('הכונן ' + username + ' נמחק בהצלחה')
      runInAction(() => {
        this.users = this.users.filter(u => u.name !== username);
      });
    } catch (e) {
        notificationStore.showError('שגיאה בעת מחיקת הכונן')
        console.error('Failed to delete user', e);
      throw e;
    }
  };
}

// Shows the server's {"error": ...} message, or a fallback
const showRequestError = async (res: Response, fallback: string) => {
  const body = await res.json().catch(() => null);
  notificationStore.showError(body?.error ?? fallback);
};

const usersStore = new UserStore();
export default usersStore;
