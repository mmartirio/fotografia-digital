<#
.SYNOPSIS
    Inicializa o projeto Fotografia Digital (frontend, backend e banco no Docker).

.DESCRIPTION
    1. Verifica se o Docker está rodando
    2. Cria o .env a partir do .env.example (com senha aleatória) se não existir
    3. Verifica se as portas do banco e do frontend estão livres
    4. Sobe os containers (com build) e aguarda todos ficarem saudáveis

.EXAMPLE
    .\iniciar.ps1              # sobe tudo (com build)
    .\iniciar.ps1 -Dev         # frontend em hot reload (next dev)
    .\iniciar.ps1 -SemBuild    # sobe sem reconstruir as imagens
    .\iniciar.ps1 -Logs        # sobe e acompanha os logs
    .\iniciar.ps1 -Parar       # para os containers
    .\iniciar.ps1 -Resetar     # para e APAGA banco e fotos (pede confirmação)
#>
[CmdletBinding()]
param(
    [switch]$Dev,
    [switch]$SemBuild,
    [switch]$Logs,
    [switch]$Parar,
    [switch]$Resetar,
    [int]$TimeoutSegundos = 300
)

# 'Continue': no PowerShell 5.1, 'Stop' + stderr de executáveis nativos (docker) aborta o script.
# Os erros do docker são tratados via $LASTEXITCODE.
$ErrorActionPreference = 'Continue'
Set-Location -Path $PSScriptRoot

# Modo dev: todos os "docker compose" do script passam a incluir o override de hot reload
if ($Dev) {
    $env:COMPOSE_FILE = 'docker-compose.yml;docker-compose.dev.yml'
} else {
    Remove-Item Env:COMPOSE_FILE -ErrorAction SilentlyContinue
}

function Escrever-Passo([string]$texto) { Write-Host "`n==> $texto" -ForegroundColor Cyan }
function Escrever-Ok([string]$texto)    { Write-Host "    [ok] $texto" -ForegroundColor Green }
function Escrever-Aviso([string]$texto) { Write-Host "    [!] $texto" -ForegroundColor Yellow }
function Falhar([string]$texto) {
    Write-Host "`n[ERRO] $texto" -ForegroundColor Red
    exit 1
}

function Ler-Env([string]$arquivo) {
    $valores = @{}
    foreach ($linha in Get-Content -Path $arquivo -Encoding UTF8) {
        if ($linha -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
            $valores[$Matches[1]] = $Matches[2].Trim()
        }
    }
    return $valores
}

function Valor-Ou-Padrao($valores, [string]$chave, [string]$padrao) {
    if ($valores.ContainsKey($chave) -and $valores[$chave] -ne '') { return $valores[$chave] }
    return $padrao
}

function Porta-Ocupada([int]$porta) {
    $conexoes = Get-NetTCPConnection -LocalPort $porta -State Listen -ErrorAction SilentlyContinue
    return [bool]$conexoes
}

# --- 1. Docker ----------------------------------------------------------------
Escrever-Passo 'Verificando Docker'
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Falhar 'Docker não encontrado. Instale o Docker Desktop: https://www.docker.com/products/docker-desktop'
}
docker info --format '{{.ServerVersion}}' *> $null
if ($LASTEXITCODE -ne 0) {
    Falhar 'O Docker não está respondendo. Abra o Docker Desktop, aguarde iniciar e rode o script de novo.'
}
Escrever-Ok 'Docker rodando'

# --- Parar / Resetar ----------------------------------------------------------
if ($Parar) {
    Escrever-Passo 'Parando containers'
    docker compose down
    Escrever-Ok 'Containers parados (dados preservados)'
    exit 0
}

if ($Resetar) {
    Write-Host "`nATENÇÃO: isso apaga o BANCO e TODAS AS FOTOS (volumes pgdata e fotos_data)." -ForegroundColor Red
    $resposta = Read-Host 'Digite RESETAR para confirmar'
    if ($resposta -ne 'RESETAR') { Write-Host 'Cancelado.'; exit 0 }
    docker compose down -v
    Escrever-Ok 'Containers e volumes removidos. Rode .\iniciar.ps1 para subir do zero.'
    exit 0
}

