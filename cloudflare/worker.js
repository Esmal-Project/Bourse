const CORS={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Methods":"GET,OPTIONS",
  "Access-Control-Allow-Headers":"Content-Type"
};
const HEADERS={
  "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36",
  "Accept":"application/json,text/plain,text/csv,text/html,*/*",
  "Referer":"https://www.tsetmc.com/",
  "Origin":"https://www.tsetmc.com"
};

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{"Content-Type":"application/json; charset=utf-8",...CORS}
  });
}
async function fetchUpstream(url){
  return fetch(url,{headers:HEADERS,redirect:"follow"});
}
async function relay(url,label){
  const res=await fetchUpstream(url);
  const text=await res.text();
  if(!res.ok)return json({error:label+" upstream failed",status:res.status,body:text.slice(0,500)},502);
  try{return json(JSON.parse(text))}catch{
    return new Response(text,{status:200,headers:{...CORS,"Content-Type":res.headers.get("content-type")||"text/plain; charset=utf-8"}});
  }
}
async function tryJson(url){
  try{
    const res=await fetchUpstream(url);
    const text=await res.text();
    if(!res.ok)return null;
    return JSON.parse(text);
  }catch{return null}
}
function must(value,name){
  if(!value)throw new Error(name+" is required");
  return value;
}

export default {
  async fetch(request,env){
    if(request.method==="OPTIONS")return new Response(null,{headers:CORS});
    if(request.method!=="GET")return json({error:"Method not allowed"},405);
    const url=new URL(request.url);
    try{
      if(url.pathname==="/tsetmc/history"){
        const symbol=must(url.searchParams.get("symbol")||url.searchParams.get("l18"),"symbol");
        const type=url.searchParams.get("type")==="1"?"1":"0";
        const key=must(env.BRSAPI_KEY,"BRSAPI_KEY");
        const u=new URL("https://api.brsapi.ir/Tsetmc/History.php");
        u.searchParams.set("key",key);u.searchParams.set("type",type);u.searchParams.set("l18",symbol);
        return relay(u.toString(),"BRSAPI History");
      }
      if(url.pathname==="/tsetmc/search"){
        const query=must(url.searchParams.get("query")||url.searchParams.get("symbol"),"query");
        return relay("https://cdn.tsetmc.com/api/Instrument/GetInstrumentSearch/"+encodeURIComponent(query),"TSETMC Search");
      }
      if(url.pathname==="/tsetmc/quote"){
        const insCode=must(url.searchParams.get("insCode"),"insCode");
        return relay("https://cdn.tsetmc.com/api/ClosingPrice/GetClosingPriceInfo/"+encodeURIComponent(insCode),"TSETMC Quote");
      }
      if(url.pathname==="/tsetmc/orderbook"){
        const insCode=must(url.searchParams.get("insCode"),"insCode");
        return relay("https://cdn.tsetmc.com/api/BestLimits/"+encodeURIComponent(insCode),"TSETMC Orderbook");
      }
      if(url.pathname==="/tsetmc/client-type"){
        const insCode=must(url.searchParams.get("insCode"),"insCode");
        return relay("https://cdn.tsetmc.com/api/ClientType/GetClientType/"+encodeURIComponent(insCode)+"/1/0","TSETMC ClientType");
      }
      if(url.pathname==="/tsetmc/market-watch"){
        const webgw="https://webgw.tse.ir/InstrumentProvider/api/v1/MarketWatch/MarketWatchCash/fa";
        const live=await tryJson(webgw);
        if(live?.Items?.length||live?.items?.length||Array.isArray(live)){
          return json(live);
        }
        const cdn="https://cdn.tsetmc.com/api/ClosingPrice/GetMarketWatch?market=0&paperTypes%5B0%5D=1&paperTypes%5B1%5D=2&paperTypes%5B2%5D=3&paperTypes%5B3%5D=4&paperTypes%5B4%5D=5&paperTypes%5B5%5D=6&paperTypes%5B6%5D=7&paperTypes%5B7%5D=8&paperTypes%5B8%5D=9&withBestLimits=false&hEven=0&RefID=0";
        return relay(cdn,"TSETMC MarketWatch");
      }
      if(url.pathname==="/tsetmc/live-instrument"){
        const instrumentId=must(url.searchParams.get("instrumentId"),"instrumentId");
        return relay("https://webgw.tse.ir/InstrumentProvider/api/v1/Instrument/LiveInstrumentByIdQuery/fa?InstrumentId="+encodeURIComponent(instrumentId),"TSE Live Instrument");
      }
      if(url.pathname==="/tsetmc/live-client-type"){
        const instrumentId=must(url.searchParams.get("instrumentId"),"instrumentId");
        return relay("https://webgw.tse.ir/InstrumentProvider/api/v1/Instrument/InstrumentClientType/fa?InstrumentId="+encodeURIComponent(instrumentId),"TSE Live ClientType");
      }
      if(url.pathname==="/tsetmc/market-time"){
        return relay("https://webgw.tse.ir/api/v1/PublicData/MarketDate/fa","TSE MarketTime");
      }
      return json({error:"Not found"},404);
    }catch(error){
      return json({error:error?.message||"Worker error"},400);
    }
  }
};