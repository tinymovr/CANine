@echo off
setlocal

rem This script will update your CANine adapter
rem to the latest CANine fimware. Ensure your
rem device is plugged in and in DFU mode (boot
rem jumper to on).

:PROMPT
SET /P CONTINUE=Continue? (Y/[N])
IF /I "%CONTINUE%" NEQ "Y" GOTO END


if exist dfu-util-static.exe (
    rem DFU-util exists, skipping download
) else (
    rem Downloading DFU-util
    curl.exe --output dfu-util-static.exe --url https://github.com/yconst/CANine/releases/latest/download/dfu-util-static.exe)
)

if exist CANine.bin (
    rem Firmware exists, skipping download
) else (
    rem Downloading firmware
    curl.exe --output CANine.bin --url https://github.com/yconst/CANine/releases/latest/download/CANine.bin)
)

dfu-util-static.exe -c 1 -i 0 -a 0 -s 0x08000000 -D CANine.bin

:END
endlocal
