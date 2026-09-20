const $=id=>document.getElementById(id);let raw=[];let lastDataAt=0;let refreshTimer=null;let liveTimer=null;let refreshing=false;let liveRefreshing=false;let currentInsCode=null;
function observedTime(raw){const v=raw?.fetchedAt??raw?.meta?.fetchedAt??raw?.__meta?.fetchedAt;const t=v?Date.parse(v):NaN;return Number.isFinite(t)?t:Date.now()}
function markFresh(source="market",observedAt=Date.now()){
  lastDataAt=observedAt;
  const el=$("freshness");
  if(el){el.textContent="داده: "+source+" • همین الان";el.className="freshness fresh";}
}
function updateFreshness(){
  const el=$("freshness");if(!el)return;
  if(!lastDataAt){el.textContent="داده: —";return;}
  const age=Math.floor((Date.now()-lastDataAt)/1000);
  el.textContent="داده: "+(age<2?"همین الان":age+" ثانیه پیش");
  el.className="freshness "+(age*1000>=(window.BOURSE_CONFIG?.staleAfterMs??15000)?"stale":"fresh");
}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function money(v){return v==null?"—":Number(v).toLocaleString("fa-IR")}
function signed(v,d=2){return v==null?"—":(v>=0?"+":"")+Number(v).toFixed(d)}
function normalize(rows){return rows.map(r=>({date:r.date,time:r.time,close:num(r.pc),last:num(r.pl),min:num(r.pmin),max:num(r.pmax),yesterday:num(r.py),first:num(r.pf),volume:num(r.tvol),value:num(r.tval),trades:num(r.tno)})).filter(r=>r.close||r.last).sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.time||"").localeCompare(String(b.time||"")))}
function setText(id,value){const el=$(id);if(el)el.textContent=value}
function setStatus(id,value,error=false){const el=$(id);if(el){el.textContent=value;el.className=error?"muted error":"muted"}}
function renderFlow(summary){
  if(!summary){setStatus("flowStatus","داده حقیقی/حقوقی معتبر دریافت نشد",true);return}
  setStatus("flowStatus","داده روزانه BRSAPI");
  setText("flowDate",summary.lastDate||"—");setText("netIValue",money(summary.netIValue));setText("netNValue",money(summary.netNValue));
  setText("buyerPower",summary.buyerPower==null?"—":summary.buyerPower.toFixed(2)+"×");setText("buyIValue",money(summary.buyIValue));setText("sellIValue",money(summary.sellIValue));
}
function renderLive(quote,book,ct){
  if(quote){
    setStatus("quoteStatus","InsCode: "+quote.insCode);
    $("quoteDetails").innerHTML=[
      ["آخرین",money(quote.last)],["پایانی",money(quote.close)],["اولین",money(quote.open)],["حجم",money(quote.volume)]
    ].map(x=>"<div class=\"quote-item\"><span>"+x[0]+"</span><strong>"+x[1]+"</strong></div>").join("");
    $("raw").textContent=JSON.stringify(quote.raw,null,2);
  }
  if(Array.isArray(book)&&book.length){
    setStatus("orderbookStatus","۵ سطح خرید و فروش");
    const rows=book.filter(x=>x.bid.price!=null||x.ask.price!=null).slice(0,5);
    $("orderbook").innerHTML="<table class=\"orderbook\"><thead><tr><th>خرید</th><th>حجم</th><th>سطح</th><th>حجم</th><th>فروش</th></tr></thead><tbody>"+
      rows.map(x=>"<tr><td class=\"bid\">"+money(x.bid.price)+"</td><td>"+money(x.bid.volume)+"</td><td>"+(x.number??"—")+"</td><td>"+money(x.ask.volume)+"</td><td class=\"ask\">"+money(x.ask.price)+"</td></tr>").join("")+"</tbody></table>";
  }
  if(ct){
    setStatus("clientTypeStatus","داده لحظه‌ای TSETMC");
    $("clientTypeDetails").innerHTML=[
      ["خرید حقیقی",money(ct.buyIndividualVolume)],["فروش حقیقی",money(ct.sellIndividualVolume)],
      ["خرید حقوقی",money(ct.buyLegalVolume)],["فروش حقوقی",money(ct.sellLegalVolume)]
    ].map(x=>"<div class=\"quote-item\"><span>"+x[0]+"</span><strong>"+x[1]+"</strong></div>").join("");
  }
}
async function loadLive(symbol){
  try{
    const searchRaw=await BourseAPI.search(symbol),matches=BourseMarket.normalizeSearch(searchRaw);
    if(!matches.length)throw new Error("نماد در TSETMC پیدا نشد");
    const match=matches[0],insCode=match.insCode;currentInsCode=insCode;
    const [q,b,c]=await Promise.all([BourseAPI.quote(insCode),BourseAPI.orderbook(insCode),BourseAPI.clientType(insCode)]);
    renderLive(BourseMarket.normalizeQuote(q),BourseMarket.normalizeOrderbook(b),BourseMarket.normalizeClientType(c));markFresh("Live");
    if(match.name) $("symbol").textContent=match.symbol+" — "+match.name;
  }catch(e){
    setStatus("quoteStatus","Worker جدید هنوز Deploy نشده یا TSETMC پاسخ نداد",true);
    setStatus("orderbookStatus","Worker جدید هنوز Deploy نشده یا TSETMC پاسخ نداد",true);
    setStatus("clientTypeStatus","Worker جدید هنوز Deploy نشده یا TSETMC پاسخ نداد",true);
  }
}
async function loadFlow(symbol){
  try{
    const rows=BourseFlow.normalize(await BourseAPI.clientHistory(symbol));
    if(!rows.length)throw new Error("invalid");
    renderFlow(BourseFlow.summarize(rows));
  }catch(e){setStatus("flowStatus","Worker جدید برای type=1 هنوز Deploy نشده",true)}
}
function render(symbol,rows){
  const d=rows.at(-1),prev=num(d.yesterday)||num(d.close);
  $("symbol").textContent=symbol;$("price").textContent=money(d.last||d.close);
  const pct=prev?((d.last||d.close)-prev)/prev*100:0;$("change").textContent=(pct>=0?"+":"")+pct.toFixed(2)+"%";$("change").className="change "+(pct>=0?"positive":"negative");
  $("volume").textContent=money(d.volume);$("trades").textContent=money(d.trades);$("value").textContent=money(d.value);$("min").textContent=money(d.min);$("max").textContent=money(d.max);$("yesterday").textContent=money(d.yesterday);$("first").textContent=money(d.first);$("date").textContent=d.date||"—";
  $("source").textContent="Cloudflare Worker / BRSAPI";$("raw").textContent=JSON.stringify(raw.at(-1),null,2);drawHistory($("chart"),rows.slice(-30));
  BourseAnalysis.render(BourseAnalysis.build(rows));
}
async function filterMarketRows(rows){
  const preset=$("scanPreset")?.value||"";
  let f=Object.assign({},BourseFilters.preset(preset));
  const read=id=>{const v=Number($(id)?.value);return Number.isFinite(v)?v:null};
  const minActivity=read("minActivity"),minChange=read("minChange"),maxChange=read("maxChange"),minValue=read("minValue");
  if(minActivity!=null)f.minActivity=minActivity;
  if(minChange!=null)f.minChange=minChange;
  if(maxChange!=null)f.maxChange=maxChange;
  if(minValue!=null)f.minValue=minValue;
  return BourseFilters.apply(rows,f);
}
function deltaHtml(v){
  if(v==null)return "<span class=\"delta-flat\">—</span>";
  const cls=v>0?"delta-up":v<0?"delta-down":"delta-flat";
  return "<span class=\""+cls+"\">"+(v>0?"+":"")+v.toFixed(1)+"</span>";
}
function renderMarketRows(rows){
  const sortKey=$("scanSort")?.value||"change";
  const filtered=filterMarketRows(rows);
  const top=sortKey==="changeAsc"?BourseScanner.sort(filtered,"change","asc").slice(0,30):BourseScanner.sort(filtered,sortKey,"desc").slice(0,30);
  $("scanTableBody").innerHTML=top.map(r=>"<tr class=\"scan-row\" data-symbol=\""+encodeURIComponent(r.symbol||"")+"\" title=\"برای باز کردن نماد کلیک کنید\"><td><strong>"+(r.symbol||"—")+"</strong><div class=\"muted\">"+(r.name||"")+"</div></td><td>"+money(r.last)+"</td><td class=\""+(r.change>=0?"positive":"negative")+"\">"+signed(r.change)+"%</td><td>"+money(r.volume)+"</td><td>"+money(r.value)+"</td><td>"+money(r.trades)+"</td><td>"+(r.activityScore==null?"—":r.activityScore.toFixed(1))+"</td><td class=\"priority\">"+(r.researchPriority==null?"—":r.researchPriority.toFixed(1))+"</td><td>"+deltaHtml(r.scoreDelta)+"</td></tr>").join("");
}
async function scanMarket(){
  setStatus("scanStatus","در حال دریافت Market Watch...");
  try{
    const rawWatch=await BourseAPI.marketWatch();
    const rows=BourseScanHistory.compare(BourseScore.addResearchPriority(BourseScanner.activity(BourseScanner.normalize(rawWatch))));
    if(!rows.length)throw new Error("Market Watch داده‌ای برنگرداند");
    const stats=BourseScanner.stats(rows);window.__lastMarketRows=rows;markFresh("Market Watch",observedTime(rawWatch));
    window.__scanStats=stats;
    BourseScanHistory.save(rows);
    renderMarketRows(rows);
    setStatus("scanStatus","Market Watch دریافت شد • فیلترها قابل اعمال هستند");
  }catch(e){setStatus("scanStatus","Worker جدید هنوز Deploy نشده یا Market Watch در دسترس نیست",true)}
}
async function load(){
  const symbol=BourseSymbol.set($("inputSymbol").value);if(!symbol)return;
  $("status").textContent="در حال دریافت...";$("statusWrap").className="status";
  setStatus("flowStatus","در حال دریافت...");
  try{
    raw=await BourseAPI.history(symbol);const rows=normalize(raw);if(!rows.length)throw new Error("داده تاریخی برای این نماد پیدا نشد");
    render(symbol,rows);markFresh("History");$("status").textContent="دریافت موفق • "+rows.length+" رکورد";$("statusWrap").className="status online";
    loadFlow(symbol);loadLive(symbol);
  }catch(e){$("status").textContent=e.message;$("statusWrap").className="status error"}
}
$("loadBtn").addEventListener("click",load);
$("inputSymbol").addEventListener("keydown",e=>{if(e.key==="Enter")load()});
$("scanBtn").addEventListener("click",scanMarket);
$("scanSort").addEventListener("change",()=>{if(window.__lastMarketRows)renderMarketRows(window.__lastMarketRows)});
$("applyFiltersBtn").addEventListener("click",()=>{if(window.__lastMarketRows)renderMarketRows(window.__lastMarketRows)});
$("scanPreset").addEventListener("change",()=>{if(window.__lastMarketRows)renderMarketRows(window.__lastMarketRows)});
document.addEventListener("click",e=>{
  const row=e.target.closest(".scan-row");
  if(row){$("inputSymbol").value=decodeURIComponent(row.dataset.symbol||"");load();}
});
load();
function startLiveRefresh(){
  clearInterval(refreshTimer);
  const ms=window.BOURSE_CONFIG?.refreshIntervalMs??5000;
  refreshTimer=setInterval(async()=>{
    if(refreshing||document.hidden)return;
    refreshing=true;
    try{
      const rawWatch=await BourseAPI.marketWatch();
      const rows=BourseScore.addResearchPriority(BourseScanner.activity(BourseScanner.normalize(rawWatch)));
      if(rows.length){
        window.__lastMarketRows=rows;
        if(document.getElementById("scanTableBody").children.length||lastDataAt)renderMarketRows(rows);
        markFresh("Market Watch");
      }
    }catch{}
    finally{refreshing=false;updateFreshness();}
  },ms);
}
setInterval(updateFreshness,1000);
startLiveRefresh();

