# GitHub Pages Setup Guide

## Automatic Deployment

This project is configured with GitHub Actions to automatically deploy to GitHub Pages on every push to the `main` branch.

### Prerequisites

1. Repository must be public (free tier requirement for GitHub Pages)
2. Main branch should be the default branch

### Configuration Steps

1. **Go to GitHub Repository Settings:**
   - Navigate to Settings → Pages
   - Under "Build and deployment" section
   - Select "GitHub Actions" as the source

2. **That's it!** 
   - The workflow (`.github/workflows/deploy.yml`) will automatically:
     - Build the project with `GITHUB_PAGES=true` flag
     - Set the base path to `/jeeplaner/`
     - Deploy to `https://dakshsoumyagoat.github.io/jeeplaner/`

### Environment Variables

- `GITHUB_PAGES=true` - Set during build to enable GitHub Pages base path
- This ensures the app is built with the correct base path `/jeeplaner/`

### Troubleshooting

**If deployment fails:**
1. Check the workflow logs in GitHub Actions tab
2. Ensure all dependencies are installed (Bun is used in CI)
3. Verify the build completes successfully locally: `bun run build`

**If the app shows 404 or assets fail to load:**
1. Verify GitHub Pages is enabled in repository settings
2. Check that the base path is being applied correctly
3. Clear browser cache and do a hard refresh (Ctrl+Shift+R)
4. Check browser console for detailed error messages

**Custom Domain:**
- If you use a custom domain, update `vite.config.ts`:
  - Change `base: process.env.GITHUB_PAGES ? '/jeeplaner/' : '/'` 
  - To: `base: '/'` 
  - (assumes custom domain points to root)

## Local Testing

To test the build locally:

```bash
# Standard build
bun run build

# GitHub Pages build (with base path)
bun run build:github-pages

# Preview built app
bun run preview
```

## Workflow Details

- **Trigger:** Push to `main` branch or pull requests
- **Node Version:** 20
- **Package Manager:** Bun
- **Build Output:** `./dist` directory
- **Deployment:** Automatic via `actions/deploy-pages@v4`
