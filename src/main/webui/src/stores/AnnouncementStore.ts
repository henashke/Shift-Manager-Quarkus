import {makeAutoObservable} from 'mobx';
import authStore from './AuthStore';
import {Announcement, announcements} from '../announcements';

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

    constructor() {
        makeAutoObservable(this);
    }

    // The next announcement for the signed-in user, oldest first, one at a time
    get current(): Announcement | undefined {
        if (!authStore.isAuthenticated()) return undefined;
        const today = new Date().toISOString().slice(0, 10);
        return announcements.find(a =>
            !this.seenIds.has(a.id)
            && (a.audience !== 'admin' || authStore.isAdmin())
            && (!a.showUntil || today <= a.showUntil));
    }

    markSeen = (id: string) => {
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
