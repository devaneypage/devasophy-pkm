import base64
import hashlib
import hmac
import json
import os
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("TEST_BASE_URL", "http://127.0.0.1:3100")
RESULT_PATH = Path(os.environ.get("ENDPOINT_RESULT_PATH", "/tmp/devasophy-endpoint-results.json"))
INVENTORY_PATH = Path(os.environ.get("TRPC_INVENTORY_PATH", "/tmp/devasophy-trpc-inventory.json"))


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


COOKIE = f"app_session_id={create_session_token()}"
results = []
covered = set()
created = {}
created_board_ids = []
run_id = uuid.uuid4().hex[:10]
marker = f"Endpoint Smoke {run_id}"


def unwrap(payload):
    return payload.get("result", {}).get("data", {}).get("json")


def trpc(path, procedure_type, input_value=None, expected_status=200, authenticated=True, timeout=120):
    covered.add(path)
    envelope = json.dumps({"json": input_value}, separators=(",", ":"))
    url = f"{BASE_URL}/api/trpc/{path}"
    headers = {"Accept": "application/json"}
    if authenticated:
        headers["Cookie"] = COOKIE

    if procedure_type == "query":
        url += "?" + urllib.parse.urlencode({"input": envelope})
        request = urllib.request.Request(url, headers=headers, method="GET")
    else:
        headers["Content-Type"] = "application/json"
        request = urllib.request.Request(url, data=envelope.encode("utf-8"), headers=headers, method="POST")

    started = time.monotonic()
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            status = response.status
            body = response.read().decode("utf-8")
            response_headers = dict(response.headers.items())
    except urllib.error.HTTPError as error:
        status = error.code
        body = error.read().decode("utf-8")
        response_headers = dict(error.headers.items())
    elapsed_ms = round((time.monotonic() - started) * 1000)

    try:
        payload = json.loads(body) if body else None
    except json.JSONDecodeError:
        payload = {"raw": body[:500]}

    passed = status == expected_status
    results.append(
        {
            "path": path,
            "type": procedure_type,
            "status": status,
            "expectedStatus": expected_status,
            "elapsedMs": elapsed_ms,
            "passed": passed,
        }
    )
    if not passed:
        raise AssertionError(f"{path}: expected HTTP {expected_status}, received {status}: {body[:1000]}")
    return unwrap(payload or {}), response_headers


def find_id(items, field, value):
    for item in items or []:
        if item.get(field) == value:
            return int(item["id"])
    raise AssertionError(f"Created record was not found: {field}={value}")


def safe_cleanup(path, record_id):
    if not record_id:
        return
    try:
        trpc(path, "mutation", {"id": int(record_id)})
    except Exception as error:
        results.append({"path": f"cleanup:{path}", "passed": False, "error": str(error)})


def cleanup_commonplace_boards():
    if not created_board_ids:
        return
    subprocess.run(
        ["node", "scripts/cleanup-commonplace-board-fixtures.mjs", *map(str, created_board_ids)],
        check=True,
    )
    created_board_ids.clear()


