#!/usr/bin/env python3
import json
import os
import sys
import urllib.request
import urllib.error


def fail(msg: str, code: int = 1) -> None:
    print(msg, file=sys.stderr)
    sys.exit(code)


def main() -> None:
    if len(sys.argv) < 2:
        fail("Usage: create_osf_project.py \"Project title\" [description]")
    token = os.getenv("OSF_TOKEN")
    if not token:
        fail("OSF_TOKEN is required.")

    title = sys.argv[1]
    description = sys.argv[2] if len(sys.argv) > 2 else ""

    payload = {
        "data": {
            "type": "nodes",
            "attributes": {
                "title": title,
                "category": "project",
                "public": False,
                "description": description,
            },
        }
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.osf.io/v2/nodes/",
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/vnd.api+json",
            "Accept": "application/vnd.api+json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        fail(f"OSF API error {e.code}: {detail}", 2)

    node_id = body["data"]["id"]
    html = body["data"]["links"]["html"]
    print(f"Created OSF project: {node_id}")
    print(f"URL: {html}")


if __name__ == "__main__":
    main()
