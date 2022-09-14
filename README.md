
# CANine firmware

USB CDC firmware for the CANine USB⟷CAN Bus adapter. This firmware is based on slcan but gets rid of the Virtual Com Port cruft, resulting in leaner communication on all platforms, and especially on Windows. Most slcan commands are the same, but the CAN frame size is fixed and data is transmitted as binary (instead of ascii in slcan).

This firmware is currently supported by [Tinymovr Studio](https://pypi.org/project/tinymovr/) v0.3.x and above.

This firmware should be compatible with CANable adapters, but has not been tested.

[Documentation](https://canine.readthedocs.io/en/latest/)

## Flashing

We now offer simple firmware flashing using Chrome. [Go to the updater](https://tinymovr.github.io/CANine/).
    

## Using

Currently this firmware is supported by our [fork of the python-can library](https://github.com/tinymovr/python-can) (the `canine_develop` branch). It's not yet tested on Linux (Windows and Macos works), but it should work without an issue. 

You can set `--bustype=canine` for Tinymovr studio to use this protocol.
