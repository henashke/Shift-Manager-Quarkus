import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {observer} from 'mobx-react-lite';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import {alpha, keyframes, SxProps, Theme} from '@mui/material/styles';
import PriorityHighRounded from '@mui/icons-material/PriorityHighRounded';
import notificationStore, {Notification, NotificationType} from '../stores/NotificationStore';
import {EASE_EXIT, EASE_SETTLE, EASE_SHEET, floatingSurface} from '../theme';

const ENTER_MS = 520;
const EXIT_MS = 260;
// Off the top of the screen, slightly smaller: where a toast comes from and where it goes back to
const OFFSTAGE = 'translateY(calc(-100% - 24px)) scale(0.92)';
// An upward flick faster than this (px/ms), or a drag past a third of its height, dismisses it
const DISMISS_VELOCITY = 0.3;
const TAP_SLOP_PX = 6;
// Held toasts restart with this much time once let go
const RESUME_MS = 1500;

const colorOf = (type: NotificationType) => (theme: Theme) =>
    type === 'success' ? theme.palette.success.main : type === 'warning' ? theme.palette.warning.main : theme.palette.error.main;

// Pulling a toast down meets more and more resistance, so it gives a little and springs back
const rubberband = (distance: number, dimension: number, constant = 0.55) =>
    (distance * dimension * constant) / (dimension + constant * Math.abs(distance));

const drawCheck = keyframes`
    from {
        stroke-dashoffset: 24;
    }
    to {
        stroke-dashoffset: 0;
    }
`;

const popIn = keyframes`
    from {
        transform: scale(0.4);
        opacity: 0;
    }
    to {
        transform: none;
        opacity: 1;
    }
`;

const badgeSx = (type: NotificationType): SxProps<Theme> => theme => ({
    width: 28,
    height: 28,
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '50%',
    color: theme.palette.common.white,
    bgcolor: colorOf(type)(theme),
    boxShadow: `0 4px 12px ${alpha(colorOf(type)(theme), 0.45)}`,
    animation: `${popIn} 420ms ${EASE_SETTLE} 80ms both`,
    '@media (prefers-reduced-motion: reduce)': {animation: 'none'},
});

// The check draws itself in once the badge has popped in: the moment of completion
const checkSx: SxProps<Theme> = {
    strokeDasharray: 24,
    animation: `${drawCheck} 360ms ${EASE_SETTLE} 260ms both`,
    '@media (prefers-reduced-motion: reduce)': {animation: 'none', strokeDasharray: 'none'},
};

const toastSx: SxProps<Theme> = theme => ({
    ...floatingSurface(theme),
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 1.25,
    py: 1.25,
    paddingInlineStart: 1.25,
    paddingInlineEnd: 2,
    minHeight: 52,
    maxWidth: 'min(440px, calc(100vw - 32px))',
    borderRadius: '26px',
    // The toast follows the finger itself, so the page mustn't scroll under it
    touchAction: 'none',
    userSelect: 'none',
    cursor: 'pointer',
    willChange: 'transform, opacity',
});

const Badge: React.FC<{ type: NotificationType }> = ({type}) => (
    <Box sx={badgeSx(type)}>
        {type === 'success' ? (
            <Box component="svg" viewBox="0 0 24 24" sx={{width: 18, height: 18}} aria-hidden>
                <Box component="path" d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth={3}
                     strokeLinecap="round" strokeLinejoin="round" sx={checkSx}/>
            </Box>
        ) : <PriorityHighRounded sx={{fontSize: 18}}/>}
    </Box>
);

type Phase = 'entering' | 'shown' | 'leaving';

