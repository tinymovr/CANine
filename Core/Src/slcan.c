//
// slcan: Parse incoming and generate outgoing slcan messages
//

#include "stm32f0xx_hal.h"
#include <string.h>
#include "can.h"
#include "slcan.h"
#include "usbd_cdc_if.h"

#define GIT_VERSION "fw-v0.8.9-1-ge21ec71-dirty"
#define GIT_REMOTE "rem"


// Parse an incoming CAN frame into an outgoing slcan message
int8_t slcan_parse_frame(uint8_t *buf, CAN_RxHeaderTypeDef *frame_header, uint8_t* frame_data)
{
	memset (buf, '\0', SLCAN_MTU);
    uint8_t msg_position = 0;

	// Packet header
	// Just the number of packets remaining for now,
	// which is 0 i.e. single packet.
    buf[msg_position++] = 0;

    // Add character for frame type
    if (frame_header->RTR == CAN_RTR_DATA)
    {
    	if (frame_header->IDE == CAN_ID_EXT)
    	{
    		buf[msg_position] = 'T';
    	}
    	else
    	{
    		buf[msg_position] = 't';
    	}
    } else if (frame_header->RTR == CAN_RTR_REMOTE)
    {
    	if (frame_header->IDE == CAN_ID_EXT)
		{
			buf[msg_position] = 'R';
		}
		else
		{
			buf[msg_position] = 'r';
		}
    }
    msg_position++;

    // Add frame ID
    if (frame_header->IDE == CAN_ID_EXT)
    {
		memcpy(buf+msg_position, &(frame_header->ExtId), SLCAN_EXT_ID_LEN_BYTES);
		msg_position += SLCAN_EXT_ID_LEN_BYTES;
    }
    else
    {
		memcpy(buf+msg_position, &(frame_header->StdId), SLCAN_STD_ID_LEN_BYTES);
		msg_position += SLCAN_STD_ID_LEN_BYTES;
    }

    // Add frame DLC
    buf[msg_position++] = frame_header->DLC;

    // Add data bytes
    memcpy(buf+msg_position, frame_data, sizeof(uint8_t) * frame_header->DLC);
    msg_position += sizeof(uint8_t) * frame_header->DLC;

    // Return number of bytes in string
    return msg_position;
}


// Parse an incoming slcan command from the USB CDC port
int8_t slcan_parse_str(uint8_t *buf, uint8_t len)
{
	CAN_TxHeaderTypeDef frame_header;
	uint8_t msg_position = 0;

	// Default to standard ID unless otherwise specified
	frame_header.IDE = CAN_ID_STD;
    frame_header.StdId = 0;
    frame_header.ExtId = 0;

    // Only accept messages with zero-valued header
    if (buf[msg_position++] != 0)
    {
    	return -1;
    }

    // Process command
    volatile uint8_t br;
    switch(buf[msg_position])
    {
		case 'O':
			// Open channel command
			can_enable();
			return 0;

		case 'C':
			// Close channel command
			can_disable();
			return 0;

		case 'S':
			// Set bitrate command

			// Check for valid bitrate
			br = buf[1];
			if(br >= CAN_BITRATE_INVALID)
			{
				return -1;
			}

			can_set_bitrate(br);
			return 0;

		case 'm':
		case 'M':
			// Set mode command
			if (buf[1] == 1)
			{
				// Mode 1: silent
				can_set_silent(1);
			} else {
				// Default to normal mode
				can_set_silent(0);
			}
			return 0;

		case 'a':
		case 'A':
			// Set autoretry command
			if (buf[1] == 1)
			{
				// Mode 1: autoretry enabled (default)
				can_set_autoretransmit(1);
			} else {
				// Mode 0: autoretry disabled
				can_set_autoretransmit(0);
			}
			return 0;

		case 'V':
		{
			// Report firmware version and remote
			char* fw_id = GIT_VERSION " " GIT_REMOTE "\r";
			CDC_Transmit_FS((uint8_t*)fw_id, strlen(fw_id));
			return 0;
		}

		case 'T':
	    	frame_header.IDE = CAN_ID_EXT;
		case 't':
			// Transmit data frame command
			frame_header.RTR = CAN_RTR_DATA;
			break;

		case 'R':
	    	frame_header.IDE = CAN_ID_EXT;
		case 'r':
			// Transmit remote frame command
			frame_header.RTR = CAN_RTR_REMOTE;
			break;

    	default:
    		// Error, unknown command
    		return -1;
    }
    msg_position++;

    // Save CAN ID depending on ID type
    if (frame_header.IDE == CAN_ID_EXT) {
    	memcpy(&(frame_header.ExtId), buf+msg_position, sizeof(uint8_t)*SLCAN_EXT_ID_LEN_BYTES);
    	msg_position += SLCAN_EXT_ID_LEN_BYTES;
    }
    else {
    	memcpy(&(frame_header.StdId), buf+msg_position, sizeof(uint8_t)*SLCAN_STD_ID_LEN_BYTES);
    	msg_position += SLCAN_STD_ID_LEN_BYTES;
    }

    // Attempt to parse DLC and check sanity
    frame_header.DLC = buf[msg_position++];
    if (frame_header.DLC > 8) {
        return -1;
    }

    // Transmit the message
    can_tx(&frame_header, buf+msg_position);

    return 0;
}
