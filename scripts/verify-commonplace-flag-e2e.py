import base64
import hashlib
import hmac
import json
import os
import time
from pathlib import Path
from playwright.sync_api import expect, sync_playwright


def encode_segment(value):
    raw = json.dumps(value, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def create_session_token():
    header = encode_segment({"alg": "HS256", "typ": "JWT"})
    payload = encode_segment(
        {
            "openId": os.environ["OWNER_OPEN_ID"],
            "appId": os.environ["VITE_APP_ID"],
            "name": os.environ.get("OWNER_NAME") or "Devaney",
            "exp": int(time.time()) + 3600,
        }
    )
    unsigned = f"{header}.{payload}"
    signature = hmac.new(
        os.environ["JWT_SECRET"].encode("utf-8"),
        unsigned.encode("ascii"),
        hashlib.sha256,
    ).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).rstrip(b"=").decode("ascii")
    return f"{unsigned}.{encoded_signature}"


errors = []
result = {}
screenshot_path = Path("/tmp/commonplace-feature-flag-e2e.png")

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    context.add_cookies(
        [
            {
                "name": "app_session_id",
                "value": create_session_token(),
                "url": "http://127.0.0.1:3000",
            }
        ]
    )
    page = context.new_page()
    page.on("pageerror", lambda error: errors.append(f"pageerror: {error}"))
    page.on(
        "console",
        lambda message: errors.append(f"console: {message.text}")
        if message.type == "error"
        else None,
    )

    page.goto("http://127.0.0.1:3000/commonplace", wait_until="networkidle")
    expect(page.get_by_text("Commonplace is currently turned off")).to_be_visible()
    expect(page.get_by_role("button", name="Commonplace", exact=True)).to_have_count(0)
    result["disabled_state"] = "visible"
    result["disabled_navigation"] = "hidden"

    page.get_by_role("button", name="Enable Commonplace workspace").click()
    expect(page.get_by_text("Commonplace Workspace", exact=False).first).to_be_visible(timeout=15000)
    expect(page.get_by_role("button", name="Commonplace", exact=True)).to_be_visible(timeout=15000)
    result["enabled_state"] = "visible"
    result["enabled_navigation"] = "visible"

    page.screenshot(path=str(screenshot_path), full_page=True)
    result["page_errors"] = errors
    result["screenshot"] = str(screenshot_path)
    browser.close()

if errors:
    raise AssertionError("Browser errors detected: " + " | ".join(errors))

print(json.dumps(result, indent=2))
