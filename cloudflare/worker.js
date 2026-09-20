const CORS={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Methods":"GET,OPTIONS",
  "Access-Control-Allow-Headers":"Content-Type"
};

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{"Content-Type":"application/json; charset=utf-8",...CORS}
  });
}

async function upstream(url,label){
  const res=await fetch(url,{headers:{"User-Agent":"Bourse-Terminal/1.0"}});
  const text=await res.text();
  if(!res.ok)return json({error:label+" upstream failed",status:res.status,body:text.slice(0,500)},502);
  try{return json(JSON.parse(text))}catch{
    return new Response(text,{status:200,headers:{...CORS,"Content-Type":res.headers.get("content-type")||"application/json"}});
  }
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
        const upstreamUrl=new URL("https://api.brsapi.ir/Tsetmc/History.php");
        upstreamUrl.searchParams.set("key",key);
        upstreamUrl.searchParams.set("type",type);
        upstreamUrl.searchParams.set("l18",symbol);
        return upstream(upstreamUrl.toString(),"BRSAPI History");
      }

      if(url.pathname==="/tsetmc/search"){
        const query=must(url.searchParams.get("query")||url.searchParams.get("symbol"),"query");
        return upstream("https://cdn.tsetmc.com/api/Instrument/GetInstrumentSearch/"+encodeURIComponent(query),"TSETMC Search");
      }

      if(url.pathname==="/tsetmc/quote"){
        const insCode=must(url.searchParams.get("insCode"),"insCode");
        return upstream("https://cdn.tsetmc.com/api/ClosingPrice/GetClosingPriceInfo/"+encodeURIComponent(insCode),"TSETMC Quote");
      }

      if(url.pathname==="/tsetmc/orderbook"){
        const insCode=must(url.searchParams.get("insCode"),"insCode");
        return upstream("https://cdn.tsetmc.com/api/BestLimits/"+encodeURIComponent(insCode),"TSETMC Orderbook");
      }

      if(url.pathname==="/tsetmc/client-type"){
        const insCode=must(url.searchParams.get("insCode"),"insCode");
        return upstream("https://cdn.tsetmc.com/api/ClientType/GetClientType/"+encodeURIComponent(insCode)+"/1/0","TSETMC ClientType");
      }

      if(url.pathname==="/tsetmc/market-watch"){
        const endpoint="https://cdn.tsetmc.com/api/ClosingPrice/GetMarketWatch?market=0&paperTypes%5B0%5D=1&paperTypes%5B1%5D=2&paperTypes%5B2%5D=3&paperTypes%5B3%5D=4&paperTypes%5B4%5D=5&paperTypes%5B5%5D=6&paperTypes%5B6%5D=7&paperTypes%5B7%5D=8&paperTypes%5B8%5D=9&withBestLimits=false&hEven=0&RefID=0";
        return upstream(endpoint,"TSETMC MarketWatch");
      }

      return json({error:"Not found"},404);
    }catch(error){
      return json({error:error?.message||"Worker error"},400);
    }
  }
};