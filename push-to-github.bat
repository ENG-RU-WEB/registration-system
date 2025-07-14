@echo off
git init
git remote add origin https://github.com/ENG-RU-WEB/registration-system.git
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
pause