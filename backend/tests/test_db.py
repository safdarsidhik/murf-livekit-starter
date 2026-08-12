import json
import pytest
from pathlib import Path
try:
    from src.db import init_db, get_caller, save_caller_data, update_last_interaction
except ImportError:
    from db import init_db, get_caller, save_caller_data, update_last_interaction


@pytest.fixture
def temp_db(tmp_path):
    db_file = tmp_path / "test_caller_data.db"
    init_db(db_file)
    return db_file


def test_init_db(temp_db):
    assert Path(temp_db).exists()


def test_get_non_existent_caller(temp_db):
    result = get_caller(user_id="UNKNOWN", db_path=temp_db)
    assert result is None


def test_save_and_get_caller(temp_db):
    facts = {
        "crops_grown": "cotton, paddy",
        "land_size": "2 acres",
        "district": "Kottayam",
        "irrigation_type": "well irrigation"
    }
    saved = save_caller_data(
        user_id="FF001",
        name="Ramesh",
        language_preference="Malayalam",
        facts=facts,
        db_path=temp_db
    )
    
    assert saved["user_id"] == "FF001"
    assert saved["name"] == "Ramesh"
    assert saved["facts"]["crops_grown"] == "cotton, paddy"
    
    # Retrieve by user_id
    retrieved = get_caller(user_id="FF001", db_path=temp_db)
    assert retrieved is not None
    assert retrieved["name"] == "Ramesh"
    assert retrieved["facts"]["district"] == "Kottayam"

    # Retrieve by name
    retrieved_by_name = get_caller(name="ramesh", db_path=temp_db)
    assert retrieved_by_name is not None
    assert retrieved_by_name["user_id"] == "FF001"


def test_update_caller_facts(temp_db):
    save_caller_data(
        user_id="FF002",
        name="Sita",
        facts={"crops_grown": "coconut"},
        db_path=temp_db
    )
    
    # Update facts
    updated = save_caller_data(
        user_id="FF002",
        name="Sita",
        facts={"crops_grown": "paddy", "district": "Wayanad"},
        db_path=temp_db
    )
    
    assert updated["facts"]["crops_grown"] == "paddy"
    assert updated["facts"]["district"] == "Wayanad"


def test_update_last_interaction(temp_db):
    save_caller_data(
        user_id="FF003",
        name="Kumar",
        db_path=temp_db
    )
    ts = update_last_interaction("FF003", db_path=temp_db)
    assert ts is not None
