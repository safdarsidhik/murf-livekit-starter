import json
import pytest
from unittest.mock import AsyncMock, MagicMock
from livekit.agents import RunContext

from agent import Assistant, CropProblemSpecialist
from prompt import CROP_SPECIALIST_PROMPT


def test_crop_specialist_initialization():
    """Test CropProblemSpecialist is created with correct prompt, role, and limits."""
    specialist = CropProblemSpecialist(default_user_id="FF999")
    assert specialist.default_user_id == "FF999"
    assert specialist.instructions == CROP_SPECIALIST_PROMPT
    assert "Dr. Rajesh" in CROP_SPECIALIST_PROMPT
    assert "Crop Problem Specialist" in CROP_SPECIALIST_PROMPT
    assert "LIMITS & SCOPE" in CROP_SPECIALIST_PROMPT


@pytest.mark.asyncio
async def test_transfer_to_crop_specialist_tool():
    """Test Assistant.transfer_to_crop_specialist handoff tool execution."""
    assistant = Assistant(default_user_id="FF001")

    # Mock RunContext and AgentSession
    mock_session = MagicMock()
    mock_session.say = MagicMock()
    mock_session.update_agent = MagicMock()
    mock_session.tts = MagicMock()
    mock_session.tts.update_options = MagicMock()
    mock_session.generate_reply = AsyncMock()

    mock_context = MagicMock(spec=RunContext)
    mock_context.session = mock_session

    result_json = await assistant.transfer_to_crop_specialist(
        context=mock_context,
        problem_description="Yellowing leaves and black spots on paddy crop",
        crop="paddy",
    )

    result = json.loads(result_json)
    assert result["status"] == "transferred_to_specialist"
    assert result["specialist_name"] == "Dr. Rajesh (Crop Problem Specialist)"
    assert result["voice"] == "Male (en-IN-samar)"
    assert result["passed_context"]["crop"] == "paddy"
    assert result["passed_context"]["problem"] == "Yellowing leaves and black spots on paddy crop"

    # Verify Step 5 Requirement: Spoken notification before handoff
    mock_session.say.assert_called_once_with("I will connect you to our crop specialist.")

    # Verify Step 2 & 4: Active agent updated to CropProblemSpecialist
    mock_session.update_agent.assert_called_once()
    passed_agent = mock_session.update_agent.call_args[0][0]
    assert isinstance(passed_agent, CropProblemSpecialist)

    # Verify Male Voice requirement: TTS set to male voice (en-IN-samar)
    mock_session.tts.update_options.assert_called_with(voice="en-IN-samar", locale="en-IN")


    # Verify Step 5 Requirement: Specialist generates self-introduction reply
    mock_session.generate_reply.assert_called_once()


@pytest.mark.asyncio
async def test_transfer_to_main_agent_tool():
    """Test CropProblemSpecialist.transfer_to_main_agent handoff back to Assistant."""
    specialist = CropProblemSpecialist(default_user_id="FF001")

    mock_session = MagicMock()
    mock_session.say = MagicMock()
    mock_session.update_agent = MagicMock()
    mock_session.tts = MagicMock()
    mock_session.tts.update_options = MagicMock()
    mock_session.generate_reply = AsyncMock()

    mock_context = MagicMock(spec=RunContext)
    mock_context.session = mock_session

    result_json = await specialist.transfer_to_main_agent(
        context=mock_context,
        reason="Farmer asked for today's market price of coconut",
    )

    result = json.loads(result_json)
    assert result["status"] == "transferred_to_main"

    # Verify spoken handoff back
    mock_session.say.assert_called_once_with("I am connecting you back to our main Farm and Field assistant.")

    # Verify active agent updated to Assistant
    mock_session.update_agent.assert_called_once()
    passed_agent = mock_session.update_agent.call_args[0][0]
    assert isinstance(passed_agent, Assistant)

    # Verify female voice restored
    mock_session.tts.update_options.assert_called_with(voice="Nimisha", locale="ml-IN")
