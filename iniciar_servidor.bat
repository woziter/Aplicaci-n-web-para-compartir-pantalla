@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: No se encontro Node.js. Instala Node.js 22.23.2 y vuelve a intentarlo.
    pause
    exit /b 1
)

if not exist "node_modules\express\package.json" (
    echo ERROR: No se encontraron las dependencias. Ejecuta primero instalar_dependencias.bat.
    pause
    exit /b 1
)

if not exist "node_modules\socket.io\package.json" (
    echo ERROR: No se encontraron las dependencias. Ejecuta primero instalar_dependencias.bat.
    pause
    exit /b 1
)

echo Iniciando servidor en http://localhost:5000
echo Para detenerlo, pulsa Ctrl+C.
node server.js
set "EXIT_CODE=%ERRORLEVEL%"

echo El servidor termino con codigo %EXIT_CODE%.
pause
exit /b %EXIT_CODE%
