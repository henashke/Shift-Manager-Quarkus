import {Announcement, isRecent} from './announcements';

const shippedOn = (date: string) => ({id: 'x', title: '', date, content: () => null}) as Announcement;

describe('isRecent', () => {
    const now = new Date(2026, 10, 15, 23, 30);

    it('pops up for 30 days from its date, then stops', () => {
        expect(isRecent(shippedOn('2026-11-15'), now)).toBe(true);
        expect(isRecent(shippedOn('2026-10-17'), now)).toBe(true);
        expect(isRecent(shippedOn('2026-10-16'), now)).toBe(false);
        expect(isRecent(shippedOn('2026-10-06'), now)).toBe(false);
    });
});
