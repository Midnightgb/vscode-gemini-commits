# 🚀 Quick Start Guide

## What is Gemini Commits?

A VS Code extension that uses Google's Gemini AI to automatically generate conventional commit messages by analyzing your staged git changes.

## Installation

### For Local Testing

**Option 1: Install VSIX Package**
```bash
code --install-extension gemini-commits-0.1.0.vsix
```

**Option 2: Development Mode**
1. Open this folder in VS Code
2. Press `F5`
3. A new VS Code window opens with the extension loaded

## Setup (First Time)

### 1. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy it

### 2. Configure the Extension

1. In VS Code, press `F1`
2. Type: `Gemini Commits: Set API Key`
3. Paste your API key
4. Done! The key is stored securely

## Usage

### Basic Flow

1. **Make changes** to your code
2. **Stage changes** using Source Control view or `git add`
3. **Generate commit**:
   - Click the ✨ sparkle button in Source Control, OR
   - Press `F1` → `Generate Commit with Gemini`
4. **Review** the generated message
5. **Edit** if needed
6. **Confirm** to commit

### Example

**Your changes:**
```diff
+ function calculateTotal(items) {
+   return items.reduce((sum, item) => sum + item.price, 0);
+ }
```

**Generated commit:**
```
feat(utils): add calculateTotal function
```

## Configuration

Open VS Code Settings (`Ctrl + ,`) and search for "gemini commits":

### Language
- **English** (default): Commit messages in English
- **Spanish**: Mensajes de commit en español

### Model
- **gemini-pro** (default): Fast and efficient
- **gemini-1.5-pro**: More advanced (if available)

## Features

✅ **Automatic Analysis**: AI reads your git diff  
✅ **Conventional Commits**: Follows industry standard  
✅ **Multiple Languages**: English and Spanish support  
✅ **Editable Messages**: Full control before committing  
✅ **Secure**: API keys stored in VS Code SecretStorage  
✅ **SCM Integration**: Button directly in Source Control view  

## Commit Types Generated

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add login system` |
| `fix` | Bug fix | `fix: resolve memory leak` |
| `docs` | Documentation | `docs: update API guide` |
| `style` | Code formatting | `style: fix indentation` |
| `refactor` | Code restructuring | `refactor: simplify validation` |
| `perf` | Performance | `perf: optimize queries` |
| `test` | Tests | `test: add unit tests` |
| `chore` | Maintenance | `chore: update dependencies` |

## Troubleshooting

### "No staged changes found"
→ Stage your files first: `git add <files>`

### "Invalid API key"
→ Run `Gemini Commits: Set API Key` and enter a valid key

### Extension not visible
→ Make sure you're in a Git repository

### API quota exceeded
→ Check your usage at [Google AI Studio](https://makersuite.google.com/)

## Tips

💡 **Stage related changes together** for better commit messages  
💡 **Review and edit** the AI suggestion before committing  
💡 **Use scopes** - AI will suggest them when appropriate: `feat(auth): ...`  
💡 **Split large changes** into multiple commits for better messages  

## Next Steps

- Read [TESTING.md](TESTING.md) for comprehensive testing scenarios
- Read [PUBLISHING.md](PUBLISHING.md) to publish to VS Code Marketplace
- Customize settings in VS Code preferences

## Support

Need help? Check:
- Full documentation: [README.md](README.md)
- Testing guide: [TESTING.md](TESTING.md)
- Publishing guide: [PUBLISHING.md](PUBLISHING.md)

---

**Happy committing! 🎉**

