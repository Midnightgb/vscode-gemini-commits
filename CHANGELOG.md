# Changelog

All notable changes to the "Gemini Commits" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

