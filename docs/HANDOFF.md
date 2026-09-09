# Embedded reader guide

Branch: `feat/embedded-guide`.
Worktree: `/Users/brandyn.schult/code/minerva-embedded-guide`.
Base: `7d5c699` (`origin/main` at task start).

## Outcome
Guide sits immediately before Menu at the top right of the root atlas.
It opens a nonmodal panel with a worked mall example and seven expandable chapters.
Content explains connections, navigation, views, tools, Talk scope, judgment and saving.
Opening preserves selection and camera; Escape/Close returns focus to Guide.
Header controls wrap at intermediate widths to remain visible.
No backend changes or provider requests. Owner authorized commit, merge and deployment.

## Evidence
`npm run check` passed lint, typecheck, repository tests and production build.
In-app checks covered selection/camera preservation, chapter expansion,
Escape, close-button focus return, Menu access and Guide/Menu switching.
Desktop and 390px mobile layouts were inspected; intermediate wrapping corrected.
Full generation replay, physical touch and screen-reader testing were not run.

## Startup and next role
Production preview: http://127.0.0.1:3072/.
From this worktree, use the Node/npm launcher in AGENTS.md:
`npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run start -- --port 3072`
Release target: https://minerva-eight.vercel.app/.
Next role: owner reviews the deployed guide after release verification.
