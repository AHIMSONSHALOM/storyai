@echo off
title StoryForge AI - Flask Backend Server
color 0A

echo ===================================================
echo           StoryForge AI Backend Server
echo ===================================================
echo.

cd /d "%~dp0"

set "PYBIN="

if exist "C:\Users\Admin\AppData\Local\Programs\Python\Launcher\py.exe" (
    set "PYBIN=C:\Users\Admin\AppData\Local\Programs\Python\Launcher\py.exe"
) else if exist "C:\Users\Admin\AppData\Local\Programs\Python\Python315\python.exe" (
    set "PYBIN=C:\Users\Admin\AppData\Local\Programs\Python\Python315\python.exe"
) else (
    where py >nul 2>&1
    if %errorlevel% equ 0 (
        set "PYBIN=py"
    ) else (
        where python >nul 2>&1
        if %errorlevel% equ 0 (
            set "PYBIN=python"
        )
    )
)

if "%PYBIN%"=="" (
    echo [ERROR] Could not locate Python executable.
    pause
    exit /b 1
)

echo [1/3] Using Python: %PYBIN%
"%PYBIN%" --version

echo.
echo [2/3] Installing requirements...
"%PYBIN%" -m pip install -r requirements.txt

echo.
echo [3/3] Starting StoryForge AI Flask app on http://localhost:5000...
echo.
echo ===================================================
echo  Server is running! Open http://localhost:5000
echo ===================================================
echo.
"%PYBIN%" app.py

pause
