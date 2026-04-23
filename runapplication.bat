@echo off
echo ============================================
echo   EventSphere - Starting Application
echo ============================================
echo.

:: Start Backend in a new window
echo [1/2] Starting FastAPI backend on http://localhost:8000 ...
start "EventSphere Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Small delay before starting frontend
timeout /t 3 /nobreak > nul

:: Start Frontend in a new window
echo [2/2] Starting React frontend on http://localhost:3000 ...
start "EventSphere Frontend" cmd /k "cd frontend && npm start"

echo.
echo ============================================
echo   Both servers are starting up!
echo   Backend  : http://localhost:8000
echo   Frontend : http://localhost:3000
echo   API Docs : http://localhost:8000/docs
echo ============================================
echo.
echo Press any key to close this launcher...
pause > nul
