
# CANine firmware

USB CDC firmware for the CANine adapter. This firmware is based on slcan but gets rid of the Virtual Com Port cruft, resulting in leaner communication on all platforms, and especially on Windows. Most slcan commands are the same, but the CAN frame size is fixed and data is transmitted as binary (instead if ascii in slcan).

This firmware is currently supported by [Tinymovr Studio](https://pypi.org/project/tinymovr/) v0.4.0 and above.

## Flashing

1. Ensure your device is not plugged in
2. Switch the BOOT switch to ON
3. Plug in the device
4. Follow the instructions below for your OS

### Windows

For windows you will need to install the libusb driver. The easiest way to do this is using the [Zadig utility](https://zadig.akeo.ie). Download and run the utility and choose the device from the drop-down list. The device should read ST Microelectronics CDC, and should have vendor id 0x0483 and device id 0xdf11. Choose "libusb" as the replacement driver and hit "replace".

Once you have the libusb driver installed, run the command below:

    wget https://raw.githubusercontent.com/yconst/CANine/main/flash.bat & flash.bat

### Linux

A bash script is provided, which you can download and run using the command below:

    wget https://raw.githubusercontent.com/yconst/CANine/main/flash.sh && chmod +x ./flash.sh && sudo ./flash.sh

### Macos

Similarly to linux, use the command below:

    wget https://raw.githubusercontent.com/yconst/CANine/main/flash.sh && chmod +x ./flash.sh && sudo ./flash.sh
