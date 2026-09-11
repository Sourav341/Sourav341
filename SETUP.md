# Sourav341 GitHub Profile Setup

Target repository:

`Sourav341/Sourav341`

## Files

- `README.md` — profile README
- `dark.svg` — animated dark terminal profile
- `light.svg` — animated light terminal profile
- `portrait.txt` — ASCII visual source
- `portrait_tspan.txt` — generated SVG text spans
- `ascii_to_svg.py` — regenerates `portrait_tspan.txt`
- `generate.mjs` — fetches the real GitHub contribution calendar and builds the jet heatmap
- `preview-test.mjs` — local mock-data test; does not require a GitHub token
- `dist/github-jet.svg` — generated contribution heatmap
- `.github/workflows/jet-heatmap.yml` — daily GitHub Actions update
- `package.json` / `package-lock.json` — Node configuration

## Install

No npm dependencies are required.

```bash
npm run preview
```

This generates:

`dist/preview.svg`

## Generate from real GitHub data locally

PowerShell:

```powershell
$env:GH_USERNAME="Sourav341"
$env:GH_TOKEN="YOUR_GITHUB_TOKEN"
$env:OUTPUT_PATH="dist/github-jet.svg"
node generate.mjs
```

Do not commit a personal access token.

## GitHub Actions

The workflow uses the repository-provided `GITHUB_TOKEN`, so no personal token needs
to be stored as a repository secret.

It runs:

- daily at `05:30 UTC`
- manually through **Actions → Update jet heatmap SVG → Run workflow**

The workflow writes `dist/github-jet.svg` and commits it only when the generated
file changes.

## Important

This must be the public profile repository:

`Sourav341/Sourav341`

and `README.md` must remain at the repository root.

### Profile image paths

The animated jet in `README.md` uses the raw GitHub URL for `Sourav341/Sourav341/main/dist/github-jet.svg`. Make sure the `dist` folder is committed and pushed.
