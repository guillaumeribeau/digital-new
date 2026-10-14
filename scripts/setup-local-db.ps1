$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
npm run db:setup:local
if ($LASTEXITCODE -ne 0) {
    Write-Host 'La configuration a échoué. Vous pouvez relancer npm run db:setup:local.' -ForegroundColor Yellow
}
Read-Host 'Appuyez sur Entrée pour fermer cette fenêtre'
