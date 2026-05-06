import json
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

BASE_URL = "https://3000-ifje2eutiwiz033i0279a-c8c3243c.us2.manus.computer"
OUTPUT = Path('/tmp/bulkimport-webtest.json')


def body_text(page):
    try:
        return page.locator('body').inner_text(timeout=5000)
    except Exception:
        return ''


def find_and_click(page, patterns):
    for pattern in patterns:
        locator = page.get_by_role('button', name=pattern)
        try:
            locator.first.wait_for(timeout=5000)
            locator.first.click()
            return True, str(pattern)
        except Exception:
            continue
    return False, None


results = {
    'base_url': BASE_URL,
    'auth_required': False,
    'quotes_preflight_visible': False,
    'lexicon_preflight_visible': False,
    'duplicate_review_visible': False,
    'errors': [],
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1200})
    try:
        page.goto(f"{BASE_URL}/bulk-import", wait_until='networkidle', timeout=30000)
        page.screenshot(path='/tmp/bulkimport-initial.png', full_page=True)
        text = body_text(page)
        if any(token in text.lower() for token in ['sign in', 'log in', 'login', 'continue with google']):
            results['auth_required'] = True
            results['errors'].append('Playwright session reached an unauthenticated state and could not access the authenticated Bulk Import page.')
        else:
            ok, label = find_and_click(page, [r'Load Quotes', r'Quotes'])
            if not ok:
                results['errors'].append('Could not find the Quotes autofill button on the Bulk Import page.')
            else:
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(1500)
                qtext = body_text(page)
                results['quotes_preflight_visible'] = ('valid' in qtext.lower() and 'preview' in qtext.lower()) or ('duplicate' in qtext.lower())
                results['duplicate_review_visible'] = 'duplicate' in qtext.lower() or 'merge' in qtext.lower() or 'replace' in qtext.lower()
                page.screenshot(path='/tmp/bulkimport-quotes.png', full_page=True)

            page.goto(f"{BASE_URL}/bulk-import", wait_until='networkidle', timeout=30000)
            ok, label = find_and_click(page, [r'Load Clavis', r'Clavis Aurea', r'Clavis'])
            if not ok:
                results['errors'].append('Could not find the Clavis autofill button on the Bulk Import page.')
            else:
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(1500)
                ltext = body_text(page)
                results['lexicon_preflight_visible'] = ('valid' in ltext.lower() and 'preview' in ltext.lower()) or ('duplicate' in ltext.lower())
                page.screenshot(path='/tmp/bulkimport-lexicon.png', full_page=True)
    except PlaywrightTimeoutError as exc:
        results['errors'].append(f'Timeout: {exc}')
    except Exception as exc:
        results['errors'].append(str(exc))
    finally:
        browser.close()

OUTPUT.write_text(json.dumps(results, indent=2))
print(json.dumps(results, indent=2))
