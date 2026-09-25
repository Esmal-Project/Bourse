import concurrent.futures
import datetime
import json
import os
import random
import urllib.request

TARGETS=[
    "https://cdn.tsetmc.com/api/ClosingPrice/GetMarketWatch?market=0&paperTypes%5B0%5D=1&paperTypes%5B1%5D=2&paperTypes%5B2%5D=3&paperTypes%5B3%5D=4&paperTypes%5B4%5D=5&paperTypes%5B5%5D=6&paperTypes%5B6%5D=7&paperTypes%5B7%5D=8&paperTypes%5B8%5D=9&withBestLimits=false&hEven=0&RefID=0",
    "https://www.tsetmc.com/tsev2/data/MarketWatchPlus.aspx?h=0&r=0",
    "http://service.tsetmc.com/tsev2/data/MarketWatchPlus.aspx?h=0&r=0",
    "https://old.tsetmc.com/tsev2/data/MarketWatchPlus.aspx?h=0&r=0",
]
HEADERS={
    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36",
    "Accept":"application/json,text/plain,*/*",
    "Referer":"https://www.tsetmc.com/",
    "Origin":"https://www.tsetmc.com",
}
KNOWN_PROXIES=["http://85.133.190.40:8097"]

def fetch(url, proxy=None, timeout=8):
    handler=urllib.request.ProxyHandler({"http":proxy,"https":proxy}) if proxy else urllib.request.ProxyHandler({})
    opener=urllib.request.build_opener(handler)
    req=urllib.request.Request(url, headers=HEADERS)
    with opener.open(req, timeout=timeout) as res:
        return res.status, res.read(), res.headers.get("content-type","")

def parse_payload(url, body):
    if "MarketWatchPlus.aspx" in url:
        text=body.decode("utf-8","ignore")
        parts=text.split("@")
        if len(parts)<3:
            return None
        rows=[]
        for raw in parts[2].split(";"):
            x=raw.split(",")
            if len(x)<14:
                continue
            rows.append({
                "insCode":x[1] if x[1] else x[0],
                "symbol":x[2],
                "name":x[3],
                "first":x[5],
                "close":x[6],
                "last":x[7],
                "trades":x[8],
                "volume":x[9],
                "value":x[10],
                "min":x[11],
                "max":x[12],
                "yesterday":x[13],
                "flow":x[17],
                "yVal":x[22],
            })
        return {"marketwatch":rows} if rows else None
    try:
        return json.loads(body.decode("utf-8"))
    except Exception:
        return None

def write_result(payload, source, via_proxy):
    rows=payload.get("marketwatch",[]) if isinstance(payload,dict) else []
    out={
        "fetchedAt":datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "source":source,
        "viaProxy":via_proxy,
        "payload":payload,
    }
    os.makedirs("data",exist_ok=True)
    with open("data/market-watch.json","w",encoding="utf-8") as f:
        json.dump(out,f,ensure_ascii=False,separators=(",",":"))
    meta={
        "fetchedAt":out["fetchedAt"],
        "source":source,
        "viaProxy":via_proxy,
        "rowCount":len(rows),
        "symbols":[
            {"symbol":x.get("symbol") or x.get("lva"),
             "name":x.get("name") or x.get("lvc"),
             "insCode":x.get("insCode")}
            for x in rows[:50]
        ],
    }
    with open("data/market-watch-meta.json","w",encoding="utf-8") as f:
        json.dump(meta,f,ensure_ascii=False,separators=(",",":"))
    print("SUCCESS",source,"rows=",len(rows))

def try_one(label, url, proxy):
    try:
        status, body, _ = fetch(url, proxy=proxy)
        if 200 <= status < 300:
            payload=parse_payload(url,body)
            if payload:
                return (payload, label+" -> "+url, bool(proxy))
    except Exception:
        pass
    return None

# 1) Known Iranian proxy first. TSETMC can intermittently reset/block a proxy,
# so retry each route several times before falling back to discovery.
for attempt in range(3):
    for proxy in KNOWN_PROXIES:
        targets = TARGETS if attempt == 0 else TARGETS[:3]
        for target in targets:
            result=try_one(f"known-proxy-{attempt+1}",target,proxy)
            if result:
                write_result(*result)
                raise SystemExit(0)

# 2) Direct access can still work on some runners.
for attempt in range(2):
    for target in TARGETS:
        result=try_one(f"direct-{attempt+1}",target,None)
    if result:
        write_result(*result)
        raise SystemExit(0)

# 3) Discover a small set of Iranian proxies only if the fast paths fail.
def proxy_list():
    url=("https://api.proxyscrape.com/v4/free-proxy-list/get"
         "?request=display_proxies&proxy_format=protocolipport&format=text&country=ir")
    try:
        _, body, _=fetch(url, timeout=8)
        return [x.strip() for x in body.decode("utf-8","ignore").splitlines()
                if x.startswith("http://") or x.startswith("https://")][:30]
    except Exception:
        return []

candidates=[p for p in proxy_list() if p not in KNOWN_PROXIES]
tasks=[(p,target) for p in candidates for target in TARGETS[:2]]
random.shuffle(tasks)

with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
    futures=[pool.submit(try_one,p,target,p) for p,target in tasks]
    for future in concurrent.futures.as_completed(futures):
        result=future.result()
        if result:
            for other in futures:
                other.cancel()
            write_result(*result)
            raise SystemExit(0)

raise SystemExit("All TSETMC market-watch sources failed after retries")
