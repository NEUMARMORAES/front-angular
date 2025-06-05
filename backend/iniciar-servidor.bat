@echo off
echo Instalando http-server...
npm install -g http-server

echo Iniciando o servidor...
cd dist
http-server .

pause
