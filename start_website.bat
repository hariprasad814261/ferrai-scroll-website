@echo off
title Ferrari F40 Landing Page
echo Starting local web server on port 8080...
start http://localhost:8080/
python -m http.server 8080
pause
