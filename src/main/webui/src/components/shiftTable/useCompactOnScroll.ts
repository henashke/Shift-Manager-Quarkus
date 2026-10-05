import {useEffect, useState} from 'react';

// Within this distance of the top the navigation is always full size
const EXPANDED_NEAR_TOP_PX = 24;
// Scrolling this far in one direction flips the state, so small jitters don't toggle it
const DIRECTION_THRESHOLD_PX = 12;

/**
 * Like Safari's toolbar on iPhone: compact while scrolling down, full size again when scrolling up or back at the top.
 * The listener is passive and checks once per frame; the component only re-renders when the state flips.
 */
export const useCompactOnScroll = () => {
    const [compact, setCompact] = useState(false);

    useEffect(() => {
        let lastY = window.scrollY;
        let travelled = 0;
        let frame = 0;
        const update = () => {
            frame = 0;
            const y = window.scrollY;
            const dy = y - lastY;
            lastY = y;
            if (y < EXPANDED_NEAR_TOP_PX) {
                travelled = 0;
                setCompact(false);
                return;
            }
            // Distance travelled in the current direction; turning around starts over
            travelled = Math.sign(dy) === Math.sign(travelled) ? travelled + dy : dy;
            if (travelled > DIRECTION_THRESHOLD_PX) setCompact(true);
            else if (travelled < -DIRECTION_THRESHOLD_PX) setCompact(false);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        window.addEventListener('scroll', onScroll, {passive: true});
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    return [compact, setCompact] as const;
};
