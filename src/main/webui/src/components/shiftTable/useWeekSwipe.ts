import React, {useLayoutEffect, useRef, useState} from 'react';

// Space between the table and the neighboring week's table beside it, matching the page gutter
export const SWIPE_PANE_GAP_PX = 16;
// Releasing past this fraction of the width, or flicking, moves to the neighboring week
const COMMIT_FRACTION = 0.25;
const FLICK_VELOCITY = 0.35; // px/ms
const VELOCITY_WINDOW_MS = 100;
// Movement before we decide whether the gesture is a horizontal swipe or a vertical scroll
const DIRECTION_LOCK_PX = 10;
const EASING = 'cubic-bezier(0.2, 0.9, 0.3, 1)';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export type Peek = 0 | 1 | -1;

interface Gesture {
    x: number;
    y: number;
    mode: 'pending' | 'swipe' | 'scroll';
    samples: { x: number, time: number }[];
}

/**
 * Swipe sideways to change the week, like a pager: the returned track follows the finger 1:1 and `peek` says which
 * neighboring week to render beside it (1 = next week, on the left in RTL; -1 = previous week, on the right).
 * Dragging the finger right brings next week in, dragging left brings the previous week.
 * When `weekOffset` changes the track snaps back in the same frame, so the neighbor becomes the table seamlessly.
 */
export const useWeekSwipe = <E extends HTMLElement>(weekOffset: number, onSwipe: (direction: 1 | -1) => void) => {
    const trackRef = useRef<E>(null);
    const gesture = useRef<Gesture | null>(null);
    const [peek, setPeek] = useState<Peek>(0);
    const peekRef = useRef<Peek>(0);
    // While a finished swipe slides into place, new touches wait for the week to change
    const settling = useRef(false);

    const showPeek = (value: Peek) => {
        if (peekRef.current === value) return;
        peekRef.current = value;
        setPeek(value);
    };

    // The new week has rendered: the neighbor we slid in is now the table itself, so drop the offset before painting
    useLayoutEffect(() => {
        const el = trackRef.current;
        el?.getAnimations().forEach(animation => animation.cancel());
        if (el) el.style.transform = '';
        settling.current = false;
        showPeek(0);
    }, [weekOffset]);

    const setX = (px: number) => {
        if (trackRef.current) trackRef.current.style.transform = px ? `translateX(${px}px)` : '';
    };

    const onTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length !== 1 || settling.current) return;
        const {clientX: x, clientY: y} = e.touches[0];
        gesture.current = {x, y, mode: 'pending', samples: [{x, time: e.timeStamp}]};
    };

    const onTouchMove = (e: React.TouchEvent) => {
        const g = gesture.current;
        if (!g || g.mode === 'scroll') return;
        const dx = e.touches[0].clientX - g.x;
        const dy = e.touches[0].clientY - g.y;
        if (g.mode === 'pending') {
            if (Math.abs(dx) < DIRECTION_LOCK_PX && Math.abs(dy) < DIRECTION_LOCK_PX) return;
            g.mode = Math.abs(dx) > Math.abs(dy) ? 'swipe' : 'scroll';
            if (g.mode === 'scroll') return;
        }
        g.samples.push({x: e.touches[0].clientX, time: e.timeStamp});
        if (g.samples.length > 20) g.samples.shift();
        if (prefersReducedMotion()) return;
        showPeek(dx > 0 ? 1 : dx < 0 ? -1 : peekRef.current);
        setX(dx);
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        const g = gesture.current;
        gesture.current = null;
        const el = trackRef.current;
        if (!g || g.mode !== 'swipe' || !el) return;
        const dx = e.changedTouches[0].clientX - g.x;
        const last = g.samples[g.samples.length - 1];
        const first = g.samples.find(s => last.time - s.time <= VELOCITY_WINDOW_MS) ?? last;
        const velocity = last.time > first.time ? (last.x - first.x) / (last.time - first.time) : 0;
        const width = el.offsetWidth + SWIPE_PANE_GAP_PX;
        const direction: 1 | -1 = dx > 0 ? 1 : -1;
        const commit = Math.abs(dx) > width * COMMIT_FRACTION
            || (Math.abs(velocity) > FLICK_VELOCITY && Math.sign(velocity) === direction);

        if (prefersReducedMotion()) {
            if (commit) onSwipe(direction);
            return;
        }
        setX(0);
        if (commit) {
            // Finish the slide so the neighbor fills the frame, then switch the week (the layout effect resets the track)
            settling.current = true;
            const slide = el.animate([{transform: `translateX(${dx}px)`}, {transform: `translateX(${direction * width}px)`}],
                {duration: 220, easing: EASING, fill: 'forwards'});
            slide.onfinish = () => onSwipe(direction);
        } else {
            const back = el.animate([{transform: `translateX(${dx}px)`}, {transform: 'none'}], {duration: 200, easing: EASING});
            back.onfinish = () => showPeek(0);
        }
    };

    const onTouchCancel = () => {
        gesture.current = null;
        setX(0);
        showPeek(0);
    };

    return {trackRef, peek, handlers: {onTouchStart, onTouchMove, onTouchEnd, onTouchCancel}};
};
