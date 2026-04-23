@echo off
echo ============================================
echo   EventSphere - Dev Environment Setup
echo ============================================
echo.

:: ── Backend ──────────────────────────────────
echo [1/5] Creating Python virtual environment...
cd backend
python -m venv venv
call venv\Scripts\activate

echo [2/5] Installing Python dependencies...
pip install -r requirements.txt

echo [3/5] Running Alembic database migrations...
alembic upgrade head

echo [4/5] Seeding sample data (optional)...
sqlite3 event_booking.db < seed_data.sql 2>nul || echo (sqlite3 not found - skipping seed, app will create tables automatically)

cd ..

:: ── Frontend ─────────────────────────────────
echo [5/5] Installing Node dependencies...
cd frontend
npm install
cd ..

echo.
echo ============================================
echo   Setup complete! Run runapplication.bat
echo ============================================
pause
