#!/bin/bash
echo "============================================"
echo "  EventSphere - Dev Environment Setup"
echo "============================================"
echo ""

# Backend
echo "[1/4] Creating Python virtual environment..."
cd backend
python3 -m venv venv
source venv/bin/activate

echo "[2/4] Installing Python dependencies..."
pip install -r requirements.txt

echo "[3/4] Initializing database..."
python3 -c "from db.database import engine; from models.models import Base; Base.metadata.create_all(bind=engine); print('Database ready.')"

cd ..

# Frontend
echo "[4/4] Installing Node dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "============================================"
echo "  Setup complete! Run ./runapplication.sh"
echo "============================================"
