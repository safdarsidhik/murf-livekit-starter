import argparse
import asyncio
import json
import logging
import os
import sys
import time

from dotenv import load_dotenv
from livekit import api

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger("outbound_call")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Farm & Field Outbound Call Trigger CLI (Twilio / LiveKit SIP)"
    )
    parser.add_argument(
        "target_pos",
        nargs="?",
        default=None,
        help="Optional target SIP URI or Phone number (e.g. sip:safdarsidhik@sip.linphone.org)",
    )
    parser.add_argument(
        "--target",
        "-t",
        default=None,
        help="Target SIP URI or Phone number (e.g. sip:safdarsidhik@sip.linphone.org or +1234567890)",
    )
    parser.add_argument(
        "--trigger",
        choices=["rain_pest_warning", "price_threshold"],
        default="rain_pest_warning",
        help="Outbound trigger type (default: rain_pest_warning)",
    )
    parser.add_argument(
        "--crop",
        default="cotton",
        help="Target crop for the advisory (default: cotton)",
    )
    parser.add_argument(
        "--district",
        default="Kottayam",
        help="Target district for weather/market price alert (default: Kottayam)",
    )
    parser.add_argument(
        "--price",
        default="185",
        help="Target price threshold for price_threshold trigger (default: 185)",
    )
    parser.add_argument(
        "--user-id",
        default="FF001",
        help="Caller/User ID for database lookup (default: FF001)",
    )
    parser.add_argument(
        "--trunk-id",
        default=os.getenv("LIVEKIT_SIP_TRUNK_ID", "ST_gc2b1kRYCzq6"),
        help="LiveKit SIP Trunk ID (default: ST_gc2b1kRYCzq6)",
    )
    return parser.parse_args()


async def main():
    load_dotenv(".env.local")

    args = parse_args()

    url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")

    if not url or not api_key or not api_secret:
        logger.error(
            "LiveKit credentials not found in environment variables. "
            "Please check backend/.env.local"
        )
        sys.exit(1)

    sip_uri = args.target or args.target_pos
    default_sip = os.getenv("LINPHONE_SIP_URI", "sip:safdarsidhik@sip.linphone.org")

    if not sip_uri or sip_uri == "dev":
        sip_uri = default_sip

    sip_trunk_id = args.trunk_id


    room_name = f"outbound_call_room_{int(time.time())}"

    # Target number for SIP trunk request: LiveKit expects phone number or SIP username (not full URI)
    target_number = sip_uri
    if target_number.startswith("sip:"):
        target_number = target_number[4:]
    if "@" in target_number:
        target_number = target_number.split("@")[0]


    metadata_payload = {
        "call_type": "outbound",
        "trigger_type": args.trigger,
        "crop": args.crop,
        "district": args.district,
        "target_price": args.price,
        "target_id": args.user_id,
        "target_number": target_number,
    }
    metadata_json = json.dumps(metadata_payload)

    logger.info(f"Connecting to LiveKit Server: {url}")
    logger.info(f"Outbound call payload: {metadata_payload}")

    lk_api = api.LiveKitAPI(url=url, api_key=api_key, api_secret=api_secret)

    # 1. Dispatch agent to ensure it is waiting in the room with call metadata
    logger.info(f"Creating agent dispatch for room '{room_name}'...")
    try:
        dispatch = await lk_api.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(
                agent_name="my-agent",
                room=room_name,
                metadata=metadata_json,
            )
        )
        logger.info(f"Agent dispatch created successfully: {dispatch.id}")
    except Exception as e:
        logger.error(f"Error creating agent dispatch: {e}")

    # 2. Initiate SIP outbound participant call
    logger.info(
        f"Dialing SIP target: {target_number} via trunk ID ({sip_trunk_id})..."
    )
    try:
        request = api.CreateSIPParticipantRequest(
            room_name=room_name,
            sip_call_to=target_number,
            sip_trunk_id=sip_trunk_id,
            participant_identity=args.user_id,
            participant_name=f"Farmer_{args.user_id}",
            wait_until_answered=True,
        )

        participant = await lk_api.sip.create_sip_participant(request)
        logger.info(f"Outbound call initiated! Participant details: {participant}")
    except Exception as e:
        logger.error(f"Error making outbound SIP call: {e}")
    finally:
        await lk_api.aclose()


if __name__ == "__main__":
    asyncio.run(main())