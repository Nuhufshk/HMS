@echo off
cd /d "C:\Users\harun\OneDrive\Desktop\Projects\HMS"
set PATH=C:\Program Files\nodejs;%PATH%
call npm run dev > dev.log 2>&1
