
# CANine firmware

USB CDC firmware for the CANine USB⟷CAN Bus adapter. This firmware is based on slcan but gets rid of the Virtual Com Port cruft, resulting in leaner communication on all platforms, and especially on Windows. Most slcan commands are the same, but the CAN frame size is fixed and data is transmitted as binary (instead of ascii in slcan).

This firmware is currently supported by [Tinymovr Studio](https://pypi.org/project/tinymovr/) v0.4.0 and above.

This firmware should be compatible with CANable adapters, but has not been tested.

[Documentation](https://canine.readthedocs.io/en/latest/)

## Flashing

1. Ensure your device is not plugged in
2. Switch the BOOT switch to ON
3. Plug in the device
4. Follow the instructions below for your OS

### Windows

For windows you will need to install the libusb driver. The easiest way to do this is using the [Zadig utility](https://zadig.akeo.ie). Download and run the utility and choose the device from the drop-down list. The device should read ST Microelectronics CDC, and should have vendor id 0x0483 and device id 0xdf11. Choose "libusb" as the replacement driver and hit "replace".

Once you have the libusb driver installed, run the command below:

    wget -q https://raw.githubusercontent.com/yconst/CANine/main/flash.bat & flash.bat

### Linux

A bash script is provided, which you can download and run using the command below:

    wget -q https://raw.githubusercontent.com/yconst/CANine/main/flash.sh && chmod +x ./flash.sh && sudo ./flash.sh

### Macos

You'll need to have Homebrew installed. Once Homebrew is installed, use the command below:

    wget -q https://raw.githubusercontent.com/yconst/CANine/main/flash_macos.sh && chmod +x ./flash_macos.sh && ./flash_macos.sh
    

## Using

Currently this firmware is supported by our [fork of the python-can library](https://github.com/tinymovr/python-can) (the `develop` branch). It's not yet tested on Linux (Windows and Macos works), but it should work without an issue. 

You can set `--bustype=canine` for Tinymovr studio to use this protocol. If you pip install studio from the [main branch](https://github.com/tinymovr/Tinymovr), you'll get the forked python-can library installed automatically.
