@echo off
setlocal

echo.
echo CANine Updater
echo --------------
echo This script will update your CANine adapter
echo to the latest CANine fimware. Ensure your
echo device is plugged in and in DFU mode (boot
echo jumper to on).
echo.

:PROMPT
SET /P CONTINUE=Continue? (Y/[N])
IF /I "%CONTINUE%" NEQ "Y" GOTO END


if exist dfu-util-static.exe (
    echo DFU-util exists, skipping download
) else (
    echo Downloading DFU-util
    curl.exe -O -J -L --output dfu-util-static.exe --url https://github.com/yconst/CANine/releases/latest/download/dfu-util-static.exe)
)

if exist CANine.bin (
    echo Firmware exists, skipping download
) else (
    echo Downloading firmware
    curl.exe -O -J -L --output CANine.bin --url https://github.com/yconst/CANine/releases/latest/download/CANine.bin)
)

dfu-util-static.exe -d 0x0483:0xdf11 -c 1 -i 0 -a 0 -s 0x08000000 -D CANine.bin

:END
endlocal
