# CLAUDE.md — web UI

React frontend (Create React App, TypeScript, MUI 7, MobX), built and served by Quinoa. See the root `CLAUDE.md` for
how it is run.

## Commands

```bash
npx tsc --noEmit -p .   # type-check
npx eslint src          # lint (CRA's react-app config)
```

`mvn quarkus:dev` (repo root) also starts the React dev server on `:3000`, which can be used directly: its
`package.json` `proxy` forwards `/api` to `:8080`. Quarkus dev listens on localhost only, so a phone on the same network
uses `http://<this machine's LAN IP>:3000`. The dev build runs React's development mode with `StrictMode` (every render
and effect runs twice), so it is several times slower than production; judge performance with that in mind.

## Where things are

- `components/shiftTable/ShiftTable.tsx`: the week table for both tabs. Renders from a list of dates (`renderTable`),
  shows `CardSkeleton`s while loading, and hosts the week swipe (`useWeekSwipe`: a pager that shows the neighboring
  week mid-swipe).
- `components/shiftTable/CalendarNavigation.tsx`: sticky week navigation. Two layers, the full card and a compact pill,
  cross-faded by `useCompactOnScroll` (compact on scroll down, full on scroll up, at the top or on tap).
- `components/basicSharedComponents/`: `TintedCard` / `UserCard` (the card look), `BottomTray` (draggable users sheet
  on phones), `CardSkeleton`, `NativeSelect`.
- `src/dateFormat.ts`: all date formatting. `src/theme.ts`: palette helpers used outside the theme.

## Conventions

- **Hebrew, RTL UI.** The theme sets `direction: 'rtl'` and containers use `dir="rtl"`, but there is no RTL style plugin
  (`stylis-plugin-rtl`), so MUI does **not** mirror left/right styles. `ml`/`mr`, `left`/`right` and built-in margins
  like `Button`'s `startIcon` stay physical. Space things with `gap` or logical properties (`marginInlineStart`), and
  remember the first flex child sits on the right.
- **Direct MUI imports** in new or touched files: `import Box from '@mui/material/Box'`,
  `import Today from '@mui/icons-material/Today'`, not the `@mui/material` / `@mui/icons-material` barrels.
- **State** lives in MobX stores (`src/stores/`, `makeAutoObservable`, exported as singletons). Components that read
  them are wrapped in `observer`.
- **API calls** that need auth go through `authFetch` (`src/api.ts`).
- **Admin-only UI** is hidden with `authStore.isAdmin()`; actions also re-check it and call
  `notificationStore.showUnauthorizedError()`.
- **User colors** come from `stringToColor(name)` (`components/shiftTable/ShiftTable.tsx`); pending items use
  `theme.palette.secondary.main`. Show a user with `UserCard` (`components/basicSharedComponents/`), passing
  `subtitle` for the context line (the shift's preset, the constraint type).
- **Dialogs** are built on `CommonDialog` (`components/dialogs/`): icon, title, one-line `description`, an action-named
  `confirmLabel`, and `danger` for destructive actions. It sets `dir="rtl"` itself, since dialogs render in a portal
  outside the app's RTL containers. Use `DialogTextField` and `DialogSelect` (labels above the field) inside them.
- **Pickers use `NativeSelect`**, not MUI's `Select`, so phones open their own picker (iOS's native one). Keep it that
  way when restyling.
- Hoist static `sx` objects to module level; use ternaries, not `&&`, for conditional JSX.

## Design

- **Mobile first.** Screen space on phones is precious: keep chrome slim (the top bar is ~56px) and don't add
  persistent UI that pushes the table down. `md` is the layout breakpoint: below it the shift table goes vertical and the
  user list moves into `BottomTray`. On desktop, cap and center small panels (the calendar navigation is 600px max).
- **Colors** come from the theme palette (`App.tsx`) and `src/theme.ts` (`primaryGradient`); don't hard-code hex values in
  components. User card colors (`stringToColor`), the pending color (`secondary`) and error/warning/success (constraint
  cards) are deliberately left alone when changing the palette.
