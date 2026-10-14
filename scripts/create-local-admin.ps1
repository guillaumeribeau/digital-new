$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
Write-Host 'La base locale est connectee. Choisissez votre adresse e-mail, votre nom et votre mot de passe administrateur (14 caracteres minimum).'
Write-Host 'Le mot de passe ne sera pas affiche pendant la saisie.'
npm run admin:create
Read-Host 'Appuyez sur Entree pour fermer cette fenetre'
