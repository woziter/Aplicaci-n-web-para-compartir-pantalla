@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: No se encontro Node.js. Instala Node.js 22.23.2 y vuelve a intentarlo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo ERROR: No se encontro npm. Reinstala Node.js incluyendo npm y vuelve a intentarlo.
    pause
    exit /b 1
)

echo Instalando dependencias del proyecto...
call npm ci
if errorlevel 1 (
    echo ERROR: No se pudieron instalar las dependencias.
    pause
    exit /b 1
)

echo Dependencias instaladas correctamente.
pause
exit /b 0
