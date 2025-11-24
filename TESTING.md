# Testing Guide

## Installation for Testing

### Option 1: Install from VSIX

1. Open VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Extensions: Install from VSIX"
4. Select the `gemini-commits-0.1.0.vsix` file
5. Reload VS Code when prompted

### Option 2: Development Mode (F5)

1. Open this project folder in VS Code
2. Press `F5` to launch Extension Development Host
3. A new VS Code window will open with the extension loaded

## Test Scenarios

### 1. First-Time Setup (No API Key)

**Steps:**
1. Open a Git repository
2. Stage some changes
3. Click the sparkle icon in Source Control or run "Generate Commit with Gemini"
4. You should be prompted to set your API Key

**Expected Result:**
- Extension asks if you want to set API key
- Input box appears to enter API key
- Key is stored securely

### 2. Generate Commit (Happy Path)

**Steps:**
1. Make some changes to files
2. Stage the changes (git add)
3. Click sparkle icon in Source Control view
4. Wait for AI to generate message
5. Review and edit if needed
6. Click "Commit"

**Expected Result:**
- Progress notification appears
- Commit message is generated following conventional commits format
- Message appears in input box for editing
- Confirmation dialog appears
- Commit is created successfully

### 3. No Staged Files

**Steps:**
1. Ensure no files are staged
2. Try to generate commit

**Expected Result:**
- Warning message: "No staged changes found. Please stage your changes first."

### 4. Invalid API Key

**Steps:**
1. Set an invalid API key (random string)
2. Stage changes
3. Try to generate commit

**Expected Result:**
- Error message about invalid API key

### 5. Language Configuration

**Steps:**
1. Open VS Code Settings
2. Search for "gemini commits"
3. Change language to "es" (Spanish)
4. Generate a commit

**Expected Result:**
- Commit message is generated in Spanish

**Test Again:**
1. Change language back to "en" (English)
2. Generate another commit

**Expected Result:**
- Commit message is generated in English

### 6. Command Palette Access

**Steps:**
1. Press `F1` or `Ctrl+Shift+P`
2. Type "Gemini"
3. You should see:
   - "Generate Commit with Gemini"
   - "Gemini Commits: Set API Key"

**Expected Result:**
- Both commands appear and are functional

### 7. Edit Generated Message

**Steps:**
1. Generate a commit message
2. Modify the message in the input box
3. Confirm the commit

**Expected Result:**
- Your edited message is used for the commit

### 8. Cancel Operation

**Steps:**
1. Generate a commit message
2. When asked to confirm, click "Cancel"

**Expected Result:**
- No commit is created
- No error is shown

### 9. Different Commit Types

Test with different types of changes:

**Feature:**
- Add a new function
- Expected: `feat: add ...` or `feat(scope): add ...`

**Bug Fix:**
- Fix a bug
- Expected: `fix: resolve ...` or `fix(scope): resolve ...`

**Documentation:**
- Update README
- Expected: `docs: update ...` or `docs(readme): update ...`

**Refactor:**
- Rename variables, restructure code
- Expected: `refactor: ...` or `refactor(scope): ...`

**Style:**
- Format code, fix indentation
- Expected: `style: ...` or `style(scope): ...`

### 10. Model Configuration

**Steps:**
1. Open VS Code Settings
2. Search for "gemini commits model"
3. Try different models (e.g., "gemini-1.5-pro")
4. Generate commits

**Expected Result:**
- Extension uses the configured model

## Known Limitations

1. **pnpm Dependencies**: Due to pnpm's unique node_modules structure, the VSIX package might need dependencies installed separately. If you encounter module errors, consider using the F5 development mode.

2. **API Rate Limits**: Gemini API has rate limits. If you hit them, you'll see an error message.

3. **Large Diffs**: Very large diffs might exceed Gemini's token limits. Consider committing changes in smaller batches.

## Troubleshooting

### Module Not Found Error

If you see errors about missing modules when installing from VSIX:

1. Try using Development Mode (F5) instead
2. Or bundle the extension with esbuild (see package.json improvements)

### API Key Not Persisting

- API keys are stored in VS Code's SecretStorage
- They persist across sessions
- Use "Gemini Commits: Set API Key" to update

### Extension Not Appearing in Source Control

- Ensure you're in a Git repository
- The sparkle icon only appears when `scmProvider == git`
- Try reloading VS Code

## Reporting Issues

If you find any issues during testing:

1. Check the Output panel (View > Output > Gemini Commits)
2. Check the Developer Console (Help > Toggle Developer Tools)
3. Note the exact steps to reproduce
4. Include error messages and VS Code version

