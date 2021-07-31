**********************
CANine adapter
**********************

Introduction
############

We have adapted the CANable design and created a USB Type-C <-> CAN Bus adapter. To distinguish from the original, we call this adapter CANine. It features DF-13 connectors in addition to 2.54mm header, as well as a convenient DIP switch for setting CAN termination resistor and boot mode.

It is based on the following hardware:

* STM32F042C6 MCU
* MCP2551 CAN Bus Transceiver
* Dual DF13/2.54mm Pin header CAN interface
* USB Type-C (v2) / micro (v1) interface

This design is Open Source, released under the original CANable license.

Hardware Configuration
######################

.. figure:: canine_config.png
  :width: 800
  :align: center
  :alt: CANine hardware configuration diagram
  :figclass: align-center

CAN Termination Resistor
------------------------

CANine includes a termination resistor to ease the setup of a CAN Bus network. If CANine is a terminal node in the network, you should enable the 120Ohm termination resistor via the onboard DIP switch. In small setups with a few nodes and short wires, it is enough to enable just a single termination resistor, either on the CANine or on a single Tinymovr.

Flashing Firmware
#################

Your CANine adapter comes pre-flashed with the CANine firmware. As such you do not need to perform flashing to use it together with Tinymovr Studio on Windows, Macos or Ubuntu Linux.

In any case, CANine firmware can be updated using a simple command line tool.

1. Ensure your device is not plugged in
2. Switch the BOOT switch to ON
3. Plug in the device
4. Follow the instructions below for your OS

Windows
-------

For windows you will need to install the libusb driver. The easiest way to do this is using the Zadig utility. Download and run the utility and choose the device from the drop-down list. The device should read ST Microelectronics CDC, and should have vendor id 0x0483 and device id 0xdf11. Choose "libusb" as the replacement driver and hit "replace".

Once you have the libusb driver installed, run the command below:

.. code-block:: console

    wget -q https://raw.githubusercontent.com/yconst/CANine/main/flash.bat & flash.bat


Linux
-----

A bash script is provided, which you can download and run using the command below:

.. code-block:: console

    wget -q https://raw.githubusercontent.com/yconst/CANine/main/flash.sh && chmod +x ./flash.sh && sudo ./flash.sh


Macos
-----

You'll need to have Homebrew installed. Once Homebrew is installed, use the command below:

.. code-block:: console

    wget -q https://raw.githubusercontent.com/yconst/CANine/main/flash_macos.sh && chmod +x ./flash_macos.sh && ./flash_macos.sh


slcan & CANdlelight
-------------------

CANine is also compatible with both slcan as well as candlelight firmware. If you would like to revert to these firmwares, the easiest solution is to use the `canable updater <https://canable.io/updater/>`_. It is a DFU updater working directly from within the browser. Chrome and Edge are supported.

With the board powered off, move the BOOT DIP switch to the "ON" position. Connect your board and follow the instruction on the web page to begin the flash procedure.
