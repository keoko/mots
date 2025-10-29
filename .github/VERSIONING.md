# Automated Versioning & Release Process

This project uses automated semantic versioning through GitHub Actions. No more manual version bumps!

**Current Version:** The version is displayed in the app footer and automatically updated on each deployment.

## How It Works

### 1. Conventional Commits

Use these commit message prefixes to automatically determine version bumps:

- **`fix:`** - Bug fixes → Patch version bump (1.0.0 → 1.0.1)
  ```
  fix: correct letter spacing in keyboard
  fix: resolve issue with guessed letters display
  ```

- **`feat:`** - New features → Minor version bump (1.0.0 → 1.1.0)
  ```
  feat: add animals topic
  feat: implement study mode toggle
  ```

- **`feat!:`** or **`BREAKING CHANGE:`** - Breaking changes → Major version bump (1.0.0 → 2.0.0)
  ```
  feat!: restructure data format for topics

  BREAKING CHANGE: topic data structure now requires 'difficulty' field
  ```

- **`chore:`, `docs:`, `style:`, `refactor:`** - No version bump
  ```
  chore: update README
  refactor: simplify game state logic
  ```

### 2. Automatic Process

When you push to `main`:

1. **Version Calculation**: GitHub Action analyzes commits since last release
2. **Version Injection**: Replaces `%%VERSION%%` in `index.html` with actual version
3. **Git Tag**: Creates a new git tag (e.g., `v1.2.3`)
4. **GitHub Release**: Creates release with auto-generated changelog
5. **Deployment**: Deploys to GitHub Pages with new version

### 3. Version Display

The version appears in the footer of the app. Users can check if they have a stale cached version.

## Migration from Manual Versioning

### Old Way ❌
```bash
# Edit package.json manually
git add package.json
git commit -m "chore: bump version to 1.0.56 [version bump]"
git push
```

### New Way ✅
```bash
# Just commit with conventional commit message
git commit -m "feat: add new topic"
git push
# GitHub Action handles the rest!
```

## Setup Requirements

### First-Time Setup

1. **Enable GitHub Pages** (if not already enabled):
   - Go to repository Settings → Pages
   - Source: "GitHub Actions"

2. **No secrets needed** - The workflow uses `GITHUB_TOKEN` which is automatically provided

### Testing Locally

To see what version would be generated:
```bash
git log --oneline  # Review recent commits
```

The action calculates version based on commit messages since the last tag.

## Examples

### Example 1: Bug Fix Release
```bash
git commit -m "fix: correct keyboard layout on mobile"
git push
# → Auto-creates v1.0.57, deploys with version in footer
```

### Example 2: New Feature
```bash
git commit -m "feat: add progress tracking"
git push
# → Auto-creates v1.1.0, deploys with version in footer
```

### Example 3: Multiple Commits
```bash
git commit -m "feat: add animals topic"
git commit -m "fix: typo in colors topic"
git commit -m "chore: update help documentation"
git push
# → Auto-creates v1.1.1 (feat bumps minor, fix bumps patch, chore ignored)
```

## Workflow File

See `.github/workflows/release.yml` for the complete workflow configuration.

## Troubleshooting

### Version not updating?
- Check commit messages follow conventional commit format
- Verify only `js/`, `css/`, or `index.html` changed (workflow ignores docs-only changes)
- Check GitHub Actions tab for workflow run details

### Wrong version number?
- The action calculates from git history
- First release will be v0.1.0 by default
- Use git tags to set initial version if needed: `git tag v1.0.0 && git push --tags`

### Deployment failed?
- Check GitHub Pages is enabled
- Verify workflow has `contents: write` permission (already configured)

## Benefits

✅ No manual version management
✅ Automatic changelog generation
✅ Clean git history (no "bump version" commits)
✅ Version visible in app for cache troubleshooting
✅ Follows semantic versioning standards
✅ GitHub releases for download/history
