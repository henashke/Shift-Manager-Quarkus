# CLAUDE.md — web UI

React frontend (Create React App, TypeScript, MUI 7, MobX), built and served by Quinoa. See the root `CLAUDE.md` for
how it is run.

## Commands

```bash
npx tsc --noEmit -p .   # type-check
npx eslint src          # lint (CRA's react-app config)
```

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
  `shiftType` when there is a shift context to show.
- Hoist static `sx` objects to module level; use ternaries, not `&&`, for conditional JSX.
