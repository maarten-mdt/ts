@echo off
cd /d "%~dp0"
echo Starting TacticalShack (client + server)...
echo.
echo Make sure you have:
echo   1. PostgreSQL running with DATABASE_URL in server\.env
echo   2. Run: npm run db:migrate
echo   3. Run: npm run db:seed
echo.
npm run dev
pause
