#!/usr/bin/env python3
"""Download Unicria FB images at max resolution by swapping resize params."""
import json, os, re, urllib.request

RAW = "/home/z/my-project/scripts/fb_urls_raw.json"
OUT = "/home/z/my-project/download/unicria_site/assets"
os.makedirs(OUT, exist_ok=True)

with open(RAW) as f:
    data = json.load(f)
urls = json.loads(data["data"]["result"])

groups, order = {}, []
for u in urls:
    m = re.search(r"/(\d+_\d+_\d+_n\.jpg)", u)
    if not m:
        continue
    k = m.group(1)
    if k not in groups:
        groups[k] = []
        order.append(k)
    groups[k].append(u)

def try_download(u):
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
        return urllib.request.urlopen(req, timeout=25).read()
    except Exception:
        return None

def get_big(u):
    """Try progressively larger resize targets (only touch ctp; stp is signature-bound)."""
    best = try_download(u)
    best_len = len(best) if best else 0
    for size in ["s960x960", "s720x720", "s640x640", "s480x480"]:
        cand = re.sub(r"ctp=[sp]\d+x\d+", f"ctp={size}", u)
        data = try_download(cand)
        if data and len(data) > best_len * 1.3:
            best, best_len = data, len(data)
    return best

names, first = {}, True
for key in order:
    if first:
        name, first = "cover.jpg", False
    else:
        name = f"photo_{len(names)}.jpg"
    names[key] = name
    best_url = max(groups[key], key=lambda u: max([int(a)*int(b) for a,b in re.findall(r"[sc](\d+)x(\d+)", u)] or [0]))
    content = get_big(best_url)
    if content:
        with open(os.path.join(OUT, name), "wb") as f:
            f.write(content)
        print(f"OK {name} <- {key} ({len(content)//1024} KB)")
    else:
        print(f"FAIL {name}")

print("Files:", sorted(os.listdir(OUT)))