# --- 2. .env ------------------------------------------------------------------
Escrever-Passo 'Verificando .env'
if (-not (Test-Path '.env')) {
    if (-not (Test-Path '.env.example')) { Falhar '.env.example não encontrado.' }
    # Senha nova não bateria com a de um banco já inicializado
    $volumes = docker volume ls -q
    if ($volumes -contains 'fotografia-digital_pgdata') {
        Falhar 'Sem .env, mas o banco já existe (volume pgdata). Restaure o .env com a senha original ou rode .\iniciar.ps1 -Resetar.'
    }
    $senha = ([guid]::NewGuid().ToString('N')).Substring(0, 24)
    $conteudo = (Get-Content '.env.example' -Raw -Encoding UTF8) -replace '(?m)^DB_PASSWORD=.*$', "DB_PASSWORD=$senha"
    [System.IO.File]::WriteAllText((Join-Path $PSScriptRoot '.env'), $conteudo, (New-Object System.Text.UTF8Encoding($false)))
    Escrever-Ok '.env criado com senha aleatória para o banco'
    Escrever-Aviso 'Revise o .env (SMTP, SITE_URL) quando for usar e-mail ou publicar'
} else {
    Escrever-Ok '.env já existe'
}
$envValores = Ler-Env '.env'
$portaDb = [int](Valor-Ou-Padrao $envValores 'DB_PORTA_LOCAL' '5434')
$portaFront = [int](Valor-Ou-Padrao $envValores 'FRONTEND_PORTA' '3000')

# --- 3. Portas ----------------------------------------------------------------
Escrever-Passo 'Verificando portas'
$jaRodando = docker compose ps -q 2>$null
if ($jaRodando) {
    Escrever-Ok 'Projeto já está rodando: portas pertencem aos próprios containers'
} else {
    $conflitos = @()
    if (Porta-Ocupada $portaDb)    { $conflitos += "DB_PORTA_LOCAL=$portaDb" }
    if (Porta-Ocupada $portaFront) { $conflitos += "FRONTEND_PORTA=$portaFront" }
    if ($conflitos.Count -gt 0) {
        Falhar ("Porta(s) em uso por outro programa: " + ($conflitos -join ', ') + ". Altere no .env e rode de novo.")
    }
    Escrever-Ok "Portas livres (banco $portaDb, site $portaFront)"
}

# --- 4. Subir -----------------------------------------------------------------
Escrever-Passo 'Subindo containers (a primeira vez pode levar alguns minutos)'
if ($SemBuild) { docker compose up -d } else { docker compose up -d --build }
if ($LASTEXITCODE -ne 0) { Falhar 'Falha ao subir os containers. Veja as mensagens acima.' }

Escrever-Passo "Aguardando containers ficarem saudáveis (até $TimeoutSegundos s)"
$inicio = Get-Date
while ($true) {
    $ids = docker compose ps -q
    $estados = foreach ($id in $ids) {
        docker inspect --format '{{.Name}}={{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $id
    }
    $pendentes = @($estados | Where-Object { $_ -notmatch '=healthy$' })
    $falhos = @($estados | Where-Object { $_ -match '=(unhealthy|exited|dead)$' })

    if ($falhos.Count -gt 0) {
        docker compose ps
        Falhar ("Container com problema: " + ($falhos -join ', ') + ". Veja: docker compose logs <servico>")
    }
    if ($ids -and $pendentes.Count -eq 0) { break }
    if (((Get-Date) - $inicio).TotalSeconds -gt $TimeoutSegundos) {
        docker compose ps
        Falhar ("Tempo esgotado aguardando: " + ($pendentes -join ', '))
    }
    Start-Sleep -Seconds 3
}
Escrever-Ok 'Todos os containers saudáveis'

# --- Resumo -------------------------------------------------------------------
Write-Host ''
docker compose ps --format 'table {{.Service}}\t{{.Status}}\t{{.Ports}}'
Write-Host ''
Write-Host "  Site:    http://localhost:$portaFront" -ForegroundColor Green
Write-Host "  Saúde:   http://localhost:$portaFront/saude"
Write-Host "  Banco:   localhost:$portaDb (usuário/senha no .env)"
Write-Host ''
if ($Dev) {
    Write-Host '  Modo:    DESENVOLVIMENTO (hot reload). Edite frontend\src e o navegador atualiza sozinho.' -ForegroundColor Yellow
    Write-Host '  Voltar ao modo produção: .\iniciar.ps1'
}
Write-Host '  Parar:   .\iniciar.ps1 -Parar'
Write-Host '  Logs:    docker compose logs -f'
Write-Host ''

if ($Logs) { docker compose logs -f }
