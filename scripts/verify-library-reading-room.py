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

        region_filter = page.get_by_role("combobox", name="Filter by working region")
        source_filter = page.get_by_role("combobox", name="Filter by source")
        date_filter = page.get_by_role("combobox", name="Filter by filed date")
        sort_filter = page.get_by_role("combobox", name="Sort library artifacts")
        expect(region_filter).to_be_visible()
        expect(source_filter).to_be_visible()
        expect(date_filter).to_be_visible()
        expect(sort_filter).to_be_visible()
        if region_filter.locator("option").count() > 1:
            region_filter.select_option(index=1)
            expect(page.get_by_label("Active library filters")).to_be_visible()
        if source_filter.locator("option").count() > 1:
            source_filter.select_option(index=1)
            expect(page.get_by_label("Active library filters")).to_be_visible()
        date_filter.select_option("last_90_days")
        expect(page.get_by_role("button", name=re.compile(r"^Remove Date: Past 90 days"))).to_be_visible()
        sort_filter.select_option("title_asc")
        expect(sort_filter).to_have_value("title_asc")
        page.get_by_role("button", name="Reset view").click()
        expect(region_filter).to_have_value("all")
        expect(source_filter).to_have_value("all")
        expect(date_filter).to_have_value("all")
        expect(sort_filter).to_have_value("recent")

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
        all_facet = mobile_page.get_by_role("button", name=re.compile(r"^All"))
        expect(all_facet).to_be_visible()
        assert all_facet.evaluate("element => element.getBoundingClientRect().height") >= 44, "Library facets must meet the 44px mobile touch-target minimum"
        assert mobile_page.get_by_role("button", name=re.compile(r"^Star ")).first.evaluate("element => element.getBoundingClientRect().height") >= 44, "Artifact star controls must meet the 44px mobile touch-target minimum"
        assert min(mobile_page.locator(".library-refinement-grid select").evaluate_all("elements => elements.map(element => element.getBoundingClientRect().width)")) >= 130, "Mobile refinement selects must retain readable widths"
        all_facet.focus()
        assert all_facet.evaluate("element => getComputedStyle(element).outlineStyle") != "none", "Library facets must expose a keyboard focus indicator"
        mobile_context.close()

        browser.close()

    assert not page_errors, f"Page errors: {page_errors}"
    assert not console_errors, f"Console errors: {console_errors}"
    assert not response_errors, f"HTTP response errors: {response_errors}"
    print(
        json.dumps(
            {
                "page": "/library",
                "checks": ["hierarchy", "search-empty-state", "clear-search", "metadata-filters", "date-filter", "sort", "reset-view", "facet", "star", "mobile-touch-targets", "mobile-refinement-width", "keyboard-focus", "commonplace-route", "mobile-catalogue"],
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
