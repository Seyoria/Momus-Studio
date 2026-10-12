# Momus Studio - GitHub Otomatik Yayınlama Scripti
param(
    [string]$token = "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"
)

if (-not $token -and -not $env:GH_TOKEN) {
    Write-Host "GitHub Personal Access Token (PAT) giriniz:" -ForegroundColor Yellow
    $token = Read-Host "GH_TOKEN"
}

if ($token) {
    $env:GH_TOKEN = $token
}

if (-not $env:GH_TOKEN) {
    Write-Host "Hata: GH_TOKEN bulunamadi! Islem iptal edildi." -ForegroundColor Red
    exit 1
}

Write-Host "Momus Studio derleniyor ve GitHub Releases'e yukleniyor..." -ForegroundColor Cyan
npm run release
Write-Host "Islem tamamlandi! https://github.com/Seyoria/Momus-Studio/releases adresini kontrol edebilirsiniz." -ForegroundColor Green
