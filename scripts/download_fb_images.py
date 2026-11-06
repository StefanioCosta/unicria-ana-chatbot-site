#!/usr/bin/env python3
"""Download unique Unicria Facebook page images at best available resolution."""
import json, os, re, urllib.request

RAW = "/home/z/my-project/scripts/fb_urls_raw.json"
OUT = "/home/z/my-project/download/unicria_site/assets"
os.makedirs(OUT, exist_ok=True)

with open(RAW) as f:
    data = json.load(f)

urls = json.loads(data["data"]["result"])

# Group by unique image id (the filename part before ?)
groups = {}  # id -> list of urls
order = []
for u in urls:
    m = re.search(r"/(\d+_\d+_\d+_n\.jpg)", u)
    if not m:
        continue
    key = m.group(1)
    if key not in groups:
        groups[key] = []
        order.append(key)
    groups[key].append(u)

def size_score(u):
    # prefer larger variants by parsing stp/ctp params
    m = re.findall(r"[sc](\d+)x(\d+)", u)
    if not m:
        return 0
    return max(int(w) * int(h) for w, h in m)

names = {}
first = True
for key in order:
    best = max(groups[key], key=size_score)
    if first:
        # first unique image on photos page = cover photo (fb50 crop appears first)
        name = "cover.jpg"
        first = False
    else:
        # second = profile pic
        idx = len(names)
        name = f"photo_{idx}.jpg"
    names[key] = name
    try:
        req = urllib.request.Request(best, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            content = r.read()
        with open(os.path.join(OUT, name), "wb") as f:
            f.write(content)
        print(f"OK {name} <- {key} ({len(content)//1024} KB) score={size_score(best)}")
    except Exception as e:
        print(f"FAIL {name} <- {key}: {e}")

print("\nDownloaded:", sorted(os.listdir(OUT)))
