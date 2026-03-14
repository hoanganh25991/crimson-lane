# Project rules — SDLC and docs

All progress is tracked in **docs/index.md**. Follow this workflow for every implementation task.

## Before writing any code

1. **Read `docs/index.md`** — check Done, Requirements Plan, and Backlog. Confirm the task is in scope.
2. **Read the relevant spec** — plan.md, heroes.md, theme.md, or menu.md as needed.
3. If the task is not in Requirements Plan or Backlog, confirm with the user.

## After implementing

1. **Update `docs/index.md`** immediately:
   - Completed item → move to **Done** with description.
   - Partial completion → update Requirements Plan with what remains.
   - New work not previously listed → add to **Done**.
2. **Keep specs and code aligned** — if code diverges from a spec, update one or the other.

## Docs files

| File | Content |
|------|---------|
| `docs/index.md` | SDLC hub — Done / Requirements Plan / Backlog |
| `docs/plan.md` | Game rules & systems spec |
| `docs/heroes.md` | Hero geometry, stats, skills |
| `docs/theme.md` | Visual/audio theme |
| `docs/menu.md` | Menu flow |
| `docs/brief.md` | Original brief |
