#!/usr/bin/env python3

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, unquote

ROOT = "http://10.16.100.202/ftps10/"

MAX_DISPLAY = 5
TRUNCATE_DEPTH = 3

visited = set()


def get_dirs(url):
    r = requests.get(url, timeout=10)
    r.raise_for_status()

    soup = BeautifulSoup(r.text, "html.parser")

    dirs = []

    for a in soup.find_all("a"):
        href = a.get("href")

        if not href:
            continue

        # Parent directory
        if href == "../":
            continue

        # Apache sort/query links
        if href.startswith("?"):
            continue

        # Breadcrumbs / absolute paths
        if href.startswith("/"):
            continue

        # External links
        if href.startswith(("http://", "https://")):
            continue

        # Directories only
        if not href.endswith("/"):
            continue

        dirs.append(href)

    return sorted(set(dirs))


def tree(url, prefix="", depth=0):
    if url in visited:
        return

    visited.add(url)

    try:
        dirs = get_dirs(url)
    except Exception as e:
        print(f"{prefix}└── [ERROR: {e}]")
        return

    # Apply truncation only at or below depth 3
    if depth >= TRUNCATE_DEPTH and len(dirs) > MAX_DISPLAY:
        visible_dirs = dirs[:MAX_DISPLAY]
        hidden_count = len(dirs) - MAX_DISPLAY
    else:
        visible_dirs = dirs
        hidden_count = 0

    total_items = len(visible_dirs) + (1 if hidden_count else 0)

    for idx, d in enumerate(visible_dirs):
        is_last = idx == total_items - 1 and hidden_count == 0

        name = unquote(d.rstrip("/"))

        print(
            prefix +
            ("└── " if is_last else "├── ") +
            name
        )

        tree(
            urljoin(url.rstrip("/") + "/", d),
            prefix + ("    " if is_last else "│   "),
            depth + 1
        )

    if hidden_count:
        print(
            prefix +
            f"└── ({hidden_count} more...)"
        )


if __name__ == "__main__":
    print("ftps3")
    tree(ROOT)
