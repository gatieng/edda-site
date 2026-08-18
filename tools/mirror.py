#!/usr/bin/env python3
"""Miroir local du site https://worksite.be/edda/ (copie de travail, lecture seule côté serveur).

Usage: python3 tools/mirror.py [--dest site]
Ne télécharge que ce qui est sous /edda/ ; les ressources externes (Google Fonts,
picsum.photos) sont laissées telles quelles dans le HTML.
"""
import argparse
import os
import re
import sys
import urllib.parse
import urllib.request
from collections import deque

BASE = "https://worksite.be/edda/"
ATTR_RE = re.compile(r'(?:href|src|poster)\s*=\s*["\']([^"\']+)["\']', re.I)
SRCSET_RE = re.compile(r'srcset\s*=\s*["\']([^"\']+)["\']', re.I)
CSS_URL_RE = re.compile(r'url\(\s*["\']?([^"\')]+)["\']?\s*\)', re.I)
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read(), resp.headers.get_content_type()


def refs_from(text, content_type):
    """Toutes les URL brutes référencées par un document."""
    out = []
    if content_type == "text/css":
        out += CSS_URL_RE.findall(text)
    else:
        out += ATTR_RE.findall(text)
        for srcset in SRCSET_RE.findall(text):
            out += [c.strip().split()[0] for c in srcset.split(",") if c.strip()]
    return out


def local_path(dest, url):
    rel = urllib.parse.urlparse(url).path[len(urllib.parse.urlparse(BASE).path):]
    if not rel or rel.endswith("/"):
        rel += "index.html"
    return os.path.join(dest, rel)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dest", default="site")
    args = ap.parse_args()

    queue = deque([BASE + "index.html"])
    seen, saved, failed = set(), [], []

    while queue:
        url = queue.popleft()
        url, _ = urllib.parse.urldefrag(url)
        if url in seen:
            continue
        seen.add(url)

        try:
            body, ctype = fetch(url)
        except Exception as exc:  # 404, timeout, etc. : on note et on continue
            failed.append((url, str(exc)))
            print(f"  ✗ {url} — {exc}")
            continue

        path = local_path(args.dest, url)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as fh:
            fh.write(body)
        saved.append(os.path.relpath(path, args.dest))
        print(f"  ✓ {os.path.relpath(path, args.dest)} ({len(body)} o)")

        if ctype not in ("text/html", "text/css"):
            continue
        text = body.decode("utf-8", "replace")
        for ref in refs_from(text, ctype):
            if ref.startswith(("mailto:", "tel:", "javascript:", "data:", "#")):
                continue
            absolute = urllib.parse.urljoin(url, ref)
            if absolute.startswith(BASE):
                queue.append(absolute)

    print(f"\n{len(saved)} fichiers enregistrés dans {args.dest}/")
    if failed:
        print(f"{len(failed)} échec(s) :")
        for url, err in failed:
            print(f"  - {url} : {err}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