- **Type:** Rubik (`@fontsource-variable/rubik`, imported in `index.tsx`) for Hebrew and Latin alike. Fonts are bundled
  from npm, not loaded from a CDN, so the app makes no third-party requests.
- **Buttons** get their look from the theme (`MuiButton` in `App.tsx`), so don't restyle them per page: use
  `variant="contained"` for the primary action (purple gradient), `variant="contained" color="error"` for destructive
  ones, and `variant="outlined" color="inherit"` for secondary ones. Icons and spacing between buttons use `gap`, never
  `ml`/`mr`. Icon buttons are 36–40px rounded squares with a `divider` outline.
- **Surfaces:** rounded `Paper` (`borderRadius: 3`) with a thin `divider` border. A tinted item uses its color at
  ~12–16% alpha for the fill and ~60% for the border (see `UserCard`).
- **Motion** only answers an action (opening, expanding, switching). Use `cubic-bezier(0.2, 0.9, 0.3, 1)` and turn it off
  under `prefers-reduced-motion`.
- **Copy:** Hebrew, sentence-like and plain. Buttons name what they do ("מחק", "שבץ", "אפס משמרות"), not "אישור".
  Don't start a sentence with a Latin name (usernames are Latin), since the mixed direction reads wrong; put it inside
  the sentence. Form labels go above inputs.

## iPhone Safari

Learned the hard way; each of these caused a real bug or choppiness on an iPhone that desktop Chrome never showed.

- **Animate only `transform` and `opacity`, as CSS transitions.** Driving an animation frame by frame from scroll events
  in JS lags behind iOS's separate scrolling thread and looks choppy however cheap each frame is (tried and dropped for
  the compact navigation). Animating layout properties (padding, height, font size) or `backdrop-filter` is also too
  heavy.
- **Scroll positions include Safari's own movement**: the overscroll bounce past the top and bottom, and the toolbars
  collapsing or expanding (window height changes, sometimes without a `resize` event). `useCompactOnScroll` only counts
  scrolling the finger caused and clamps to the live range; keep that if you add scroll-driven behavior.
- **Cancelling page scroll** needs a native `touchmove` listener with `{passive: false}`: React's touch listeners are
  passive. Only cancel once a gesture is decided (see `useWeekSwipe`); cancelling a touch's first move blocks scrolling
  for the whole touch.
- **`html, body { overflow-x: clip }`** (in `index.css`) keeps content that slides past the edge from widening the
  page, which made Safari shift fixed elements like the tray. `clip`, not `hidden`, so `position: sticky` still works.
- **ResizeObserver callbacks that change layout** write in `requestAnimationFrame`, or the dev overlay shows "ResizeObserver
  loop completed with undelivered notifications".

## Performance

Found by profiling tab switches; keep these when touching the shift and constraint tables.

- Per-cell lookups go through computed maps in the stores (`ShiftStore.getAssignedOrPendingShift`,
  `ConstraintStore.getConstraintsOfShift`), never by scanning or `concat`-ing the full lists in each cell.
- Shifts and constraints are always fetched with `?weekOffset=` (the server returns a 5-week window around it), never
  the whole history. Each tab fetches its own data when the week changes; a week next to the loaded center shows
  immediately while the re-centering fetch runs, and only the newest request may update the store.
- Format dates only through `src/dateFormat.ts` (formatters created once), never `toLocaleDateString` in render: it
  builds a new formatter per call and was the biggest JS cost of the table. React keys for days use `dateKey`.
- Tabs must not read fast-changing store state while rendering (the week, fetch flags): that re-renders the whole tab,
  tray and dialogs included. Start fetches with a MobX `reaction`, and pass functions (`isLoading`, `isWeekLoaded`) that
  the table reads itself, so only the table re-renders.
- Don't define components inside components (it remounts their whole subtree every render).
- The theme in `App.tsx` stays memoized, route changes run in `startTransition`, and `useMediaQuery` gets
  `{noSsr: true}` to skip its extra render.
