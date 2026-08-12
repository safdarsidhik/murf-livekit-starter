import json
import pytest
from livekit.agents import AgentSession, inference, llm

from agent import Assistant
from outbound_call import parse_args


def _llm() -> llm.LLM:
    return inference.LLM(model="google/gemini-2.5-flash")


@pytest.mark.asyncio
async def test_outbound_two_sentence_opening() -> None:
    """Evaluation of the agent's outbound opening requirement:
    1. Identify who is calling (Farm & Field) and state why.
    2. Explain how to make it stop ('stop calls').
    """
    async with (
        _llm() as llm_inst,
        AgentSession(llm=llm_inst) as session,
    ):
        await session.start(Assistant())

        outbound_prompt = (
            "[SYSTEM NOTICE: OUTBOUND CALL CONNECTED] "
            "Trigger: Heavy rainfall & pest warning alert for cotton in Kottayam. "
            "Deliver the MANDATORY 2-sentence outbound opening: "
            "1. Introduce yourself as Farm & Field and state why you are calling (urgent weather and pest warning alert). "
            "2. State clearly how the user can make it stop (by saying 'stop calls' or 'കോൾ നിർത്തുക')."
        )

        result = await session.run(user_input=outbound_prompt)

        await (
            result.expect.next_event()
            .is_message(role="assistant")
            .judge(
                llm_inst,
                intent="""
                The assistant must state that it is calling from Farm & Field with an alert/warning regarding crop/weather in Kottayam, 
                AND must explain how the caller can stop or opt out of these calls (e.g. saying 'stop calls').
                """,
            )
        )


@pytest.mark.asyncio
async def test_outbound_opt_out_handling() -> None:
    """Evaluation of the agent's opt-out behavior when caller requests to stop calls."""
    async with (
        _llm() as llm_inst,
        AgentSession(llm=llm_inst) as session,
    ):
        await session.start(Assistant())

        result = await session.run(user_input="Please stop calling me, I want to opt out of these alerts.")

        await (
            result.expect.next_event()
            .is_message(role="assistant")
            .judge(
                llm_inst,
                intent="""
                Politely confirms that the user's opt-out request has been accepted and that automated outbound calls will be stopped.
                """,
            )
        )


def test_outbound_cli_args_default(monkeypatch):
    """Test outbound_call.py argument parser defaults."""
    monkeypatch.setattr("sys.argv", ["outbound_call.py"])
    args = parse_args()
    assert args.trigger == "rain_pest_warning"
    assert args.crop == "cotton"
    assert args.district == "Kottayam"
    assert args.user_id == "FF001"


def test_outbound_cli_args_custom(monkeypatch):
    """Test outbound_call.py argument parser custom inputs."""
    monkeypatch.setattr(
        "sys.argv",
        [
            "outbound_call.py",
            "--trigger",
            "price_threshold",
            "--crop",
            "rubber",
            "--district",
            "Wayanad",
            "--price",
            "190",
            "--user-id",
            "FF002",
        ],
    )
    args = parse_args()
    assert args.trigger == "price_threshold"
    assert args.crop == "rubber"
    assert args.district == "Wayanad"
    assert args.price == "190"
    assert args.user_id == "FF002"
