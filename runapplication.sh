#!/bin/bash
echo "============================================"
echo "  EventSphere - Starting Application"
echo "============================================"
echo ""

# Start backend
echo "[1/2] Starting FastAPI backend on http://localhost:8000 ..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Brief pause
sleep 2

# Start frontend
echo "[2/2] Starting React frontend on http://localhost:3000 ..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "============================================"
echo "  Backend  : http://localhost:8000"
echo "  Frontend : http://localhost:3000"
echo "  API Docs : http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo "============================================"

# Wait and clean up on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servers stopped.'" EXIT
wait
