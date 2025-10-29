# Version Management

Version is centralized in `js/version.js` as the **single source of truth**.

## Automatic Versioning (Git Hook)

The version is automatically bumped on every commit to `main` branch via a git hook.
The hook runs `bump-version.js` which:
1. Increments the patch version in `js/version.js`
2. Updates the version in `sw.js` (inlined, since SW can't use ES6 imports)
3. Regenerates `manifest.json`

## Manual Version Update

If you need to manually update the version, **only edit `js/version.js`**:

```javascript
export const VERSION = {
  app: '1.0.5',           // <-- Edit this
  buildDate: '2025-10-25', // <-- Edit this
  gitCommit: 'abc1234'     // <-- Edit this
};
```

Then run to sync all files:

```bash
node bump-version.js
```

## Files That Use VERSION

1. **js/version.js** - ✅ Single source of truth (EDIT THIS)
2. **sw.js** - Auto-synced by bump-version.js (inlined, can't import)
3. **manifest.json** - Auto-generated from version.js
4. **index.html footer** - Dynamically displays version from version.js
5. **help.html footer** - Dynamically displays version from version.js

## What Gets Updated:

- Service worker cache name: `mots-v{version}`
- Footer version display
- Console logging on app start
- Manifest version field
- Diagnostic info output

## Scripts:

- **bump-version.js** - Bumps version and syncs all files
- **generate-manifest.js** - Regenerates manifest.json from version.js

## Workflow:

1. Make changes to code
2. Commit to main branch
3. Git hook automatically runs `bump-version.js`
4. Version is bumped and all files are synced
5. No manual intervention needed!
