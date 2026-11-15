"""List every English string the site shows, and check js/i18n-zh.js covers them.

  python3 i18n/extract.py          -> prints missing strings (exit 1 if any)
  python3 i18n/extract.py --all    -> prints every string, in page order, as JSON

Mirrors js/i18n.js: text nodes outside script/style/svg (whitespace collapsed,
trimmed), plus the attributes alt, aria-label, placeholder, title, data-label,
content of meta description, and <title>. Strings with no letters are skipped.
Extra strings that only JS creates are listed in JS_STRINGS below.
"""
import json, re, sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = ['index.html', 'apply.html', 'booking.html', 'consultancy.html', 'request.html']
ATTRS = ('alt', 'aria-label', 'placeholder', 'title', 'data-label')
SKIP = re.compile(r'^(?:[^A-Za-z]*|[\w.+-]+@[\w.-]+|https?://\S+|WhatsApp \+44 7376 975831)$')

def norm(s):
    return re.sub(r'\s+', ' ', s).strip()

class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.skip, self.in_title = [], 0, False
    def add(self, s):
        s = norm(s)
        if s and not SKIP.match(s):
            self.out.append(s)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('script', 'style', 'svg'):
            self.skip += 1
        if tag == 'title':
            self.in_title = True
        if tag == 'meta' and a.get('name') == 'description':
            self.add(a.get('content') or '')
        if self.skip:
            return
        for k in ATTRS:
            if a.get(k):
                self.add(a[k])
    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'svg') and self.skip:
            self.skip -= 1
        if tag == 'title':
            self.in_title = False
    def handle_data(self, d):
        if self.skip:
            return
        self.add(d)

# strings that only exist in JavaScript (apply.js, request.js)
JS_STRINGS = [
    'Add your name.', 'Add an email we can reply to.', 'Tell us what you’re building, in a line.',
    'Tell us what you want from Shenzhen.', 'That email doesn’t look complete.', 'Choose who would pay.',
    'Sending', 'Send request', 'Copied',
    'What I’m working on', 'What I need', 'More', 'When', 'Who would pay', 'Name', 'Email', 'WhatsApp',
    'Hi Shawn, here’s my request.', 'Sent from the Delta & Bay website', 'Request from',
    'Me', 'My company', 'Not sure yet', 'An investor or client', 'Not sure',
    'Build Sprint application', 'Building', 'Link', 'From Shenzhen', 'Who pays', 'Anything else',
    'Switch to English', '切换到中文',
]

def strings():
    seen, order = set(), []
    for page in PAGES:
        p = P()
        p.feed((ROOT / page).read_text(encoding='utf-8'))
        for s in p.out:
            if s not in seen:
                seen.add(s); order.append(s)
    for s in JS_STRINGS:
        if s not in seen:
            seen.add(s); order.append(s)
    return order

def dictionary():
    src = (ROOT / 'js' / 'i18n-zh.js').read_text(encoding='utf-8')
    body = src[src.index('{'): src.rindex('}') + 1]
    return json.loads(body)

if __name__ == '__main__':
    all_ = strings()
    if '--all' in sys.argv:
        print(json.dumps(all_, ensure_ascii=False, indent=1)); sys.exit(0)
    d = dictionary()
    missing = [s for s in all_ if s not in d]
    unused = [k for k in d if k not in all_]
    for s in missing:
        print('MISSING:', s)
    for s in unused:
        print('unused:', s)
    print(f'{len(all_)} strings, {len(missing)} missing, {len(unused)} unused')
    sys.exit(1 if missing else 0)
