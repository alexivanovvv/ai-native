#!/usr/bin/env python3
"""transcript-qa — read a Google Doc and append Q&A blocks to it.

Uses the Drive API only (export/import roundtrip), because the Docs API is not
enabled in the OAuth client's Cloud project. Reuses the gdrive-admin token
(~/.config/gdrive-admin/token.json, full `drive` scope).
Run via ~/.config/hermes/venv/bin/python.

Commands:
  gdoc_qa.py read   --doc <id-or-url>
      Print the doc's plain text (Drive export).

  gdoc_qa.py append --doc <id-or-url> --json qa.json [--before "1 поток" | --after "intro text"]
      Insert a session sub-heading + Q&A bullet pairs into the doc.
      --before: text of an existing heading/paragraph; the block is inserted
      right before it (i.e. at the end of the previous section).
      --after: text of an existing heading/paragraph; the block is inserted
      right after it (i.e. at the TOP of that section) — use this so newest
      Q&A pairs appear first, not buried at the bottom.
      Without either, the block goes to the end of the doc.

      Mechanism: export doc as HTML -> splice in the new block -> save a .docx
      backup to ~/.cache/transcript-qa/backups/ -> re-upload the HTML (Drive
      converts it back to a Google Doc). Native version history also keeps the
      previous revision. NOTE: comments/suggestions in the doc do not survive
      the roundtrip — fine for plain Q&A docs.

qa.json format:
  {
    "title": "Сессия 1 — 28 июля 2026",
    "items": [
      {"q": "Вопрос…", "a": "Ответ…", "asker": "Имя", "time": "00:15:50"},
      ...
    ]
  }

Rendered to match the AI Native Q&A doc style: question = bold top-level
bullet, answer = nested bullet (no asker names, answers voiced as Alexey).

Deduplication is NOT done here — the caller (Claude) must `read` first and
pass only items not already present.
"""

import argparse
import datetime
import html as htmllib
import json
import re
import sys
from pathlib import Path

import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

TOKEN_FILE = Path.home() / ".config" / "gdrive-admin" / "token.json"
SCOPES = ["https://www.googleapis.com/auth/drive"]
DRIVE = "https://www.googleapis.com/drive/v3"
UPLOAD = "https://www.googleapis.com/upload/drive/v3"
BACKUP_DIR = Path.home() / ".cache" / "transcript-qa" / "backups"

GDOC_MIME = "application/vnd.google-apps.document"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def load_creds():
    if not TOKEN_FILE.exists():
        sys.exit(f"No token at {TOKEN_FILE}. Run gdrive-share-admin's `gdrive_perms.py auth` first.")
    creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            TOKEN_FILE.write_text(creds.to_json())
        else:
            sys.exit("Token invalid and not refreshable. Re-run `gdrive_perms.py auth`.")
    return creds


def doc_id_from(arg):
    m = re.search(r"/document/d/([a-zA-Z0-9_-]+)", arg)
    return m.group(1) if m else arg


def export(creds, doc_id, mime):
    r = requests.get(
        f"{DRIVE}/files/{doc_id}/export",
        headers={"Authorization": f"Bearer {creds.token}"},
        params={"mimeType": mime},
    )
    if r.status_code != 200:
        sys.exit(f"Export failed ({r.status_code}): {r.text[:500]}")
    return r.content


def cmd_read(args):
    creds = load_creds()
    text = export(creds, doc_id_from(args.doc), "text/plain").decode("utf-8")
    sys.stdout.write(text)


# Real nested lists (<ul> inside <li>) so Google's HTML importer produces a
# two-level list: ● bold question / ○ plain answer. Faking nesting with
# margin-left keeps everything on list level 1 — don't do that.
# Indents per Alexey: ● question at 36pt, ○ answer at 64pt.
# line-height 1.2, 6pt after every paragraph (Google maps element padding
# to space above/below).
LI_BASE = ('color:#000000;font-size:12pt;line-height:1.2;margin-right:0;'
           'font-family:&quot;Arial&quot;;margin-top:0;margin-bottom:0;'
           'text-align:left')
