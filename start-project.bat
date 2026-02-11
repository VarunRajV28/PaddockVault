@echo off
echo Starting Project...

:: Start Backend (using existing script)
echo Starting Backend Server...
start "F1 Telemetry Backend" cmd /k "start-backend.bat"

:: Start Frontend 
echo Starting Frontend Application...
start "F1 Telemetry Frontend" cmd /k "npm run dev"

echo All services started!
echo Backend will be available at http://localhost:5000
echo Frontend will be available at http://localhost:3000
