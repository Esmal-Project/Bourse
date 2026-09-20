import json,urllib.request,urllib.error,datetime,os,random

TARGETS=[
"https://cdn.tsetmc.com/api/ClosingPrice/GetMarketWatch?market=0&paperTypes%5B0%5D=1&paperTypes%5B1%5D=2&paperTypes%5B2%5D=3&paperTypes%5B3%5D=4&paperTypes%5B4%5D=5&paperTypes%5B5%5D=6&paperTypes%5B6%5D=7&paperTypes%5B7%5D=8&paperTypes%5B8%5D=9&withBestLimits=false&hEven=0&RefID=0",
"https://www.tsetmc.com/tsev2/data/MarketWatchPlus.aspx?h=0&r=0",
"http://service.tsetmc.com/tsev2/data/MarketWatchPlus.aspx?h=0&r=0"
]
HEADERS={
"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36",
"Accept":"application/json,text/plain,*/*",
"Referer":"https://www.tsetmc.com/",
"Origin":"https://www.tsetmc.com"
}

def get(url,proxy=None,timeout=8):
    handler=urllib.request.ProxyHandler({"http":proxy,"https":proxy}) if proxy else urllib.request.ProxyHandler({})
    opener=urllib.request.build_opener(handler)
    req=urllib.request.Request(url,headers=HEADERS)
    with opener.open(req,timeout=timeout) as r:
        return r.status,r.read(),r.headers.get("content-type","")

def parse_payload(url,body,ctype):
    if "MarketWatchPlus.aspx" in url:
        text=body.decode("utf-8","ignore")
        parts=text.split("@")
        if len(parts)<3:return None
        rows=[]
        for raw in parts[2].split(";"):
            x=raw.split(",")
            if len(x)<14:continue
            try:
                rows.append({
                    "insCode":x[1] if x[1] else x[0],
                    "symbol":x[2],"name":x[3],
                    "first":x[5],"close":x[6],"last":x[7],
                    "trades":x[8],"volume":x[9],"value":x[10],
                    "min":x[11],"max":x[12],"yesterday":x[13]
                })
            except Exception: pass
        if not rows:return None
        return {"marketwatch":rows}
    data=json.loads(body.decode("utf-8"))
    return data

def proxy_list():
    url=("https://api.proxyscrape.com/v4/free-proxy-list/get"
         "?request=display_proxies&proxy_format=protocolipport&format=text&country=ir")
    try:
        _,body,_=get(url,timeout=10)
        out=[]
        for line in body.decode("utf-8","ignore").splitlines():
            line=line.strip()
            if line.startswith("http://") or line.startswith("https://"):
                out.append(line)
        return out[:40]
    except Exception:
        return []

sources=[("direct",t,None) for t in TARGETS]
proxies=proxy_list()
random.shuffle(proxies)
for p in proxies:
    for target in TARGETS[:2]:
        sources.append((p,target,p))

last=None
for label,url,proxy in sources:
    try:
        status,body,ctype=get(url,proxy=proxy)
        payload=parse_payload(url,body,ctype)
        if payload:
            out={
                "fetchedAt":datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "source":label+" -> "+url,
                "viaProxy":bool(proxy),
                "payload":payload
            }
            os.makedirs("data",exist_ok=True)
            with open("data/market-watch.json","w",encoding="utf-8") as f:
                json.dump(out,f,ensure_ascii=False,separators=(",",":"))
            print("SUCCESS",label,"rows=",len(payload.get("marketwatch",[])))
            raise SystemExit(0)
        last=f"{label}: invalid payload"
    except Exception as e:
        last=f"{label}: {type(e).__name__}: {e}"

raise SystemExit("All TSETMC market-watch sources failed. Last error: "+str(last))
