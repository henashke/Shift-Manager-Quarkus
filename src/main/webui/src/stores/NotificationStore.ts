import {makeAutoObservable} from 'mobx';

export type NotificationType = 'error' | 'success' | 'warning';

export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
    // How long it stays, in ms; NotificationDisplay times it, pausing while a finger holds it
    duration: number;
}

// More than this and the oldest makes room
const MAX_VISIBLE = 3;

class NotificationStore {
    notifications: Notification[] = [];
    private nextId = 1;

    constructor() {
        makeAutoObservable(this);
    }

    addNotification(message: string, type: NotificationType = 'error', duration: number = 4000) {
        // The same message twice in a row (e.g. a double tap) shows once
        if (this.notifications.some(n => n.message === message && n.type === type)) return;
        this.notifications.push({id: this.nextId++, message, type, duration});
        if (this.notifications.length > MAX_VISIBLE) this.notifications.shift();
    }

    removeNotification(id: number) {
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    showUnauthorizedError() {
        this.addNotification('פעולה זו נעשית רק על ידי אחראי מערכת', 'error');
    }

    showConstraintUnauthorizedError() {
        this.addNotification('אי אפשר למחוק\\להוסיף אילוצים של כונן אחר', 'error');
    }

    showError(message: string) {
        this.addNotification(message, 'error', 5000);
    }

    showSuccess(message: string) {
        this.addNotification(message, 'success', 2800);
    }

    showWarning(message: string) {
        this.addNotification(message, 'warning');
    }

    clearAll() {
        this.notifications = [];
    }
}

const notificationStore = new NotificationStore();
export default notificationStore;
