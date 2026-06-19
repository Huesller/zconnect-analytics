param(
  [ValidateSet("setup", "update-fast", "rebuild-catalog", "dev", "build")]
  [string]$Action = "dev"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

switch ($Action) {
  "setup" {
    npm install
    npm --prefix .\legacy\CatalogoPremium install
    Write-Host "Setup concluído."
  }
  "update-fast" {
    npm run update-fast
    Write-Host "Atualização diária concluída."
  }
  "rebuild-catalog" {
    npm run rebuild-catalog
    Write-Host "Reconstrução completa concluída."
  }
  "dev" {
    npm run dev
  }
  "build" {
    npm run build
    Write-Host "Build concluído."
  }
}
