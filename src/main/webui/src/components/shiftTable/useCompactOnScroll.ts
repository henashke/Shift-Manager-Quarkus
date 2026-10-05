import {useEffect, useState} from 'react';

// Within this distance of the top the navigation is always full size
const EXPANDED_NEAR_TOP_PX = 24;
// Scrolling this far in one direction flips the state, so small jitters don't toggle it
const DIRECTION_THRESHOLD_PX = 12;

/**
 * Like Safari's toolbar on iPhone: compact while scrolling down, full size again when scrolling up or back at the top.
 * It only switches a state; the animation itself is a CSS transition the browser runs, which stays smooth on phones
 * (driving every frame from scroll events in JavaScript lagged behind iOS's scrolling).
 * The listener is passive and checks once per frame; the component only re-renders when the state flips.
 */
export const useCompactOnScroll = () => {
    const [compact, setCompact] = useState(false);

    useEffect(() => {
        // The content height is cached (reading it can force a layout mid-scroll) and refreshed when the page resizes.
        // The window height is read live on every scroll: iOS Safari collapses its toolbars during a fast scroll, making
        // the window taller and the scroll range shorter, without always firing a resize event in time.
        let contentHeight = 0;
        const measureContent = () => {
            contentHeight = document.documentElement.scrollHeight;
        };
        measureContent();
        const contentObserver = new ResizeObserver(measureContent);
        contentObserver.observe(document.body);
        // Clamped to the page's real range: iOS Safari overshoots past the bottom (and top) and springs back, and that
        // spring-back would otherwise read as scrolling up and expand the navigation at the end of the page
        const scrollPosition = () =>
            Math.min(Math.max(window.scrollY, 0), Math.max(contentHeight - window.innerHeight, 0));

        // On touch screens only scrolling the finger caused counts: while it's down, or momentum continuing the way it
        // dragged. Movement the other way with no finger on the screen is Safari's own doing (the spring-back after a
        // hard flick into the bottom, toolbars resizing, content changing height) and must not flip the state.
        // Mouse and trackpad scrolling never fires touch events, so it's unaffected.
        let usedTouch = false;
        let touching = false;
        let fingerY = 0;
        let gestureDirection = 0;
        const onTouchStart = (e: TouchEvent) => {
            usedTouch = true;
            touching = true;
            fingerY = e.touches[0].clientY;
        };
        const onTouchMove = (e: TouchEvent) => {
            const y = e.touches[0].clientY;
            // Finger moving up scrolls the page down
            if (Math.abs(y - fingerY) > 2) gestureDirection = y < fingerY ? 1 : -1;
            fingerY = y;
        };
        const onTouchEnd = (e: TouchEvent) => {
            touching = e.touches.length > 0;
        };

        let lastY = scrollPosition();
        let travelled = 0;
        let frame = 0;
        const update = () => {
            frame = 0;
            const y = scrollPosition();
            const dy = y - lastY;
            lastY = y;
            if (y < EXPANDED_NEAR_TOP_PX) {
                travelled = 0;
                setCompact(false);
                return;
            }
            if (usedTouch && !touching && gestureDirection !== 0 && Math.sign(dy) !== gestureDirection) return;
            // Distance travelled in the current direction; turning around starts over
            travelled = Math.sign(dy) === Math.sign(travelled) ? travelled + dy : dy;
            if (travelled > DIRECTION_THRESHOLD_PX) setCompact(true);
            else if (travelled < -DIRECTION_THRESHOLD_PX) setCompact(false);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        window.addEventListener('scroll', onScroll, {passive: true});
        window.addEventListener('touchstart', onTouchStart, {passive: true});
        window.addEventListener('touchmove', onTouchMove, {passive: true});
        window.addEventListener('touchend', onTouchEnd, {passive: true});
        window.addEventListener('touchcancel', onTouchEnd, {passive: true});
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('touchcancel', onTouchEnd);
            contentObserver.disconnect();
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    return [compact, setCompact] as const;
};