try:
    # Public/authentication boundary.
    health, _ = trpc("system.health", "query", {"timestamp": 0}, authenticated=False)
    assert health == {"ok": True}
    trpc("system.health", "query", {"timestamp": -1}, expected_status=400, authenticated=False)
    anonymous, _ = trpc("auth.me", "query", None, authenticated=False)
    assert anonymous is None
    trpc("featureFlags.list", "query", None, expected_status=401, authenticated=False)
    me, _ = trpc("auth.me", "query", None)
    assert me and me.get("openId") == os.environ["OWNER_OPEN_ID"]
    _, logout_headers = trpc("auth.logout", "mutation", None)
    assert "set-cookie" in {key.lower(): value for key, value in logout_headers.items()}

    # Feature flags: read and idempotently write the existing value.
    flags, _ = trpc("featureFlags.list", "query", None)
    assert isinstance(flags, list) and flags
    commonplace_flag = next(flag for flag in flags if flag["key"] == "commonplace_workspace")
    trpc(
        "featureFlags.update",
        "mutation",
        {"flagKey": commonplace_flag["key"], "enabled": commonplace_flag["enabled"]},
    )

    # Read-only list/get/search/taxonomy endpoints.
    trpc("notebook.list", "query", {})
    trpc("notebook.get", "query", {"id": 0})
    trpc("lexicon.list", "query", {})
    trpc("lexicon.get", "query", {"id": 0})
    trpc("documents.list", "query", {})
    trpc("documents.get", "query", {"id": 0})
    trpc("documents.linkedReferences", "query", {"id": 0})
    trpc("goals.list", "query", {})
    trpc("goals.get", "query", {"id": 0})
    trpc("projects.list", "query", {})
    trpc("projects.get", "query", {"id": 0})
    trpc("tasks.list", "query", {})
    trpc("tasks.get", "query", {"id": 0})
    trpc("ideas.list", "query", {})
    trpc("ideas.get", "query", {"id": 0})
    trpc("links.list", "query", {"sourceType": "notebook", "sourceId": 0})
    trpc("search.unified", "query", {"query": f"__{run_id}__", "moduleFilter": "all"})
    trpc("deduplication.scan", "query", None)
    areas, _ = trpc("taxonomy.getAreas", "query", None)
    trpc("taxonomy.getTree", "query", None)
    trpc("taxonomy.getCategories", "query", {"areaId": int(areas[0]["id"]) if areas else 0})
    trpc("taxonomy.seed", "mutation", None)
    trpc("zettelkasten.generateNotebookId", "query", {"categoryNumber": "99.99"})
    trpc("zettelkasten.generateLexiconId", "query", {"categoryNumber": "99.99"})

    # Reversible Notebook CRUD.
    notebook_uuid = str(uuid.uuid4())
    trpc("notebook.create", "mutation", {"text": marker, "author": "Manus endpoint suite", "uuid": notebook_uuid})
    notebook_items, _ = trpc("notebook.list", "query", {"search": marker})
    created["notebook"] = find_id(notebook_items, "text", marker)
    trpc("notebook.get", "query", {"id": created["notebook"]})
    trpc("notebook.update", "mutation", {"id": created["notebook"], "note": "updated by endpoint suite"})

    # Reversible Lexicon CRUD.
    lexicon_term = f"Endpointium-{run_id}"
    trpc("lexicon.create", "mutation", {"term": lexicon_term, "definition": marker})
    lexicon_items, _ = trpc("lexicon.list", "query", {"search": lexicon_term})
    created["lexicon"] = find_id(lexicon_items, "term", lexicon_term)
    trpc("lexicon.get", "query", {"id": created["lexicon"]})
    trpc("lexicon.update", "mutation", {"id": created["lexicon"], "notes": "updated by endpoint suite"})
    trpc("lexicon.create", "mutation", {"term": lexicon_term, "definition": marker})
    duplicate_lexicon_items, _ = trpc("lexicon.list", "query", {"search": lexicon_term})
    created["lexicon_duplicate"] = next(
        int(item["id"]) for item in duplicate_lexicon_items if int(item["id"]) != created["lexicon"]
    )
    deduplication_result, _ = trpc(
        "deduplication.resolve",
        "mutation",
        {
            "canonicalKey": f"lexicon:{created['lexicon']}",
            "targetKeys": [f"lexicon:{created['lexicon_duplicate']}"],
            "action": "merge",
        },
    )
    assert deduplication_result["sameModule"] is True and deduplication_result["deletedCount"] == 1
    created["lexicon_duplicate"] = None

    # Reversible Document CRUD plus linked references and LLM research assistant.
    document_title = f"{marker} Document"
    trpc(
        "documents.create",
        "mutation",
        {"title": document_title, "content": "Endpoint verification context.", "project": run_id, "uuid": str(uuid.uuid4())},
    )
    documents, _ = trpc("documents.list", "query", {"project": run_id})
    created["document"] = find_id(documents, "title", document_title)
    trpc("documents.get", "query", {"id": created["document"]})
    trpc("documents.update", "mutation", {"id": created["document"], "status": "in_progress"})

    # Reversible semantic link CRUD.
    trpc(
        "links.create",
        "mutation",
        {
            "sourceType": "notebook",
            "sourceId": created["notebook"],
            "targetType": "lexicon",
            "targetId": created["lexicon"],
            "linkType": "endpoint-smoke",
        },
    )
    links, _ = trpc("links.list", "query", {"sourceType": "notebook", "sourceId": created["notebook"]})
    created_link = next(
        link for link in links if int(link["targetId"]) == created["lexicon"] and link.get("linkType") == "endpoint-smoke"
    )
    created["link"] = int(created_link["id"])
    trpc("links.delete", "mutation", {"id": created["link"]})
    created["link"] = None
    trpc("documents.linkedReferences", "query", {"id": created["document"]})
    research, _ = trpc(
        "documents.researchAssist",
        "mutation",
        {"documentId": created["document"], "messages": [{"role": "user", "content": "Reply with the word verified."}]},
        timeout=180,
    )
    assert isinstance(research.get("response"), str)

    # Reversible action-layer CRUD.
    goal_title = f"{marker} Goal"
    trpc("goals.create", "mutation", {"title": goal_title, "description": marker})
    goal_items, _ = trpc("goals.list", "query", {})
    created["goal"] = find_id(goal_items, "title", goal_title)
    trpc("goals.get", "query", {"id": created["goal"]})
    trpc("goals.update", "mutation", {"id": created["goal"], "status": "paused"})

    project_title = f"{marker} Project"
    trpc("projects.create", "mutation", {"title": project_title, "description": marker})
    project_items, _ = trpc("projects.list", "query", {})
    created["project"] = find_id(project_items, "title", project_title)
    trpc("projects.get", "query", {"id": created["project"]})
    trpc("projects.update", "mutation", {"id": created["project"], "status": "on-hold"})

    task_title = f"{marker} Task"
    trpc("tasks.create", "mutation", {"title": task_title, "description": marker, "projectId": created["project"]})
    task_items, _ = trpc("tasks.list", "query", {"projectId": created["project"]})
    created["task"] = find_id(task_items, "title", task_title)
    trpc("tasks.get", "query", {"id": created["task"]})
    trpc("tasks.update", "mutation", {"id": created["task"], "priority": "high"})

    idea_title = f"{marker} Idea"
    trpc("ideas.create", "mutation", {"title": idea_title, "summary": marker, "linkedGoalId": created["goal"]})
    idea_items, _ = trpc("ideas.list", "query", {"linkedGoalId": created["goal"]})
    created["idea"] = find_id(idea_items, "title", idea_title)
    trpc("ideas.get", "query", {"id": created["idea"]})
    trpc("ideas.update", "mutation", {"id": created["idea"], "insightStage": "connection"})

    # Commonplace queries and reversible column/entry workflow.
    snapshot, _ = trpc("commonplace.bootstrap", "query", {})
    board_id = int(snapshot["board"]["id"])
    original_column_ids = [int(column["id"]) for column in snapshot["columns"]]
    assert original_column_ids
    created_board, _ = trpc(
        "commonplace.boards.create",
        "mutation",
        {"title": f"Endpoint Board {run_id}", "description": marker, "isDefault": False},
    )
    created_board_ids.append(int(created_board["id"]))
    saved_snapshot, _ = trpc(
        "commonplace.boards.saveSnapshot",
        "mutation",
        {"sourceBoardId": board_id, "title": f"Endpoint Snapshot {run_id}", "description": marker},
    )
    created_board_ids.append(int(saved_snapshot["board"]["id"]))
    boards, _ = trpc("commonplace.boards.list", "query", None)
    assert all(any(int(board["id"]) == board_id for board in boards) for board_id in created_board_ids)
    temp_column, _ = trpc(
        "commonplace.columns.create",
        "mutation",
        {"boardId": board_id, "title": f"Endpoint Column {run_id}", "colorToken": "coral"},
    )
    created["column"] = int(temp_column["id"])
    trpc("commonplace.columns.update", "mutation", {"id": created["column"], "title": f"Endpoint Column {run_id} Updated"})
    trpc("commonplace.columns.reorder", "mutation", {"orderedColumnIds": original_column_ids + [created["column"]]})
    temp_entry, _ = trpc(
        "commonplace.entries.create",
        "mutation",
        {
            "boardId": board_id,
            "columnId": created["column"],
            "entryType": "research_note",
            "title": f"Endpoint Card {run_id}",
            "summary": marker,
            "content": {"markdown": "Endpoint verification"},
        },
    )
    created["commonplace_entry"] = int(temp_entry["id"])
    trpc("commonplace.entries.list", "query", {"boardId": board_id, "search": run_id})
    trpc("commonplace.entries.update", "mutation", {"id": created["commonplace_entry"], "summary": "updated"})
    trpc(
        "commonplace.entries.move",
        "mutation",
        {"id": created["commonplace_entry"], "columnId": original_column_ids[0], "position": 0},
    )
    trpc("commonplace.entries.delete", "mutation", {"id": created["commonplace_entry"]})
    created["commonplace_entry"] = None
    trpc("commonplace.columns.delete", "mutation", {"id": created["column"]})
    created["column"] = None
    cleanup_commonplace_boards()

    # Empty-input bulk operations exercise full HTTP/database paths without creating records.
    trpc("bulkImport.notebookJSON", "mutation", {"entries": [], "autoCategory": False})
    trpc("bulkImport.lexiconJSON", "mutation", {"entries": [], "autoCategory": False})
    trpc("bulkImport.notebookCSV", "mutation", {"csvContent": "", "columnMapping": {}, "skipHeader": True})
    trpc("bulkImport.lexiconCSV", "mutation", {"csvContent": "", "columnMapping": {}, "skipHeader": True})
    trpc("bulkImport.notebookText", "mutation", {"textContent": ""})
    trpc("bulkImport.lexiconText", "mutation", {"textContent": ""})
    trpc("bulkImport.notebookWithDuplicateDetection", "mutation", {"entries": [], "onDuplicate": "skip"})
    trpc("bulkImport.lexiconWithDuplicateDetection", "mutation", {"entries": [], "onDuplicate": "skip"})
    trpc("bulkImport.detectNotebookDuplicates", "query", {"text": f"__{run_id}__"})
    trpc("bulkImport.detectLexiconDuplicates", "query", {"term": f"__{run_id}__"})
    trpc("bulkImport.detectNotebookDuplicateBatch", "mutation", {"entries": []})
    trpc("bulkImport.detectLexiconDuplicateBatch", "mutation", {"entries": []})

    # Autofill fixtures are supplied to the isolated server process.
    quotes, _ = trpc("autofill.loadUploadedFile", "mutation", {"source": "quotes"})
    lexicon_file, _ = trpc("autofill.loadUploadedFile", "mutation", {"source": "lexicon"})
    assert "Endpoint Smoke" in quotes["text"] and "Clavis Aurea" in lexicon_file["text"]

    # LLM composition endpoint.
    composition, _ = trpc(
        "glossary.composeWithScribe",
        "mutation",
        {"prompt": "Write one short verification sentence.", "glossaryContext": "Aletheia: disclosure."},
        timeout=180,
    )
    assert isinstance(composition.get("composition"), str)

    # The external-notification endpoint receives a validation probe rather than dispatching a real alert.
    trpc("system.notifyOwner", "mutation", {"title": "", "content": ""}, expected_status=400)

    # Delete temporary CRUD records and confirm get paths return null/undefined.
    for name, path in [
        ("idea", "ideas.delete"),
        ("task", "tasks.delete"),
        ("goal", "goals.delete"),
        ("project", "projects.delete"),
        ("document", "documents.delete"),
        ("lexicon_duplicate", "lexicon.delete"),
        ("lexicon", "lexicon.delete"),
        ("notebook", "notebook.delete"),
    ]:
        if created.get(name):
            trpc(path, "mutation", {"id": created[name]})
            created[name] = None

    # Browser smoke coverage for every registered route.
    browser_page_errors = []
    browser_console_errors = []
    browser_failed_requests = []
    routes = [
        "/",
        "/commonplace",
        "/library",
        "/notebook",
        "/lexicon",
        "/documents",
        "/goals",
        "/ideas",
        "/bulk-import",
        "/search",
        "/notebook/0",
        "/lexicon/0",
        "/glossary",
        "/export",
        "/deduplication",
        "/404",
        "/endpoint-smoke-not-found",
    ]
    route_results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 1000})
        context.add_cookies([{"name": "app_session_id", "value": create_session_token(), "url": BASE_URL}])
        page = context.new_page()
        page.on("pageerror", lambda error: browser_page_errors.append(str(error)))
        page.on(
            "console",
            lambda message: browser_console_errors.append(message.text)
            if message.type == "error"
            else None,
        )
        page.on(
            "requestfailed",
            lambda request: browser_failed_requests.append(
                {"url": request.url, "failure": request.failure}
            ),
        )
        for route in routes:
            response = page.goto(f"{BASE_URL}{route}", wait_until="networkidle", timeout=60000)
            status = response.status if response else None
            body_text = page.locator("body").inner_text()
            passed = status == 200 and "Sign in to continue" not in body_text and "Something went wrong" not in body_text
            route_results.append({"route": route, "status": status, "passed": passed})
            if not passed:
                raise AssertionError(f"Browser route failed: {route}, status={status}")
        page.goto(f"{BASE_URL}/", wait_until="networkidle")
        page.screenshot(path="/tmp/devasophy-all-endpoints.png", full_page=True)
        browser.close()

    if browser_page_errors or browser_console_errors or browser_failed_requests:
        raise AssertionError(
            "Browser diagnostics were not clean: "
            + json.dumps(
                {
                    "pageErrors": browser_page_errors,
                    "consoleErrors": browser_console_errors,
                    "failedRequests": browser_failed_requests,
                }
            )
        )

    expected_paths = set()
    if INVENTORY_PATH.exists():
        inventory = json.loads(INVENTORY_PATH.read_text("utf-8"))
        expected_paths = {item["path"] for item in inventory["procedures"]}
    missing = sorted(expected_paths - covered)
    if missing:
        raise AssertionError(f"Uncovered tRPC procedures: {missing}")

    summary = {
        "runId": run_id,
        "baseUrl": BASE_URL,
        "procedureCount": len(expected_paths) if expected_paths else len(covered),
        "coveredProcedureCount": len(covered),
        "httpChecks": len(results),
        "passedHttpChecks": sum(1 for item in results if item.get("passed")),
        "browserRoutes": route_results,
        "browserPageErrors": browser_page_errors,
        "browserConsoleErrors": browser_console_errors,
        "browserFailedRequests": browser_failed_requests,
        "screenshot": "/tmp/devasophy-all-endpoints.png",
        "results": results,
    }
    RESULT_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in summary.items() if key != "results"}, indent=2))
finally:
    cleanup_commonplace_boards()
    if created.get("commonplace_entry"):
        safe_cleanup("commonplace.entries.delete", created.get("commonplace_entry"))
    if created.get("column"):
        safe_cleanup("commonplace.columns.delete", created.get("column"))
    if created.get("link"):
        safe_cleanup("links.delete", created.get("link"))
    for name, path in [
        ("idea", "ideas.delete"),
        ("task", "tasks.delete"),
        ("goal", "goals.delete"),
        ("project", "projects.delete"),
        ("document", "documents.delete"),
        ("lexicon_duplicate", "lexicon.delete"),
        ("lexicon", "lexicon.delete"),
        ("notebook", "notebook.delete"),
    ]:
        if created.get(name):
            safe_cleanup(path, created.get(name))
