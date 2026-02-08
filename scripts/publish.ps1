# Script to publish a new version
# Usage: .\scripts\publish.ps1 -Version "0.1.3" -Type "patch"
# Type can be: patch, minor, major

param(
    [Parameter(Mandatory=$false)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('patch', 'minor', 'major')]
    [string]$Type = 'patch'
)

Write-Host "🚀 Publishing new version..." -ForegroundColor Cyan

# 1. Verify that git is clean
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "❌ Git working directory is not clean. Commit your changes first." -ForegroundColor Red
    Write-Host "Pending changes:" -ForegroundColor Yellow
    git status --short
    exit 1
}

# 2. Get current version
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$currentVersion = $packageJson.version
Write-Host "📦 Current version: $currentVersion" -ForegroundColor Yellow

# 3. Calculate new version
if ($Version) {
    $newVersion = $Version
} else {
    $parts = $currentVersion.Split('.')
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]$parts[2]
    
    switch ($Type) {
        'major' { $major++; $minor = 0; $patch = 0 }
        'minor' { $minor++; $patch = 0 }
        'patch' { $patch++ }
    }
    
    $newVersion = "$major.$minor.$patch"
}

Write-Host "📦 New version: $newVersion" -ForegroundColor Green

# 4. Update package.json
$packageJson.version = $newVersion
$packageJson | ConvertTo-Json -Depth 100 | Set-Content "package.json"
Write-Host "✅ package.json updated" -ForegroundColor Green

# 5. Build VSIX
Write-Host "`n🔨 Building VSIX..." -ForegroundColor Cyan
Remove-Item gemini-commits-*.vsix -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path "dist/node_modules/@google" | Out-Null
Copy-Item -Recurse -Force "node_modules/@google/generative-ai" "dist/node_modules/@google/generative-ai"
npx @vscode/vsce package --no-dependencies

if (-not (Test-Path "gemini-commits-$newVersion.vsix")) {
    Write-Host "❌ Error building the VSIX" -ForegroundColor Red
    exit 1
}

Write-Host "✅ VSIX built: gemini-commits-$newVersion.vsix" -ForegroundColor Green

# 6. Commit and tag
Write-Host "`n📝 Creating commit and tag..." -ForegroundColor Cyan
git add package.json
git commit -m "chore: bump version to v$newVersion"
git tag "v$newVersion"

Write-Host "✅ Commit and tag created" -ForegroundColor Green

# 7. Ask if you want to publish
Write-Host "`n🎯 What do you want to do now?" -ForegroundColor Cyan
Write-Host "1. Push a GitHub (will publish to VS Code + OpenVSX automatically)" -ForegroundColor White
Write-Host "2. Publish manually to both marketplaces" -ForegroundColor White
Write-Host "3. Open marketplaces for manual upload" -ForegroundColor White
Write-Host "4. Save locally only" -ForegroundColor White

$choice = Read-Host "`nChoose an option (1/2/3/4)"

switch ($choice) {
    "1" {
        Write-Host "`n⬆️  Pushing to GitHub..." -ForegroundColor Cyan
        git push origin main
        git push origin --tags
        Write-Host "✅ Push completed! GitHub Actions will publish to both marketplaces." -ForegroundColor Green
        Write-Host "Check the progress at: https://github.com/Midnightgb/vscode-gemini-commits/actions" -ForegroundColor Yellow
    }
    "2" {
        Write-Host "`n📦 Publishing to marketplaces..." -ForegroundColor Cyan
        
        # Ask for tokens
        $vscePat = Read-Host "Enter your VS Code Marketplace PAT (Enter to skip)"
        $ovsxPat = Read-Host "Enter your OpenVSX PAT (Enter to skip)"
        
        if ($vscePat) {
            Write-Host "`nPublishing to VS Code Marketplace..." -ForegroundColor Yellow
            $env:VSCE_PAT = $vscePat
            npx @vscode/vsce publish --packagePath "gemini-commits-$newVersion.vsix"
            Write-Host "✅ Published to VS Code Marketplace" -ForegroundColor Green
        }
        
        if ($ovsxPat) {
            Write-Host "`nPublishing to OpenVSX (Cursor)..." -ForegroundColor Yellow
            npx ovsx publish "gemini-commits-$newVersion.vsix" -p $ovsxPat
            Write-Host "✅ Published to OpenVSX" -ForegroundColor Green
        }
        
        if (-not $vscePat -and -not $ovsxPat) {
            Write-Host "⚠️  No published to any marketplace" -ForegroundColor Yellow
        }
    }
    "3" {
        Write-Host "`n🌐 Opening marketplaces..." -ForegroundColor Cyan
        Start-Process "https://marketplace.visualstudio.com/manage/publishers/midnightgb"
        Start-Process "https://open-vsx.org/user-settings/extensions"
        Write-Host "📦 Upload the file: gemini-commits-$newVersion.vsix to both" -ForegroundColor Yellow
        Write-Host "`n⚠️  Don't forget to push after:" -ForegroundColor Yellow
        Write-Host "git push origin main" -ForegroundColor White
        Write-Host "git push origin --tags" -ForegroundColor White
    }
    "4" {
        Write-Host "`n💾 Saved locally" -ForegroundColor Green
        Write-Host "To publish later, run:" -ForegroundColor Yellow
        Write-Host "git push origin main" -ForegroundColor White
        Write-Host "git push origin --tags" -ForegroundColor White
    }
    default {
        Write-Host "❌ Invalid option" -ForegroundColor Red
    }
}

Write-Host "`n✨ Process completed!" -ForegroundColor Green

