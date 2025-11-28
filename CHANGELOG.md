# Changelog

All notable changes to the "Gemini Commits" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

