#!/bin/bash

set -e
FILE=./CANine.bin

echo "CANine Updater"
echo "--------------"
echo "This script will update your CANine adapter"
echo "to the latest CANine fimware. Ensure your"
echo "device is in DFU mode (boot jumper to on)."
echo "Continue? (y/n)"
read answer

if [ "$answer" != "${answer#[Yy]}" ] ;then
    apt-get install -y dfu-util
    if [ ! -f "$FILE" ]; then
        curl -O -J -L --output ./CANine.bin --url https://github.com/yconst/CANine/releases/latest/CANine.bin
    fi

    if dfu-util -c 1 -i 0 -a 0 -s 0x08000000 -D ./CANine.bin; then
        echo "Done. Disconnect device and return BOOT jumper to off."
    fi
else
    echo "Aborting"
fi
