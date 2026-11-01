# Elementa study app

Exported Base44 main source, integrated into the canonical Elementa repository.
The public study app is deployed with the reference site at
https://elementalearn.com/study/. The tutor remains a separate Base44 branch.

## Run and build independently

From the repository root:

```bash
npm ci
npm ci --prefix companion
npm run build
npm run preview
```

For study-app development alone:

```bash
npm --prefix companion run dev -- --config vite.deploy.config.js
```

No Base44 login, environment token or hosted backend is needed for these commands
or the non-tutor learning features. Progress and notes stay in browser storage;
the Saved screen exports/imports a validated JSON backup. Clearing that storage
removes local progress. The server does not store a learner database.

`vite.deploy.config.js` uses ordinary Vite/React with hash routing and excludes the
Base44 editor injection. The root assembly script scopes installation, icons and
offline assets to `/study/`. Unrouted authentication templates from the complete
export remain in source, but are not imported by the public app. The configured
typecheck now passes, including those template pages and their imported UI types.

## Builder workflow

Base44 can continue developing the source. GitHub synchronization is not connected;
a push here does not automatically update Base44, and a Base44 change does not
automatically deploy this site. Export its completed main branch, review changes
against this checkout, retain the independent deployment boundary, test and commit
before deploying. Keep the tutor branch out of public main until it is reviewed.

For exact Argon 4 / Max builds, select both in the browser composer and verify the
saved turn metadata. A generic CLI chat request previously selected Base 1 despite
the browser's displayed choice. Read-only CLI export/monitoring is supported.

Copyright 2025 Smolk Apps. See the repository's MIT license.
