import {makeAutoObservable} from 'mobx';
import authStore from './AuthStore';
import {Announcement, announcements, isRecent} from '../announcements';

// Seen announcement ids, per device
const SEEN_STORAGE_KEY = 'seenAnnouncements';

// Storage can be unavailable (private mode, blocked site data); then announcements just show again next visit
const readSeen = (): Set<string> => {
    try {
        const parsed = JSON.parse(localStorage.getItem(SEEN_STORAGE_KEY) ?? '[]');
        return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
        return new Set();
    }
};

class AnnouncementStore {
    seenIds = readSeen();
    // At most one announcement per visit: after one is dismissed, the next waits for the next time the app opens
    dismissedThisVisit = false;

    constructor() {
        makeAutoObservable(this);
    }

    // Every announcement for the signed-in user, newest first (browsed from settings)
    get all(): Announcement[] {
        return announcements.filter(a => a.audience !== 'admin' || authStore.isAdmin()).reverse();
    }

    // The oldest unseen, still recent announcement for the signed-in user (list order is feature order), one per visit
    get current(): Announcement | undefined {
        if (!authStore.isAuthenticated() || this.dismissedThisVisit) return undefined;
        return announcements.find(a =>
            !this.seenIds.has(a.id)
            && (a.audience !== 'admin' || authStore.isAdmin())
            && isRecent(a));
    }

    markSeen = (id: string) => {
        this.dismissedThisVisit = true;
        if (this.seenIds.has(id)) return;
        this.seenIds = new Set(this.seenIds).add(id);
        try {
            localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(Array.from(this.seenIds)));
        } catch {
        }
    };
}

const announcementStore = new AnnouncementStore();
export default announcementStore;
