# build.ps1 - Script to build the VSIX relatively to the root of the project
cd ..

Write-Host "Building VSIX..." -ForegroundColor Yellow
# Clean previous builds
if (Test-Path gemini-commits-*.vsix) { Remove-Item gemini-commits-*.vsix }

# Ensure dependencies are present
New-Item -ItemType Directory -Force -Path "dist/node_modules/@google" | Out-Null
Copy-Item -Recurse -Force "node_modules/@google/generative-ai" "dist/node_modules/@google/generative-ai"

# Build the VSIX
npx @vscode/vsce package --no-dependencies

Write-Host "✅ VSIX built successfully!" -ForegroundColor Green