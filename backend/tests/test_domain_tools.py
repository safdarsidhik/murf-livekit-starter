import json
import socket
import urllib.error
import pytest

try:
    from src.agent import Assistant
    from src.tools import fetch_district_weather, fetch_market_prices
except ImportError:
    from agent import Assistant
    from tools import fetch_district_weather, fetch_market_prices


def test_fetch_district_weather_success():
    result = fetch_district_weather(district="Kottayam")
    
    assert "status" in result
    assert "data_timestamp" in result
    assert "Today" in result["data_timestamp"] or "Attempted" in result["data_timestamp"]

    if result["status"] == "success":
        assert result["district"] == "Kottayam"
        assert "temperature_celsius" in result
        assert "condition" in result
        assert result["data_source"] == "Open-Meteo Live Weather API"
    else:
        # Failure path check
        assert result["status"] == "error"
        assert "out_loud_script" in result


def test_fetch_district_weather_timeout_failure(monkeypatch):
    def mock_urlopen(*args, **kwargs):
        raise socket.timeout("Connection timed out")

    monkeypatch.setattr("urllib.request.urlopen", mock_urlopen)

    result = fetch_district_weather(district="Wayanad")
    assert result["status"] == "error"
    assert result["error_type"] == "network_timeout_or_failure"
    assert "out_loud_script" in result
    assert "trouble connecting" in result["out_loud_script"].lower()
    assert "Attempted at" in result["data_timestamp"]


def test_fetch_market_prices_valid_crops():
    # Test English and Malayalam names
    crops_to_test = [
        ("coconut", "kottayam"),
        (" നാളികേരം ", "thrissur"),
        ("rubber", "kottayam"),
        ("റബ്ബർ", "idukki"),
        ("paddy", "palakkad"),
        ("pepper", "wayanad"),
        ("cardamom", "idukki"),
        ("arecanut", "kasaragod"),
        ("banana", "thrissur"),
    ]

    for crop, district in crops_to_test:
        result = fetch_market_prices(crop=crop, location=district)
        assert result["status"] == "success"
        assert "modal_price" in result
        assert "min_price" in result
        assert "max_price" in result
        assert "data_timestamp" in result
        assert "Agmarknet" in result["data_source"]


def test_fetch_market_prices_unrecognized_crop():
    result = fetch_market_prices(crop="dragonfruit_xyz", location="kottayam")
    assert result["status"] == "error"
    assert result["error_type"] == "crop_not_found"
    assert "out_loud_script" in result
    assert "do not have today's market price" in result["out_loud_script"].lower()
    assert "data_timestamp" in result


@pytest.mark.asyncio
async def test_agent_market_price_tool():
    assistant = Assistant(default_user_id="FF001")
    
    res_str = await assistant.get_market_price(context=None, crop="rubber", location="kottayam")
    res = json.loads(res_str)
    
    assert res["status"] == "success"
    assert "Rubber" in res["crop"]
    assert "₹" in res["modal_price"]
    assert "data_timestamp" in res


@pytest.mark.asyncio
async def test_agent_weather_forecast_tool():
    assistant = Assistant(default_user_id="FF001")
    
    res_str = await assistant.get_weather_forecast(context=None, district="Palakkad")
    res = json.loads(res_str)
    
    assert res["status"] in ["success", "error"]
    assert "data_timestamp" in res
