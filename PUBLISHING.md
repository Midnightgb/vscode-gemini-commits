# Publishing to VS Code Marketplace

This guide walks you through publishing your Gemini Commits extension to the Visual Studio Code Marketplace.

## Prerequisites

### 1. Create Azure DevOps Account

1. Go to [Azure DevOps](https://dev.azure.com)
2. Sign in with your Microsoft account (create one if needed)
3. Create a new organization (if you don't have one)

### 2. Create Personal Access Token (PAT)

1. In Azure DevOps, click on your profile icon (top right)
2. Select "Personal access tokens"
3. Click "New Token"
4. Configure the token:
   - **Name**: VS Code Extension Publishing
   - **Organization**: Select your organization
   - **Expiration**: Choose duration (90 days, 1 year, or custom)
   - **Scopes**: Select "Marketplace" > "Manage"
5. Click "Create"
6. **IMPORTANT**: Copy the token immediately (you won't be able to see it again)

### 3. Create Publisher

1. Go to [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Sign in with the same Microsoft account
3. Click "Create publisher"
4. Fill in:
   - **Name**: `your-publisher-name` (must be unique, lowercase, no spaces)
   - **Display Name**: "Your Name" or "Company Name"
   - **Description**: Brief description of who you are
5. Click "Create"

## Update Package.json

Before publishing, update the `package.json`:

```json
{
  "publisher": "your-actual-publisher-name",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/vscode-gemini-commits"
  },
  "icon": "icon.png",  // Optional: add a 128x128 icon
  "homepage": "https://github.com/yourusername/vscode-gemini-commits",
  "bugs": {
    "url": "https://github.com/yourusername/vscode-gemini-commits/issues"
  }
}
```

## Install VSCE (VS Code Extension Manager)

If you haven't already:

```bash
pnpm install -g @vscode/vsce
```

## Publishing Steps

### 1. Login to VSCE

```bash
vsce login your-publisher-name
```

When prompted, paste your Personal Access Token.

### 2. Package the Extension (Optional Test)

Before publishing, test the package:

```bash
vsce package --no-dependencies
```

This creates a `.vsix` file you can test locally.

### 3. Publish to Marketplace

```bash
vsce publish --no-dependencies
```

Or, if you want to increment the version:

```bash
# Patch version (0.1.0 -> 0.1.1)
vsce publish patch --no-dependencies

# Minor version (0.1.0 -> 0.2.0)
vsce publish minor --no-dependencies

# Major version (0.1.0 -> 1.0.0)
vsce publish major --no-dependencies
```

### 4. Verify Publication

1. Go to [Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. You should see your extension listed
3. Click on it to see statistics and manage versions

## Post-Publishing

### View Your Extension

Your extension will be available at:
```
https://marketplace.visualstudio.com/items?itemName=your-publisher-name.gemini-commits
```

### Update Extension

To publish updates:

1. Make your changes
2. Update version in `package.json` or use `vsce publish [patch|minor|major]`
3. Update `CHANGELOG.md`
4. Run `vsce publish` again

### Unpublish Extension

If you need to remove the extension:

```bash
vsce unpublish your-publisher-name.gemini-commits
```

**Warning**: This is permanent and can't be undone!

## Dependency Bundling (Recommended for Production)

For a production-ready extension with pnpm, consider bundling dependencies:

### Option 1: Add esbuild

1. Install esbuild:
```bash
pnpm add -D esbuild
```

2. Update `package.json` scripts:
```json
{
  "scripts": {
    "vscode:prepublish": "pnpm run package",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "package": "node build.js",
    "vscode:package": "vsce package"
  }
}
```

3. Create `build.js`:
```javascript
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node16',
  sourcemap: false,
  minify: true
}).catch(() => process.exit(1));
```

4. Publish with bundled dependencies:
```bash
vsce publish
```

## Marketplace Best Practices

1. **Add a good README**: Clear installation and usage instructions
2. **Add screenshots**: Show the extension in action
3. **Add an icon**: 128x128 PNG file
4. **Update CHANGELOG**: Document all changes
5. **Respond to issues**: Monitor GitHub issues and marketplace Q&A
6. **Update regularly**: Fix bugs and add features based on feedback

## Common Issues

### "Error: Missing publisher name"
- Update `publisher` field in `package.json`

### "Error: Missing repository"
- Add `repository` field to `package.json`

### "Module not found" errors after installation
- Use esbuild to bundle dependencies (see above)
- Or ensure dependencies are properly included in the package

### "Unauthorized" error
- Your PAT might have expired
- Run `vsce login` again with a new PAT

## Resources

- [VS Code Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Azure DevOps Personal Access Tokens](https://docs.microsoft.com/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate)
- [Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)

---

Good luck with your publication! 🚀

