
# CANine firmware

USB CDC firmware for the CANine adapter. This firmware is based on slcan but gets rid of the Virtual Com Port cruft, resulting in leaner communication on all platforms. Most slcan commands are the same, but the CAN frame size is fixed and data is transmitted as binary (instead if ascii in slcan).

## Flashing

### Windows

For windows you will need to install a libusb driver. The easiest way to do this is using the Zadig utility. Once you have the libusb driver installed, run the command below:

    wget https://raw.githubusercontent.com/yconst/CANine/main/flash.bat & flash.bat

### Linux

A bash script is provided, which you can download and run using the command below:

    wget https://raw.githubusercontent.com/yconst/CANine/main/flash.sh && chmod +x ./flash.sh && sudo ./flash.sh

### Macos

Similarly to linux, use the command below:

    wget https://raw.githubusercontent.com/yconst/CANine/main/flash.sh && chmod +x ./flash.sh && sudo ./flash.sh