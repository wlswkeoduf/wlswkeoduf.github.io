@echo off
cd /d %~dp0
IF NOT EXIST node_modules (
  echo [패키지 설치중...]
  npm install
)
echo [서버 시작중...]
start http://localhost:3099
npx nodemon server.js
pause
