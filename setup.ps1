# Tsa Kasi Deliveries - Quick Start Script
# Run this script to set up your development environment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Tsa Kasi Deliveries - Setup Script  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm installation..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ npm installed: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ npm not found." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing dependencies..." -ForegroundColor Cyan
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Set up your Supabase project:" -ForegroundColor Yellow
    Write-Host "   - Go to https://supabase.com/" -ForegroundColor White
    Write-Host "   - Create a new project" -ForegroundColor White
    Write-Host "   - Run the SQL schema from supabase/schema.sql" -ForegroundColor White
    Write-Host "   - Create storage buckets: store-logos, product-images" -ForegroundColor White
    Write-Host ""
    
    Write-Host "2. Update .env.local with your credentials:" -ForegroundColor Yellow
    Write-Host "   - NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor White
    Write-Host "   - NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor White
    Write-Host ""
    
    Write-Host "3. Start the development server:" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "4. Open your browser:" -ForegroundColor Yellow
    Write-Host "   http://localhost:3000" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "📚 Documentation:" -ForegroundColor Cyan
    Write-Host "   - README.md - Project overview" -ForegroundColor White
    Write-Host "   - SETUP_GUIDE.md - Detailed setup instructions" -ForegroundColor White
    Write-Host "   - DATABASE_SCHEMA.md - Database reference" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Ready to start building! 🚀" -ForegroundColor Green
    Write-Host ""
    
    # Ask if user wants to start dev server
    $startServer = Read-Host "Would you like to start the development server now? (Y/N)"
    if ($startServer -eq 'Y' -or $startServer -eq 'y') {
        Write-Host ""
        Write-Host "Starting development server..." -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
        Write-Host ""
        npm run dev
    }
} else {
    Write-Host ""
    Write-Host "✗ Installation failed. Please check the errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "- Try: npm install --legacy-peer-deps" -ForegroundColor White
    Write-Host "- Delete node_modules folder and try again" -ForegroundColor White
    Write-Host "- Make sure you have Node.js 18 or higher" -ForegroundColor White
    Write-Host ""
    exit 1
}
