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

CANine comes pre-flashed with slcan.

CANine Firmware
---------------

To try the CANine firmware, we offer `a simple Web-based firmware update service <https://tinymovr.github.io/CANine/>`_. Instructions are available on the page. Chrome and Edge are supported.


slcan & CANdlelight Firmware
----------------------------

CANine is compatible with both slcan as well as candlelight firmware. If you would like to revert to these firmwares, the easiest solution is to use the `canable updater <https://canable.io/updater/>`_. Similarly to the CANine flasher, this updater works directly from within the browser. Chrome and Edge are supported.

