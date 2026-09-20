const CONFIG=window.BOURSE_CONFIG||{worker:"https://brsapi-proxy.yasharesmaeili.workers.dev",historyPath:"/tsetmc/history"};

function requirePath(name){
  const path=CONFIG[name];
  if(!path)throw new Error("مسیر "+name+" هنوز در Cloudflare Worker متصل نشده است");
  return path;
}
function routeUrl(path,params={}){
  let route=path;
  for(const [key,value] of Object.entries(params)){
    route=route.replaceAll("{"+key+"}",encodeURIComponent(value)).replaceAll(":"+key,encodeURIComponent(value));
  }
  const pending=Object.entries(params).filter(([key])=>route.includes("{"+key+"}")||route.includes(":"+key));
  if(pending.length)throw new Error("پارامتر مسیر ناقص است");
  const qs=Object.entries(params).filter(([key])=>!path.includes("{"+key+"}")&&!path.includes(":"+key));
  if(qs.length)route+=(route.includes("?")?"&":"?")+qs.map(([k,v])=>encodeURIComponent(k)+"="+encodeURIComponent(v)).join("&");
  return CONFIG.worker+route;
}
async function requestJson(url,label){
  const res=await fetch(url,{cache:"no-store"});
  const text=await res.text();
  if(!res.ok)throw new Error(label+" request failed: HTTP "+res.status);
  let data;try{data=JSON.parse(text)}catch{throw new Error(label+" API پاسخ JSON معتبر برنگرداند")}
  return data;
}
const API={
  worker:CONFIG.worker,
  historyPath:CONFIG.historyPath||"/tsetmc/history",
  async history(symbol){
    const data=await requestJson(routeUrl(this.historyPath,{symbol}),"History");
    if(Array.isArray(data))return data;
    if(Array.isArray(data.data))return data.data;
    if(Array.isArray(data.result))return data.result;
    throw new Error("ساختار پاسخ تاریخچه ناشناخته است");
  },
  async clientHistory(symbol){
    const data=await requestJson(routeUrl(requirePath("clientHistoryPath"),{symbol}),"Client history");
    if(Array.isArray(data))return data;
    if(Array.isArray(data.data))return data.data;
    if(Array.isArray(data.result))return data.result;
    if(Array.isArray(data.clientTypeHistory))return data.clientTypeHistory;
    throw new Error("ساختار پاسخ تاریخچه حقیقی/حقوقی ناشناخته است");
  },
  async quote(insCode){return requestJson(routeUrl(requirePath("quotePath"),{insCode}),"Quote")},
  async orderbook(insCode){return requestJson(routeUrl(requirePath("orderbookPath"),{insCode}),"Orderbook")},
  async clientType(insCode){return requestJson(routeUrl(requirePath("clientTypePath"),{insCode}),"ClientType")},
  async marketWatch(){return requestJson(routeUrl(requirePath("marketWatchPath")),"MarketWatch")}
};
window.BourseAPI=API;