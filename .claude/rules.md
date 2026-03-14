# Project rules — SDLC and docs

Implementation in this repo is tracked with **docs** as the SDLC. Specs and progress live in docs; keep them in sync with code.

## Rule: Track implementation in docs

1. **docs/index.md** is the SDLC hub. Use it to see:
   - What’s **Done** (implemented)
   - What’s **WIP / to finish** (with tags)
   - What’s **Backlog** (future)

2. **Before implementing:** Read the relevant spec in docs (e.g. plan.md, heroes.md) and docs/index.md Plan section. Implement only what is in scope or specified.

3. **After implementing or changing scope:**
   - Update **docs/index.md**:
     - Add or move completed work under **Done**.
     - Add or move in-progress work under **WIP / to finish** with correct tags.
     - Keep **Backlog** and **Backlog by category** in sync.
   - If code and spec diverge, update either the spec or the code and note the change.

4. **Specs:** Requirements and design live in docs (plan.md, brief.md, heroes.md, theme.md, menu.md). Implementation should reflect these; any deliberate deviation should be documented.

## Entry point

Always use **docs/index.md** to see current state and which spec applies. Keep its Plan section (Done · WIP · Backlog) and tags up to date when you ship or change features.
