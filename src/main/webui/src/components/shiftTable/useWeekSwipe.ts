import React, {useRef} from 'react';

// How far a horizontal swipe must travel to change the week
const SWIPE_THRESHOLD_PX = 60;
// Movement before we decide whether the gesture is a horizontal swipe or a vertical scroll
const DIRECTION_LOCK_PX = 10;
// The element follows the finger at this fraction of the distance, so it feels attached but not loose
const FOLLOW_FACTOR = 0.35;
const EASING = 'cubic-bezier(0.2, 0.9, 0.3, 1)';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Swipe sideways on the returned element to change the week. RTL: next week is on the left, so dragging the finger to
 * the right brings it in (calls onSwipe(1)) and dragging to the left goes back (onSwipe(-1)).
 * The element follows the finger through its style directly, so dragging doesn't re-render the table.
 */
export const useWeekSwipe = <E extends HTMLElement>(onSwipe: (direction: 1 | -1) => void) => {
    const ref = useRef<E>(null);
    const gesture = useRef<{ x: number, y: number, mode: 'pending' | 'swipe' | 'scroll' } | null>(null);

    const setOffset = (px: number) => {
        if (!ref.current) return;
        ref.current.style.transform = px ? `translateX(${px}px)` : '';
        ref.current.style.opacity = px ? String(1 - Math.min(Math.abs(px) / 400, 0.35)) : '';
    };

    const onTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length !== 1) return;
        gesture.current = {x: e.touches[0].clientX, y: e.touches[0].clientY, mode: 'pending'};
    };

    const onTouchMove = (e: React.TouchEvent) => {
        const g = gesture.current;
        if (!g || g.mode === 'scroll') return;
        const dx = e.touches[0].clientX - g.x;
        const dy = e.touches[0].clientY - g.y;
        if (g.mode === 'pending') {
            if (Math.abs(dx) < DIRECTION_LOCK_PX && Math.abs(dy) < DIRECTION_LOCK_PX) return;
            g.mode = Math.abs(dx) > Math.abs(dy) ? 'swipe' : 'scroll';
        }
        if (g.mode === 'swipe' && !prefersReducedMotion()) setOffset(dx * FOLLOW_FACTOR);
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        const g = gesture.current;
        gesture.current = null;
        if (!g || g.mode !== 'swipe' || !ref.current) return;
        const el = ref.current;
        const dx = e.changedTouches[0].clientX - g.x;
        const from = dx * FOLLOW_FACTOR;
        const reduced = prefersReducedMotion();

        if (Math.abs(dx) < SWIPE_THRESHOLD_PX) {
            setOffset(0);
            if (!reduced) el.animate([{transform: `translateX(${from}px)`}, {transform: 'none'}], {duration: 200, easing: EASING});
            return;
        }

        const direction = dx > 0 ? 1 : -1;
        if (reduced) {
            setOffset(0);
            onSwipe(direction);
            return;
        }
        // Slide out the way the finger went, switch the week, then slide the new week in from the other side
        const exit = el.animate(
            [{transform: `translateX(${from}px)`, opacity: el.style.opacity || 1}, {transform: `translateX(${direction * 80}px)`, opacity: 0}],
            {duration: 130, easing: 'ease-in', fill: 'forwards'});
        exit.onfinish = () => {
            setOffset(0);
            onSwipe(direction);
            exit.cancel();
            el.animate([{transform: `translateX(${-direction * 60}px)`, opacity: 0}, {transform: 'none', opacity: 1}],
                {duration: 240, easing: EASING});
        };
    };

    const onTouchCancel = () => {
        gesture.current = null;
        setOffset(0);
    };

    return {ref, handlers: {onTouchStart, onTouchMove, onTouchEnd, onTouchCancel}};
};
