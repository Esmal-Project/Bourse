import json,urllib.request,datetime,os

URL=("https://cdn.tsetmc.com/api/ClosingPrice/GetMarketWatch"
     "?market=0"
     "&paperTypes%5B0%5D=1&paperTypes%5B1%5D=2&paperTypes%5B2%5D=3"
     "&paperTypes%5B3%5D=4&paperTypes%5B4%5D=5&paperTypes%5B5%5D=6"
     "&paperTypes%5B6%5D=7&paperTypes%5B7%5D=8&paperTypes%5B8%5D=9"
     "&withBestLimits=false&hEven=0&RefID=0")

req=urllib.request.Request(URL,headers={
    "User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/153 Safari/537.36",
    "Accept":"application/json,text/plain,*/*",
    "Referer":"https://www.tsetmc.com/",
    "Origin":"https://www.tsetmc.com"
})
with urllib.request.urlopen(req,timeout=30) as r:
    payload=json.load(r)

out={
    "fetchedAt":datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "source":"TSETMC CDN via GitHub Actions",
    "payload":payload
}
os.makedirs("data",exist_ok=True)
with open("data/market-watch.json","w",encoding="utf-8") as f:
    json.dump(out,f,ensure_ascii=False,separators=(",",":"))
print("saved data/market-watch.json",os.path.getsize("data/market-watch.json"))
