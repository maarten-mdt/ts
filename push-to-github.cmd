@echo off
cd /d "%~dp0"
set MESSAGE=%~1
if "%MESSAGE%"=="" set MESSAGE=Update

echo Adding all changes...
git add .
echo.
echo Committing with message: %MESSAGE%
git commit -m "%MESSAGE%"
if errorlevel 1 (
  echo Nothing to commit, or commit failed. Try: push-to-github.cmd "Your message"
  pause
  exit /b 1
)
echo.
echo Pushing to GitHub...
git push
echo.
echo Done.
pause
