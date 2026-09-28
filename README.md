# Page234

Clickable prototype of the Page234 app, built from the **High Fidelity Designs** page of the Page234 Figma file.

**Live:** https://goooddy.github.io/Page/

On a computer, the phone sits beside a list of every screen (sections 01–12) so you can jump to any of them. On a phone, the app fills the screen.

## Demo accounts

All four use the password `bookclub24` and the same Figma user; only the plan differs.

| Email | Plan |
| --- | --- |
| free@example.com | Free |
| trial@example.com | Premium trial, 5 days left |
| trialended@example.com | Trial just ended (opens the "choose which 3 stay" sheet) |
| premium@example.com | Premium |

samuel@example.com, the account in the sign-up and log-in screens, accepts any password.

## Run locally

```bash
npm install
npm run dev
```

`npm run build` writes the static site to `dist/`. Every push to `main` rebuilds it and publishes it to the `gh-pages` branch.
