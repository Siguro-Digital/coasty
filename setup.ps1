# Coasty Automation - Setup Script for Windows PowerShell

Write-Host "🚀 Coasty Automation - Setup Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js first:" -ForegroundColor Yellow
    Write-Host "  - Visit: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "  - Download and install the LTS version" -ForegroundColor Yellow
    Write-Host "  - Restart your terminal after installation" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed." -ForegroundColor Red
    exit 1
}

# Check if Python 3 is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Python 3 is not installed." -ForegroundColor Yellow
    Write-Host "   PDF generation will not work without Python 3" -ForegroundColor Yellow
    Write-Host "   Visit: https://www.python.org/downloads/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Node.js dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎭 Installing Playwright browsers..." -ForegroundColor Cyan
npx playwright install chromium

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Failed to install Playwright browsers" -ForegroundColor Yellow
    Write-Host "   You may need to run: npx playwright install chromium" -ForegroundColor Yellow
}

# Check if Python dependencies are needed
try {
    python -c "import reportlab" 2>$null
    Write-Host ""
    Write-Host "✅ Python dependencies already installed" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "📦 Installing Python dependencies for PDF generation..." -ForegroundColor Cyan
    python -m venv venv 2>$null
    & .\venv\Scripts\Activate.ps1
    pip install reportlab --quiet 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Warning: Could not install Python PDF dependencies" -ForegroundColor Yellow
        Write-Host "   PDF generation may not work" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To run the automation, use:" -ForegroundColor Cyan
Write-Host "  npm run live" -ForegroundColor White
Write-Host ""
Write-Host "Or use the launcher script:" -ForegroundColor Cyan
Write-Host "  .\run.ps1" -ForegroundColor White
Write-Host ""

