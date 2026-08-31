import base64
import hashlib
import hmac
import json
import os
import re
import time
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

BASE_URL = os.environ.get("LIBRARY_TEST_BASE_URL", "http://127.0.0.1:3000")
SCREENSHOT_PATH = Path(os.environ.get("LIBRARY_SCREENSHOT_PATH", "/tmp/devasophy-library-reading-room.png"))


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
    page_errors = []
    console_errors = []
    response_errors = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 1120})
        context.add_cookies(
            [
                {
                    "name": "app_session_id",
                    "value": create_session_token(),
                    "url": BASE_URL,
                }
            ]
        )
        page = context.new_page()
        page.on("pageerror", lambda error: page_errors.append(str(error)))
        page.on(
            "console",
            lambda message: console_errors.append(message.text)
            if message.type == "error"
            else None,
        )
        page.on(
            "response",
            lambda response: response_errors.append(f"{response.status} {response.url}")
            if response.status >= 400
            else None,
        )

        page.goto(f"{BASE_URL}/library", wait_until="networkidle")
        expect(page.get_by_role("heading", name="A reading room for working knowledge.")).to_be_visible()
        expect(page.get_by_role("textbox", name="Search the artifact index")).to_be_visible()
        expect(page.get_by_text("Master Classification Key")).to_be_visible()

        query = page.get_by_role("textbox", name="Search the artifact index")
        query.fill("__nonexistent_library_probe__")
        expect(page.get_by_text("The shelf is clear from this angle.")).to_be_visible()
        page.get_by_role("button", name="Clear search").click()
        expect(page.get_by_text("Catalogue view")).to_be_visible()

        quote_facet = page.get_by_role("button", name=re.compile(r"^Quotes"))
        expect(quote_facet).to_be_visible()
        quote_facet.click()
        expect(quote_facet).to_have_attribute("aria-pressed", "true")

        all_facet = page.get_by_role("button", name=re.compile(r"^All"))
        all_facet.click()
        star_actions = page.locator("button[aria-label^='Star ']")
        if star_actions.count() > 0:
            star_actions.first.click()
            expect(page.get_by_role("button", name="Starred 1")).to_be_visible()

        SCREENSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(SCREENSHOT_PATH), full_page=True)

        page.get_by_role("button", name="Add to Commonplace").click()
        expect(page).to_have_url(f"{BASE_URL}/commonplace")
        page.wait_for_load_state("networkidle")

        mobile_context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        mobile_context.add_cookies(
            [{"name": "app_session_id", "value": create_session_token(), "url": BASE_URL}]
        )
        mobile_page = mobile_context.new_page()
        mobile_page.on("pageerror", lambda error: page_errors.append(str(error)))
        mobile_page.on(
            "console",
            lambda message: console_errors.append(message.text)
            if message.type == "error"
            else None,
        )
        mobile_page.on(
            "response",
            lambda response: response_errors.append(f"{response.status} {response.url}")
            if response.status >= 400
            else None,
        )
        mobile_page.goto(f"{BASE_URL}/library", wait_until="networkidle")
        expect(mobile_page.get_by_role("heading", name="A reading room for working knowledge.")).to_be_visible()
        expect(mobile_page.get_by_role("textbox", name="Search the artifact index")).to_be_visible()
        expect(mobile_page.locator(".library-mobile-card").first).to_be_visible()
        mobile_context.close()

        browser.close()

    assert not page_errors, f"Page errors: {page_errors}"
    assert not console_errors, f"Console errors: {console_errors}"
    assert not response_errors, f"HTTP response errors: {response_errors}"
    print(
        json.dumps(
            {
                "page": "/library",
                "checks": ["hierarchy", "search-empty-state", "clear-search", "facet", "star", "commonplace-route", "mobile-catalogue"],
                "screenshot": str(SCREENSHOT_PATH),
                "pageErrors": page_errors,
                "consoleErrors": console_errors,
                "responseErrors": response_errors,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
