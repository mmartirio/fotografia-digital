@echo off
rem Atalho para Windows (duplo clique ou "iniciar" no cmd). Repassa argumentos: iniciar -Parar
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0iniciar.ps1" %*
if "%~1"=="" pause