const Toast: React.FC<{ notification: Notification }> = ({notification}) => {
    const {id, type, message, duration} = notification;
    const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', {noSsr: true});
    const [phase, setPhase] = useState<Phase>('entering');
    const ref = useRef<HTMLDivElement>(null);
    const timer = useRef<number | undefined>(undefined);
    const drag = useRef<{ startY: number, dy: number, moved: boolean, samples: { y: number, t: number }[] } | null>(null);

    const dismiss = () => {
        window.clearTimeout(timer.current);
        setPhase('leaving');
    };
    const startTimer = (ms: number) => {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(dismiss, ms);
    };

    // Mounted off-stage, then moved on-stage on the next frame so the transition runs
    useEffect(() => {
        const frame = requestAnimationFrame(() => requestAnimationFrame(() => setPhase('shown')));
        startTimer(duration);
        return () => {
            cancelAnimationFrame(frame);
            window.clearTimeout(timer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Removed from the store only once it has left the screen
    useEffect(() => {
        if (phase !== 'leaving') return;
        const done = window.setTimeout(() => notificationStore.removeNotification(id), reduceMotion ? 150 : EXIT_MS);
        return () => window.clearTimeout(done);
    }, [phase, id, reduceMotion]);

    const onPointerDown = (e: React.PointerEvent) => {
        if (phase === 'leaving') return;
        // Holding a toast keeps it, so it can be read
        window.clearTimeout(timer.current);
        drag.current = {startY: e.clientY, dy: 0, moved: false, samples: [{y: e.clientY, t: e.timeStamp}]};
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        const d = drag.current;
        const el = ref.current;
        if (!d || !el) return;
        d.dy = e.clientY - d.startY;
        if (!d.moved && Math.abs(d.dy) < TAP_SLOP_PX) return;
        d.moved = true;
        d.samples.push({y: e.clientY, t: e.timeStamp});
        if (d.samples.length > 8) d.samples.shift();
        // Up follows the finger 1:1; down resists
        const offset = d.dy < 0 ? d.dy : rubberband(d.dy, el.offsetHeight);
        el.style.transition = 'none';
        el.style.transform = `translateY(${offset}px)`;
    };

    const onStage = phase === 'shown';
    const transform = reduceMotion || onStage ? 'none' : OFFSTAGE;
    const exitTransition = `transform ${EXIT_MS}ms ${EASE_EXIT}, opacity ${EXIT_MS}ms ${EASE_EXIT}`;
    const transition = phase === 'leaving'
        ? exitTransition
        : `transform ${ENTER_MS}ms ${EASE_SHEET}, opacity ${ENTER_MS / 2}ms ease-out`;

    const onPointerUp = () => {
        const d = drag.current;
        const el = ref.current;
        drag.current = null;
        if (!d || !el) return;
        if (!d.moved) {
            dismiss();
            return;
        }
        const first = d.samples[0];
        const last = d.samples[d.samples.length - 1];
        const velocity = last.t > first.t ? (last.y - first.y) / (last.t - first.t) : 0;
        const leave = velocity < -DISMISS_VELOCITY || d.dy < -el.offsetHeight / 3;
        // Animates on from wherever the finger let go: off the top, or back into place
        el.style.transition = leave ? exitTransition : transition;
        el.style.transform = leave && !reduceMotion ? OFFSTAGE : transform;
        if (leave) {
            el.style.opacity = '0';
            dismiss();
        } else {
            startTimer(RESUME_MS);
        }
    };

    return (
        <Box ref={ref} role={type === 'error' ? 'alert' : 'status'}
             onPointerDown={onPointerDown} onPointerMove={onPointerMove}
             onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
             sx={toastSx} style={{transform, opacity: onStage ? 1 : 0, transition}}>
            <Badge type={type}/>
            <Typography sx={{fontWeight: 600, fontSize: '0.92rem', lineHeight: 1.4}}>{message}</Typography>
        </Box>
    );
};

// Toasts drop in from the top of the screen like iOS banners, newest first. Each can be flicked back up or tapped away.
// When one comes or goes, the others glide to their new places (FLIP) rather than jumping.
const NotificationDisplay: React.FC = observer(() => {
    const slots = useRef(new Map<number, HTMLDivElement>());
    const lastTops = useRef(new Map<number, number>());
    const notifications = notificationStore.notifications.slice().reverse();

    useLayoutEffect(() => {
        const tops = new Map<number, number>();
        slots.current.forEach((el, id) => {
            const top = el.getBoundingClientRect().top;
            tops.set(id, top);
            const before = lastTops.current.get(id);
            if (before === undefined || before === top) return;
            el.style.transition = 'none';
            el.style.transform = `translateY(${before - top}px)`;
            requestAnimationFrame(() => {
                el.style.transition = `transform 400ms ${EASE_SETTLE}`;
                el.style.transform = '';
            });
        });
        lastTops.current = tops;
    });

    return (
        <Box dir="rtl" aria-live="polite" sx={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top) + 10px)',
            insetInline: 0,
            zIndex: theme => theme.zIndex.snackbar,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            px: 2,
            pointerEvents: 'none',
        }}>
            {notifications.map(notification => (
                <Box key={notification.id} ref={(el: HTMLDivElement | null) => {
                    if (el) slots.current.set(notification.id, el);
                    else slots.current.delete(notification.id);
                }}>
                    <Toast notification={notification}/>
                </Box>
            ))}
        </Box>
    );
});

export default NotificationDisplay;
