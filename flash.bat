

if exist dfu-util-static.exe (
    rem DFU-util exists, skipping download
) else (
    rem Downloading DFU-util
    curl.exe --output dfu-util-static.exe --url https://github.com/yconst/CANine/releases/latest/dfu-util-static.exe)
)

if exist CANine.bin (
    rem Firmware exists, skipping download
) else (
    rem Downloading firmware
    curl.exe --output CANine.bin --url https://github.com/yconst/CANine/releases/latest/CANine.bin)
)

dfu-util-static.exe -c 1 -i 0 -a 0 -s 0x08000000 -D CANine.bin