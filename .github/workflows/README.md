# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automating the build and publishing process of the i18n-gettext VS Code extension.

## Available Workflows

### 1. Build and Test (`build.yml`)

This workflow runs on every push to the `main` branch and on pull requests targeting the `main` branch.

**What it does:**
- Checks out the code
- Sets up Node.js and pnpm
- Installs dependencies
- Runs linting and type checking
- Builds the extension
- Packages the extension as a VSIX file
- Uploads the VSIX file as an artifact

### 2. Publish Extension (`publish.yml`)

This workflow runs when a new tag with the format `v*` is pushed (e.g., `v1.0.0`).

**What it does:**
- Checks out the code
- Sets up Node.js and pnpm
- Installs dependencies
- Runs linting and type checking
- Builds the extension
- Packages the extension
- Publishes the extension to the Visual Studio Marketplace
- Creates a GitHub Release with the VSIX file attached

## Required Secrets and Permissions

To use the publish workflow, you need to set up the following secret in your GitHub repository:

- `VSCE_PAT`: A Personal Access Token for the Visual Studio Marketplace. You can generate this token from [Azure DevOps](https://dev.azure.com/).

### GitHub Token Permissions

The publish workflow requires specific permissions to create GitHub releases. These permissions are configured in the workflow file:

```yaml
permissions:
  contents: write # This is required for creating releases
```

This grants the GitHub Actions workflow the necessary permissions to create releases and upload assets.

## How to Use

### Publishing a New Version

1. Update the version in `package.json`
2. Commit your changes
3. Create and push a new tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. The publish workflow will automatically run and publish your extension

### Testing the Build Process

Simply push to the `main` branch or create a pull request. The build workflow will run automatically.

## Troubleshooting

If a workflow fails, check the GitHub Actions logs for details. Common issues include:

- Missing secrets
- Linting or type checking errors
- Build failures
- Permission issues (e.g., "Resource not accessible by integration" error when creating releases)

For more information on GitHub Actions, see the [official documentation](https://docs.github.com/en/actions).
