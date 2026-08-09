import json
import logging

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    RunContext,
    cli,
    function_tool,
    inference,
    room_io,
    tokenize,
)
from livekit.plugins import deepgram, google, murf, noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")

try:
    from prompt import SYSTEM_PROMPT
except ImportError:
    from src.prompt import SYSTEM_PROMPT

try:
    from db import get_caller, init_db, save_caller_data, update_last_interaction
except ImportError:
    from src.db import get_caller, init_db, save_caller_data, update_last_interaction


class Assistant(Agent):
    def __init__(self, default_user_id: str = "FF001") -> None:
        self.default_user_id = default_user_id
        super().__init__(
            instructions=SYSTEM_PROMPT,
        )

    @function_tool
    async def lookup_caller(
        self,
        context: RunContext,
        user_id: str = "",
        name: str = "",
    ) -> str:
        """Look up existing caller information and farming facts from the SQLite database.

        Use this tool whenever a call starts, or when a user introduces themselves, or provides their name/ID.

        Args:
            user_id: Unique caller identifier (e.g. FF001, phone number, or session ID).
            name: Caller's name to search for if user_id is unavailable.
        """
        search_id = user_id or self.default_user_id
        logger.info(f"Looking up caller in DB: user_id='{search_id}', name='{name}'")

        caller = get_caller(user_id=search_id, name=name)
        if not caller and search_id != self.default_user_id:
            caller = get_caller(user_id=self.default_user_id)

        if caller:
            update_last_interaction(caller["user_id"])
            logger.info(f"Found caller record: {caller}")
            return json.dumps(
                {
                    "status": "found",
                    "user_id": caller["user_id"],
                    "name": caller["name"],
                    "language_preference": caller["language_preference"],
                    "facts": caller["facts"],
                    "last_interaction": caller["last_interaction"],
                },
                ensure_ascii=False,
            )

        logger.info("No existing caller record found.")
        return json.dumps(
            {
                "status": "not_found",
                "message": "No stored caller record found for this caller.",
            },
            ensure_ascii=False,
        )

    @function_tool
    async def save_caller(
        self,
        context: RunContext,
        user_id: str = "",
        name: str = "",
        language_preference: str = "Malayalam",
        crops_grown: str = "",
        land_size: str = "",
        district: str = "",
        irrigation_type: str = "",
    ) -> str:
        """Save or update caller information and farming facts in the SQLite database.

        CRITICAL REQUIREMENT:
        Only call this tool AFTER the caller has EXPLICITLY consented/agreed to saving their information (e.g. said "Yes", "Sure", "Okay", "ഓക്കെ", "അതെ").
        NEVER call this tool if the user said "No", "Don't save", or refused permission.

        Args:
            user_id: Unique identifier for the caller (e.g. FF001 or current user identity).
            name: Caller's name.
            language_preference: Language preference (Malayalam, English, or Manglish).
            crops_grown: Crops grown by farmer (e.g., cotton, paddy, coconut, rubber).
            land_size: Size of farm land (e.g., 2 acres, 3 hectares).
            district: District where farm is located (e.g., Kottayam, Wayanad, Palakkad).
            irrigation_type: Irrigation method (e.g., well irrigation, drip, rainfed, canal).
        """
        target_id = user_id or self.default_user_id or f"FF_{name.lower() if name else 'user'}"
        target_name = name or "Farmer"

        facts = {}
        if crops_grown:
            facts["crops_grown"] = crops_grown
        if land_size:
            facts["land_size"] = land_size
        if district:
            facts["district"] = district
        if irrigation_type:
            facts["irrigation_type"] = irrigation_type

        logger.info(
            f"Saving caller facts for user_id='{target_id}', name='{target_name}', facts={facts}"
        )
        record = save_caller_data(
            user_id=target_id,
            name=target_name,
            language_preference=language_preference,
            facts=facts,
        )
        return json.dumps(
            {
                "status": "saved",
                "message": f"Successfully saved information for {target_name}.",
                "record": record,
            },
            ensure_ascii=False,
        )


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()
    init_db()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    session = AgentSession(
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=google.LLM(
            model="gemini-3.5-flash-lite",
        ),
        tts=murf.TTS(
            voice="Nimisha",
            locale="ml-IN",
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True,
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    @session.on("user_input_transcribed")
    def on_user_input(ev):
        text = ev.transcript.strip()
        has_malayalam_script = any("\u0d00" <= char <= "\u0d7f" for char in text)
        manglish_keywords = {
            "namaskaram",
            "namaste",
            "njan",
            "njangal",
            "krishi",
            "krisi",
            "vilakal",
            "enikku",
            "enkk",
            "aanu",
            "aano",
            "undo",
            "thengu",
            "tengu",
            "rubbar",
            "parayamo",
            "sahayikamo",
            "nandi",
            "enthannu",
            "enthokkeyundu",
        }
        words = [w.strip(".,!?").lower() for w in text.split()]
        has_manglish_words = any(w in manglish_keywords for w in words)

        if has_malayalam_script or has_manglish_words:
            logger.info(
                f"Detected Malayalam/Manglish speech: '{ev.transcript}'. Switching TTS to Malayalam (Nimisha)."
            )
            session.tts.update_options(voice="Nimisha", locale="ml-IN")
        else:
            logger.info(
                f"Detected English speech: '{ev.transcript}'. Switching TTS to English (en-IN-anisha)."
            )
            session.tts.update_options(voice="en-IN-anisha", locale="en-IN")

    @session.on("conversation_item_added")
    def on_conversation_item_added(ev):
        item = getattr(ev, "item", None)
        if item and getattr(item, "role", "") == "assistant":
            content = str(
                getattr(item, "content", "") or getattr(item, "text_content", "")
            )
            if any("\u0d00" <= char <= "\u0d7f" for char in content):
                logger.info(
                    "LLM generated Malayalam response. Ensuring TTS voice is Nimisha (ml-IN)."
                )
                session.tts.update_options(voice="Nimisha", locale="ml-IN")
            elif content:
                logger.info(
                    "LLM generated English response. Setting TTS voice to en-IN-anisha (en-IN)."
                )
                session.tts.update_options(voice="en-IN-anisha", locale="en-IN")

    await ctx.connect()

    participant_identity = "FF001"
    if ctx.room.remote_participants:
        first_participant = next(iter(ctx.room.remote_participants.values()))
        if first_participant.identity:
            participant_identity = first_participant.identity

    await session.start(
        agent=Assistant(default_user_id=participant_identity),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )


if __name__ == "__main__":
    cli.run_app(server)
