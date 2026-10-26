@echo off
REM ==============================================================================
REM Smart College Event Management System - 1-Click Windows Batch Launcher
REM Group 11 (VESIT D17A - ACC DevOps)
REM ==============================================================================

title VESIT Event Management - Docker Setup

echo Starting 1-Click Docker Setup...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-docker.ps1"

pause
