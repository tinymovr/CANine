
# CANine firmware

USB CDC firmware for the CANine USB⟷CAN Bus adapter. This firmware is based on slcan but gets rid of the Virtual Com Port cruft, resulting in leaner communication on all platforms, and especially on Windows. Most slcan commands are the same, but the CAN frame size is fixed and data is transmitted as binary (instead of ascii in slcan).

This firmware should be compatible with CANable adapters, but has not been tested.

[Documentation](https://canine.readthedocs.io/en/latest/)

## Flashing

We now offer [a simple Web-based firmware update service](https://tinymovr.github.io/CANine/). Instructions are available on the page. Chrome and Edge are supported.

## Using

This firmware is compatible with python-can through the corresponding [plugin available on PyPi](https://pypi.org/project/python-can-canine/).

This firmware is compatible with Tinymovr. To use with Studio, add the command line parameter `--bus=canine` when launching.
