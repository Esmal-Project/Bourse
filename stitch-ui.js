(function(){
"use strict";
function $(id){return document.getElementById(id)}
function text(id,value){const el=$(id);if(el)el.textContent=value==null?"—":value}
function sync(){
  text("selectedLabel",$("symbol")?.textContent||"نماد انتخاب نشده");
  text("selectedPrice",$("price")?.textContent||"—");
  text("selectedChange",$("change")?.textContent||"—");
  const ch=$("change"),sc=$("selectedChange");
  if(sc&&ch){sc.className="stitch-change "+(ch.classList.contains("positive")?"positive":ch.classList.contains("negative")?"negative":"")}
  text("stitchStatus",$("status")?.textContent||"آماده");
  text("stitchFresh",$("freshness")?.textContent||"داده: —");
  text("watchFeedState",$("feedMeta")?.textContent?.replace(/^فید:\s*/,"")||"—");
  const count=window.__scanStats?.count!=null?Number(window.__scanStats.count):document.querySelectorAll("#scanTableBody .scan-row").length;
  const pos=window.__scanStats?.positive,neg=window.__scanStats?.negative;
  text("watchCount",count.toLocaleString("fa-IR"));
  text("watchPositive",pos!=null?Number(pos).toLocaleString("fa-IR"):"—");
  text("watchNegative",neg!=null?Number(neg).toLocaleString("fa-IR"):"—");
  text("watchPositiveSide",pos!=null?Number(pos).toLocaleString("fa-IR"):"—");
  text("watchNegativeSide",neg!=null?Number(neg).toLocaleString("fa-IR"):"—");
  if(window.__lastMarketRows?.length)renderMap(window.__lastMarketRows);
}
function renderMap(rows){
 const host=$("stitchHeatmap"),sum=$("mapSummary");if(!host)return;
 const top=[...rows].filter(x=>x&&x.symbol).sort((a,b)=>(Math.abs(b.change??0)-Math.abs(a.change??0))).slice(0,100);
 host.innerHTML=top.map(function(r){
   const p=Number(r.change),a=Number.isFinite(p)?Math.min(.92,.18+Math.abs(p)/8):.18;
   const bg=Number.isFinite(p)&&p>=0?"rgba(37,209,138,"+a+")":"rgba(240,95,109,"+a+")";
   const safeName=String(r.name||r.symbol).replace(/"/g,"&quot;");
   return '<button class="heat-cell" data-symbol="'+encodeURIComponent(r.symbol)+'" style="background:'+bg+'" title="'+safeName+'"><strong>'+r.symbol+'</strong><span>'+ (Number.isFinite(p)?(p>=0?"+":"")+p.toFixed(2)+"%":"—") +'</span><em>'+ (Number.isFinite(r.value)?Number(r.value).toLocaleString("fa-IR"):"—") +'</em></button>';
 }).join("");
 sum.textContent=Number(rows.length).toLocaleString("fa-IR")+" نماد • بر مبنای فید واقعی";
}
function activateNav(target){
 document.querySelectorAll(".stitch-nav button").forEach(function(b){b.classList.toggle("active",b.dataset.target===target)});
}
document.addEventListener("click",function(e){
 const nav=e.target.closest(".stitch-nav button");
 if(nav){const target=$(nav.dataset.target);if(target){e.preventDefault();target.scrollIntoView({behavior:"smooth",block:"start"});activateNav(nav.dataset.target)}}
 const cell=e.target.closest(".heat-cell");
 if(cell){const symbol=decodeURIComponent(cell.dataset.symbol||"");if(symbol&&typeof window.load==="function"){const input=$("inputSymbol");if(input)input.value=symbol;window.load(symbol);$("workspace")?.scrollIntoView({behavior:"smooth",block:"start"})}}
});
const observer=new IntersectionObserver(function(entries){
 entries.forEach(function(entry){if(entry.isIntersecting)activateNav(entry.target.id)});
},{rootMargin:"-25% 0px -65% 0px",threshold:.01});
["workspace","symbolFocus","marketMap","moduleSuite"].forEach(function(id){const el=$(id);if(el)observer.observe(el)});
sync();setInterval(sync,800);
})();