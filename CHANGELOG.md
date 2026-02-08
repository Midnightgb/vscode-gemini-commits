# Changelog

All notable changes to the "Gemini Commits" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-02-07

### Added
- 🎯 **Context-Aware Analysis**: The extension now analyzes actual code changes, not just file names
  - Parses git diffs into structured file changes with detailed code analysis
  - Identifies function/component additions, modifications, and deletions
  - Understands relationships between changes across different files
  - Detects patterns like refactorings, renamings, and systematic changes
  - Recognizes impact: API changes, breaking changes, user-facing features
- 📦 **Smart Large Diff Handling**: Automatically handles large commits with intelligent summarization
  - Auto-detects large commits (50+ files, 500+ changes, or 15000+ tokens)
  - Generates compact summaries showing only key changes
  - Includes statistics (files changed, insertions, deletions)
  - Limits displayed lines per file to most relevant changes (configurable)
  - Focuses on high-level purpose and functional impact
- **New Functions**:
  - `parseDiff()`: Parses git diff into structured file changes
  - `calculateDiffStats()`: Calculates aggregate statistics from parsed diff
  - `isLargeDiff()`: Determines if a diff needs special handling
  - `generateCompactDiffSummary()`: Creates compact summary for large diffs
  - `processDiffIntelligently()`: Main intelligent diff processing function
- **New Interfaces**:
  - `FileChange`: Represents changes in a single file with detailed metadata
  - `CodeChange`: Represents individual code line changes
  - `DiffStats`: Aggregate statistics for entire diff

- **Multi-Repository Support**: Correctly targets the active repository in multi-root workspaces
  - SCM title button now passes the `SourceControl` context to identify which repo was clicked
  - New `matchRepository()` pure function matches repositories by `rootUri`
  - Quick pick fallback when invoked from Command Palette with multiple repos open
  - `getStagedDiff()`, `setCommitMessage()`, and `stageAllChanges()` now accept an explicit repository parameter

### Changed
- **Enhanced Prompt System**: Updated prompts to emphasize context-aware analysis
  - Added guidelines for analyzing actual code vs just filenames
  - Includes special instructions for large commits
  - Emphasizes functional impact and purpose of changes
- **Improved Model Instructions**: Added specific rules for AI analysis
  - Identify PURPOSE of changes
  - Understand RELATIONSHIPS between files
  - Detect PATTERNS in modifications
  - Recognize IMPACT on the codebase
  - Ignore trivial changes (whitespace, formatting)

### Fixed
- **Multi-Repo Bug**: Clicking "Generate Commit" on any repository in a multi-root workspace no longer always uses the first repository's staged changes

### Improved
- **Better Commit Quality**: Context-aware analysis produces more accurate and meaningful commit messages
- **Performance**: Large commits are processed more efficiently with compact summaries
- **Token Usage**: Automatic optimization reduces token consumption for large changes
- **User Experience**: Users are notified when large commits are being summarized

## [0.2.0] - 2025-12-10

### Added
- **Dynamic Model Selection**: New `Gemini Commits: Select Model` command to interactively choose from all available Gemini models
- **Automatic Model Listing**: Extension now fetches available models directly from Gemini API
- **Smart Model Filtering**: Automatically excludes specialized models (embeddings, image/video generation, TTS, robotics, etc.)
- **Intelligent Fallback**: Automatically uses best available model when configured model is not found
- **Enhanced Error Messages**: Detailed error reporting with specific guidance for different error types:
  - Invalid API Key detection
  - Permission denied errors
  - Rate limiting and quota exceeded (RPM/TPM/daily limits)
  - Model not found errors
  - Connection errors
  - Invalid argument errors

### Changed
- **Default Model**: Changed from `gemini-2.5-pro` to `gemini-flash-latest` for automatic updates to latest stable version
- **Model Configuration**: Removed hardcoded model enum, now supports any available model dynamically
- **Error Messages**: Improved clarity and actionability of all error messages
- **Model Priority**: Updated automatic model selection to prioritize `gemini-flash-latest` and other stable releases

### Fixed
- Model name changes no longer break the extension - automatic fallback handles missing models
- Better error reporting prevents misleading "quota exceeded" messages when the actual issue is different

## [0.1.3] - 2025-11-28

### Fixed
- Added request blocking to prevent concurrent commit generations
- Users now see a warning message if they try to generate a commit while another is already in progress
- Prevents unnecessary token consumption from spam clicking the generate button

## [0.1.2] - 2025-11-26

### Hotfix
- Bug fix: nul file was included in the extension

## [0.1.1] - 2025-11-26

### Fixed
- Token counting accuracy: Now uses Gemini's official `countTokens` API for exact token counts
- Replaced inaccurate estimation formula that underestimated by up to 3.3x
- Token limit warnings now display actual token count instead of "approximately"

### Changed
- Improved fallback token estimation from 1.5 chars/token to 2.5 chars/token
- More conservative estimation for code/diffs with special characters

## [0.1.0] - 2025-11-12

### Added
- Initial release
- AI-powered commit message generation using Gemini AI
- Support for Conventional Commits 1.0.0 specification
- Multi-language support (English and Spanish)
- Secure API key storage using VS Code SecretStorage
- SCM integration with quick access button
- Command palette integration
- Editable commit messages with user confirmation
- Configuration options for language and model selection

