# Version Management

Version is centralized in `js/version.js` as the single source of truth.

## Updating the Version

To bump the version, only update `js/version.js`:

```javascript
export const VERSION = {
  app: '1.0.5',           // <-- Change this
  buildDate: '2025-10-25',
  gitCommit: 'abc1234'
};
```

Then run:

```bash
node generate-manifest.js
```

This will automatically update `manifest.json` with the new version.

## Files that use VERSION

1. **js/version.js** - Source of truth ✅ EDIT THIS
2. **manifest.json** - Auto-generated (run `node generate-manifest.js`)
3. **sw.js** - Imports from version.js
4. **index.html** - Dynamically updated by app.js

## What gets updated automatically:

- Service worker cache name: `mots-v{version}`
- Help modal version display
- Console logging
- Diagnostic info output
- Manifest version field

## Before deploying:

1. Update version in `js/version.js`
2. Run `node generate-manifest.js`
3. Commit both files
4. Deploy
