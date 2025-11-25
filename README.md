# Gemini Commits

Generate conventional commit messages automatically using Google's Gemini AI by analyzing your staged changes.

## Features

- 🤖 **AI-Powered**: Uses Gemini AI to analyze your git diff and generate meaningful commit messages
- 📋 **Conventional Commits**: Follows the [Conventional Commits 1.0.0 specification](https://www.conventionalcommits.org/)
- 🌍 **Multi-language**: Support for English and Spanish commit messages
- ✏️ **Editable**: Review and edit generated messages before committing
- 🔒 **Secure**: API keys stored securely using VS Code's SecretStorage
- 🎯 **SCM Integration**: Quick access button in the Source Control view

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions
3. Search for "Gemini Commits"
4. Click Install

### From VSIX File

1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions
4. Click the "..." menu → Install from VSIX
5. Select the downloaded file

## Setup

### Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key

### Configure Extension

1. Open Command Palette (F1 or Ctrl+Shift+P / Cmd+Shift+P)
2. Run `Gemini Commits: Set API Key`
3. Paste your API key

## Usage

### Method 1: Source Control Button

1. Stage your changes in the Source Control view
2. Click the ✨ sparkle icon in the Source Control title bar
3. Review the generated commit message
4. Edit if needed
5. Click "Commit" to confirm

### Method 2: Command Palette

1. Stage your changes
2. Open Command Palette (F1)
3. Run `Generate Commit with Gemini`
4. Follow the prompts

## Configuration

Configure the extension in VS Code settings:

### Language

Set the language for generated commit messages:

```json
{
  "geminiCommits.language": "en" // or "es"
}
```

- `en`: English (default)
- `es`: Spanish

### Model

Choose the Gemini model to use:

```json
{
  "geminiCommits.model": "gemini-2.5-flash"
}
```

Available models:
-`gemini-2.5-flash`
-`gemini-2.5-pro` (default)
-Other Gemini models as they become available

## Conventional Commits Format

The extension generates commit messages following this format:

```
<type>[optional scope]: <description>
```

### Types

- **feat**: New feature (MINOR version bump)
- **fix**: Bug fix (PATCH version bump)
- **docs**: Documentation changes
- **style**: Code formatting
- **refactor**: Code restructuring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **build**: Build system changes
- **ci**: CI/CD configuration
- **revert**: Revert previous commit

### Scopes

Common scopes include:
- **Frontend**: components, pages, hooks, utils, styles
- **Backend**: api, auth, database, models, services
- **General**: config, deps, docker, scripts

### Examples

```
feat: add user authentication system
fix(auth): resolve JWT token expiration issue
docs(api): update authentication guide
refactor(utils): simplify date formatting functions
perf(database): optimize user queries
chore(deps): update React to v18
```

## Requirements

- VS Code version 1.85.0 or higher
- Git repository
- Gemini API key

## Troubleshooting

### "No Git repository found"

Make sure you have opened a folder that contains a Git repository.

### "No staged changes found"

Stage your changes first using `git add` or the VS Code Source Control view.

### "Invalid Gemini API key"

1. Verify your API key is correct
2. Check that your API key has not expired
3. Run `Gemini Commits: Set API Key` to update it

### "API quota exceeded"

You've reached your Gemini API usage limits. Check your [Google AI Studio quota](https://aistudio.google.com/api-keys).

## Privacy

- Your API key is stored securely using VS Code's SecretStorage API
- Your code diffs are sent to Google's Gemini API for analysis
- No data is stored or logged by this extension
