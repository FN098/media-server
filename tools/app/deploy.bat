@echo off
cd /d "%~dp0..\.."

git pull

docker compose up -d --build app worker
