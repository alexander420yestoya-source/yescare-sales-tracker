@echo off
echo =============================================
echo   YESCARE Sales Balance Tracker - Setup
echo =============================================
echo.

echo [1/4] Install backend dependencies...
cd apps\backend
call npm install
echo Done.
echo.

echo [2/4] Install frontend dependencies...
cd ..\frontend
call npm install
echo Done.
echo.

echo [3/4] Generate Prisma client...
cd ..\backend
call npm run db:generate
echo Done.
echo.

echo =============================================
echo Setup selesai!
echo.
echo Langkah selanjutnya:
echo 1. Edit apps\backend\.env (isi DATABASE_URL)
echo 2. Jalankan: cd apps\backend ^&^& npm run db:push
echo 3. Jalankan: npm run db:seed
echo 4. Buka 2 terminal:
echo    Terminal 1: cd apps\backend ^&^& npm run dev
echo    Terminal 2: cd apps\frontend ^&^& npm run dev
echo.
echo Buka browser: http://localhost:3000
echo =============================================
pause
