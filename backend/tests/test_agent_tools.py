import json
import pytest
from pathlib import Path

try:
    from src.agent import Assistant
    from src.db import init_db, save_caller_data
except ImportError:
    from agent import Assistant
    from db import init_db, save_caller_data


@pytest.fixture
def temp_db(tmp_path, monkeypatch):
    db_file = tmp_path / "test_caller_data.db"
    init_db(db_file)
    try:
        import src.db
        monkeypatch.setattr("src.db.DEFAULT_DB_PATH", db_file, raising=False)
    except ImportError:
        pass
    try:
        import db
        monkeypatch.setattr("db.DEFAULT_DB_PATH", db_file, raising=False)
    except ImportError:
        pass
    return db_file


@pytest.mark.asyncio
async def test_lookup_caller_tool(temp_db):
    save_caller_data(
        user_id="FF001",
        name="Ramesh",
        language_preference="Malayalam",
        facts={"crops_grown": "cotton", "district": "Kottayam"},
        db_path=temp_db
    )

    assistant = Assistant(default_user_id="FF001")
    
    # Run tool directly
    result_str = await assistant.lookup_caller(context=None, user_id="FF001")
    result = json.loads(result_str)
    
    assert result["status"] == "found"
    assert result["name"] == "Ramesh"
    assert result["facts"]["crops_grown"] == "cotton"


@pytest.mark.asyncio
async def test_save_caller_tool(temp_db):
    assistant = Assistant(default_user_id="FF001")
    
    save_str = await assistant.save_caller(
        context=None,
        user_id="FF001",
        name="Ramesh",
        crops_grown="cotton",
        land_size="3 acres",
        district="Kottayam",
        irrigation_type="well irrigation"
    )
    
    result = json.loads(save_str)
    assert result["status"] == "saved"
    assert result["record"]["facts"]["land_size"] == "3 acres"
