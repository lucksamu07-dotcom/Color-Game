# ══════════════════════════════════════════════════════
#   construir-apk.ps1  —  Color Game → APK de Android
#   Uso: doble clic en CONSTRUIR-APK.bat
# ══════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$Root   = $PSScriptRoot
$Output = Join-Path $Root "apk-output"

# ── Colores en consola ────────────────────────────────
function OK   { param($m) Write-Host "  ✅  $m" -ForegroundColor Green  }
function INFO { param($m) Write-Host "  ⏳  $m" -ForegroundColor Cyan   }
function WARN { param($m) Write-Host "  ⚠️   $m" -ForegroundColor Yellow }
function FAIL { param($m) Write-Host "`n  ❌  $m`n" -ForegroundColor Red; Read-Host "Pulsa Enter para cerrar"; exit 1 }

Clear-Host
Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "  ║   🎨  COLOR GAME  —  Build APK       ║" -ForegroundColor Magenta
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

Set-Location $Root

# ── 1. Verificar ANDROID_HOME ────────────────────────
INFO "Verificando Android SDK..."
if (-not $env:ANDROID_HOME) {
    # Intentar detectar automáticamente
    $sdkCandidates = @(
        "$env:LOCALAPPDATA\Android\Sdk",
        "$env:USERPROFILE\AppData\Local\Android\Sdk",
        "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
    )
    foreach ($c in $sdkCandidates) {
        if (Test-Path $c) { $env:ANDROID_HOME = $c; break }
    }
    if (-not $env:ANDROID_HOME) {
        FAIL "ANDROID_HOME no está definido.`n     Abre Android Studio → Settings → Android SDK`n     y copia la ruta del SDK en una variable de entorno llamada ANDROID_HOME."
    }
    WARN "ANDROID_HOME detectado automáticamente: $env:ANDROID_HOME"
}
OK "Android SDK encontrado: $env:ANDROID_HOME"

# ── 2. Verificar / detectar Java ─────────────────────
INFO "Verificando Java..."
if (-not $env:JAVA_HOME) {
    # Buscar JDK incluido con Android Studio
    $jdkCandidates = @(
        "C:\Program Files\Android\Android Studio\jbr",
        "C:\Program Files\Android\Android Studio\jre",
        "$env:LOCALAPPDATA\Android\android-studio\jbr",
        "$env:LOCALAPPDATA\Android\android-studio\jre"
    )
    foreach ($c in $jdkCandidates) {
        if (Test-Path (Join-Path $c "bin\java.exe")) {
            $env:JAVA_HOME = $c
            WARN "JAVA_HOME detectado automaticamente: $c"
            break
        }
    }
}
if (-not $env:JAVA_HOME) {
    FAIL "Java no encontrado.`n     Instala JDK 17+ desde https://adoptium.net`n     o asegurate de que Android Studio este instalado."
}
$javaExe = Join-Path $env:JAVA_HOME "bin\java.exe"
if (-not (Test-Path $javaExe)) {
    FAIL "No se encontro java.exe en: $javaExe`n     Verifica que JAVA_HOME apunte a un JDK completo."
}
try { $jv = & $javaExe -version 2>&1 | Select-Object -First 1; OK "Java OK  ($jv)" }
catch { FAIL "Java no responde: $javaExe`n     Error: $_" }

# ── 3. Build web (Vite) ──────────────────────────────
Write-Host ""
INFO "Construyendo la web con Vite..."
npm run build
if (-not $?) { FAIL "Falló 'npm run build'. Revisa los errores de arriba." }
OK "Web construida en /dist"

# ── 4. Primera vez: inicializar proyecto Android ─────
$androidDir = Join-Path $Root "android"
if (-not (Test-Path $androidDir)) {
    Write-Host ""
    INFO "Primera ejecución: creando proyecto Android (tarda ~1 min)..."
    npx cap add android
    if (-not $?) { FAIL "Falló 'cap add android'." }
    OK "Proyecto Android creado en /android"
}

# ── 5. Sincronizar web → Android ────────────────────
Write-Host ""
INFO "Sincronizando web con el proyecto Android..."
npx cap sync android
if (-not $?) { FAIL "Falló 'cap sync android'." }
OK "Sincronización completada"

# ── 6. Compilar APK con Gradle ───────────────────────
Write-Host ""
INFO "Compilando APK (la primera vez tarda 2-4 min, las siguientes ~30 seg)..."
Write-Host "     JAVA_HOME = $env:JAVA_HOME" -ForegroundColor DarkGray
Push-Location $androidDir
.\gradlew assembleDebug --quiet
$gradleOk = $?
Pop-Location
if (-not $gradleOk) { FAIL "Falló la compilación con Gradle. Abre Android Studio para ver el error detallado." }
OK "APK compilado"

# ── 7. Copiar APK a carpeta de salida ────────────────
Write-Host ""
INFO "Copiando APK..."
$apkSrc = Join-Path $Root "android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apkSrc)) {
    FAIL "No se encontró el APK en: $apkSrc"
}

if (-not (Test-Path $Output)) {
    New-Item -ItemType Directory -Path $Output | Out-Null
}

$fecha  = Get-Date -Format "yyyy-MM-dd_HHmm"
$apkDst = Join-Path $Output "ColorGame_$fecha.apk"
Copy-Item $apkSrc $apkDst

# Mantener solo los últimos 5 APKs para no acumular
Get-ChildItem $Output -Filter "*.apk" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip 5 |
    Remove-Item -Force

# ── 8. Resultado final ───────────────────────────────
Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║   🎉  APK LISTO PARA INSTALAR        ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  📂  $apkDst" -ForegroundColor White
Write-Host ""
Write-Host "  Cómo instalarlo en el móvil:" -ForegroundColor Gray
Write-Host "    1. Pásalo por USB, email o Google Drive" -ForegroundColor Gray
Write-Host "    2. En el móvil: Ajustes → Seguridad → Fuentes desconocidas ✅" -ForegroundColor Gray
Write-Host "    3. Abre el .apk y pulsa Instalar" -ForegroundColor Gray
Write-Host ""

# Abrir la carpeta de salida automáticamente
Start-Process explorer.exe $Output

Read-Host "  Pulsa Enter para cerrar"
