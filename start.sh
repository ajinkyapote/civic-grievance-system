#!/bin/bash
echo "Starting CivicCluster AI Full-Stack System..."

# Ensure MySQL is running
brew services start mysql

# Start Spring Boot Backend in background
cd ~/Projects/nv/civic-grievance-system/backend
./mvnw spring-boot:run &
BACKEND_PID=$!

# Start React Frontend
cd ~/Projects/nv/civic-grievance-system/frontend
npm run dev &
FRONTEND_PID=$!

echo "Backend running on http://localhost:8080 (PID: $BACKEND_PID)"
echo "Frontend running on http://localhost:5173 (PID: $FRONTEND_PID)"
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