LI_Q_STYLE = LI_BASE + ';margin-left:36pt;padding:0 0 6pt 0'
LI_A_STYLE = LI_BASE + ';margin-left:64pt;padding:0 0 6pt 0'
QA_PAIR = ('<li style="' + LI_Q_STYLE + '"><span style="font-weight:700">{q}</span>'
           '<ul style="padding:0;margin:0"><li style="' + LI_A_STYLE + '">'
           '<span style="font-weight:400">{a}</span></li></ul></li>')
H3 = ('<h3 style="padding-top:14pt;margin:0;color:#434343;font-weight:600;padding-left:0;'
      'font-size:14pt;padding-bottom:4pt;line-height:1.15;page-break-after:avoid;'
      'font-family:&quot;Montserrat&quot;;text-align:left;padding-right:0">{}</h3>')
SPACER = ('<p style="padding:0;margin:0;font-size:12pt;font-family:&quot;Arial&quot;;'
          'line-height:1.15;height:12pt;text-align:left"><span></span></p>')


def build_block(payload):
    esc = htmllib.escape
    parts = []
    title = payload.get("title", "").strip()
    if title:
        parts.append(H3.format(esc(title)))
    lis = []
    for it in payload.get("items", []):
        q = it.get("q", "").strip()
        a = it.get("a", "").strip()
        lis.append(QA_PAIR.format(q=esc(q), a=esc(a)))
    parts.append('<ul style="padding:0;margin:0">' + "".join(lis) + "</ul>")
    parts.append(SPACER)
    return "".join(parts)


def find_insert_pos(raw_html, before_text, after_text):
    """Position right before/after the block element whose visible text contains
    before_text/after_text. Matches headings (h1-6) and paragraphs (p), since the
    anchor is often an intro paragraph, not a heading. Cyrillic in the export is
    entity-encoded, so compare unescaped text."""
    target, mode = (before_text, "before") if before_text else (after_text, "after")
    if target:
        for m in re.finditer(r"<(h[1-6]|p)[^>]*>(.*?)</\1>", raw_html, re.S):
            visible = htmllib.unescape(re.sub(r"<[^>]+>", "", m.group(2)))
            if target.lower() in visible.lower():
                return m.start() if mode == "before" else m.end()
        sys.exit(f"Element containing '{target}' not found in the doc.")
    m = re.search(r"</body>", raw_html)
    return m.start() if m else len(raw_html)


def cmd_append(args):
    creds = load_creds()
    doc_id = doc_id_from(args.doc)
    payload = json.loads(Path(args.json).read_text())
    if not payload.get("items"):
        sys.exit("No items to append.")

    raw = export(creds, doc_id, "text/html").decode("utf-8")

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = BACKUP_DIR / f"{doc_id}-{stamp}.docx"
    backup.write_bytes(export(creds, doc_id, DOCX_MIME))

    if args.before and args.after:
        sys.exit("Use only one of --before / --after.")
    pos = find_insert_pos(raw, args.before, args.after)
    new_html = raw[:pos] + build_block(payload) + raw[pos:]

    r = requests.patch(
        f"{UPLOAD}/files/{doc_id}",
        headers={"Authorization": f"Bearer {creds.token}", "Content-Type": "text/html; charset=utf-8"},
        params={"uploadType": "media"},
        data=new_html.encode("utf-8"),
    )
    if r.status_code != 200:
        sys.exit(f"Upload failed ({r.status_code}): {r.text[:800]} — doc untouched? Backup at {backup}")
    n = len(payload["items"])
    if args.before:
        where = f"before heading '{args.before}'"
    elif args.after:
        where = f"right after '{args.after}' (top of section)"
    else:
        where = "at end of doc"
    print(f"Appended {n} Q&A pair(s) {where}. Backup: {backup}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p_read = sub.add_parser("read", help="print doc plain text")
    p_read.add_argument("--doc", required=True, help="doc id or full URL")
    p_read.set_defaults(func=cmd_read)
    p_app = sub.add_parser("append", help="append Q&A block")
    p_app.add_argument("--doc", required=True, help="doc id or full URL")
    p_app.add_argument("--json", required=True, help="path to qa.json")
    p_app.add_argument("--before", default=None, help="insert before the heading/paragraph containing this text")
    p_app.add_argument("--after", default=None, help="insert after the heading/paragraph containing this text (puts new items at top of that section)")
    p_app.set_defaults(func=cmd_append)
    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
