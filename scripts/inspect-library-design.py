import base64
import hashlib
import hmac
import json
import os
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("LIBRARY_REVIEW_BASE_URL", "http://127.0.0.1:3000")
OUTPUT_DIR = Path(os.environ.get("LIBRARY_REVIEW_OUTPUT_DIR", "/tmp/devasophy-library-review"))
VIEWPORTS = {
    "mobile": {"width": 375, "height": 844},
    "tablet": {"width": 768, "height": 1024},
    "desktop": {"width": 1280, "height": 980},
    "wide": {"width": 1920, "height": 1080},
}


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
        os.environ["JWT_SECRET"].encode("utf-8"), unsigned.encode("ascii"), hashlib.sha256
    ).digest()
    return f"{unsigned}.{base64.urlsafe_b64encode(signature).rstrip(b'=').decode('ascii')}"


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    report = {}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for name, viewport in VIEWPORTS.items():
            context = browser.new_context(viewport=viewport, is_mobile=name == "mobile")
            context.add_cookies([{"name": "app_session_id", "value": create_session_token(), "url": BASE_URL}])
            page = context.new_page()
            console_errors = []
            page_errors = []
            page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
            page.on("pageerror", lambda error: page_errors.append(str(error)))
            page.goto(f"{BASE_URL}/library", wait_until="networkidle")
            overflow = page.evaluate("document.documentElement.scrollWidth > window.innerWidth")
            controls = page.locator("input, select, button").evaluate_all(
                "elements => elements.map(element => ({ tag: element.tagName, label: element.getAttribute('aria-label') || element.textContent?.trim(), width: Math.round(element.getBoundingClientRect().width), height: Math.round(element.getBoundingClientRect().height) })).filter(item => item.width > 0)"
            )
            small_controls = [control for control in controls if control["height"] < 40 and control["tag"] in {"BUTTON", "SELECT"}]
            screenshot = OUTPUT_DIR / f"library-{name}.png"
            page.screenshot(path=str(screenshot), full_page=True)
            report[name] = {
                "viewport": viewport,
                "horizontalOverflow": overflow,
                "consoleErrors": console_errors,
                "pageErrors": page_errors,
                "smallControls": small_controls,
                "screenshot": str(screenshot),
            }
            context.close()
        browser.close()
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