async function refreshCurrentLive(){
  if(liveRefreshing||!currentInsCode||document.hidden)return;
  liveRefreshing=true;
  try{
    const [q,b,c]=await Promise.all([
      BourseAPI.quote(currentInsCode),
      BourseAPI.orderbook(currentInsCode),
      BourseAPI.clientType(currentInsCode)
    ]);
    renderLive(BourseMarket.normalizeQuote(q),BourseMarket.normalizeOrderbook(b),BourseMarket.normalizeClientType(c));
    markFresh("Live Quote");
  }catch{
    try{
      const symbol=BourseSymbol.get();
      const rows=normalize(await BourseAPI.history(symbol));
      const d=rows.at(-1);
      if(d){
        $("price").textContent=money(d.last||d.close);
        const prev=num(d.yesterday)||num(rows.at(-2)?.close);
        const p=prev?((num(d.last||d.close)-prev)/prev)*100:null;
        $("change").textContent=p==null?"—":(p>=0?"+":"")+p.toFixed(2)+"%";
        $("change").className="change "+(p==null?"":p>=0?"positive":"negative");
        $("volume").textContent=money(d.volume);$("trades").textContent=money(d.trades);$("value").textContent=money(d.value);
        $("min").textContent=money(d.min);$("max").textContent=money(d.max);$("yesterday").textContent=money(d.yesterday);
        $("first").textContent=money(d.first);$("date").textContent=d.date||"—";
        setStatus("quoteStatus","آخرین رکورد BRSAPI History");
        $("quoteDetails").innerHTML=[
          ["آخرین",money(d.last||d.close)],["پایانی",money(d.close)],["حجم",money(d.volume)],["تعداد معامله",money(d.trades)]
        ].map(x=>"<div class=\"quote-item\"><span>"+x[0]+"</span><strong>"+x[1]+"</strong></div>").join("");
        markFresh("BRS History");
      }
    }catch{}
  } finally{liveRefreshing=false;updateFreshness();}
}
function startLiveDetailRefresh(){
  clearInterval(liveTimer);
  liveTimer=setInterval(refreshCurrentLive,window.BOURSE_CONFIG?.refreshIntervalMs??5000);
}
startLiveDetailRefresh();
