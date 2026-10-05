# Malco AI Fluency

Password-protected static site for the Malco AI Fluency proposal, hosted on GitHub Pages.

## How it works

`index.html` contains the proposal encrypted with AES-256-GCM. The key is derived in the
browser from the password (PBKDF2-SHA256, 600k iterations). Nothing readable is stored in
this repo, so the repository and the Pages site can both be public. Once a visitor unlocks
the page, the derived key is kept in `sessionStorage` so reloads in the same tab do not
re-prompt.

The unencrypted source lives in `src/` and is git-ignored on purpose. Keep a copy of it
outside the repo.

## Publishing

1. Settings → Pages → Build and deployment → Source: **Deploy from a branch**.
2. Pick the branch and the `/ (root)` folder. `.nojekyll` is present so Pages serves the
   file as is.

## Rebuilding (new content or new password)

```sh
PAGE_PASSWORD='the password' node build.mjs src/malco-ai-fluency.html index.html
```

Requires Node 20+. Commit and push the regenerated `index.html`. The password itself is
never written to the repo; share it with readers out of band.
