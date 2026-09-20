const $=id=>document.getElementById(id);let raw=[];
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function normalize(rows){return rows.map(r=>({date:r.date,time:r.time,close:num(r.pc),last:num(r.pl),min:num(r.pmin),max:num(r.pmax),yesterday:num(r.py),first:num(r.pf),volume:num(r.tvol),value:num(r.tval),trades:num(r.tno)})).filter(r=>r.close||r.last).sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.time||"").localeCompare(String(b.time||"")))}
function money(v){return v?Number(v).toLocaleString("fa-IR"):"—"}
function render(symbol,rows){
  const d=rows.at(-1),prev=num(d.yesterday)||num(d.close);
  $("symbol").textContent=symbol;$("price").textContent=money(d.last||d.close);
  const pct=prev?((d.last||d.close)-prev)/prev*100:0;$("change").textContent=(pct>=0?"+":"")+pct.toFixed(2)+"%";$("change").className="change "+(pct>=0?"positive":"negative");
  $("volume").textContent=money(d.volume);$("trades").textContent=money(d.trades);$("value").textContent=money(d.value);$("min").textContent=money(d.min);$("max").textContent=money(d.max);$("yesterday").textContent=money(d.yesterday);$("first").textContent=money(d.first);$("date").textContent=d.date||"—";
  $("source").textContent="Cloudflare Worker / BRSAPI";$("raw").textContent=JSON.stringify(raw.at(-1),null,2);drawHistory($("chart"),rows.slice(-30));
  const a=BourseAnalysis.build(rows);BourseAnalysis.render(a);
}
async function load(){
  const symbol=BourseSymbol.set($("inputSymbol").value);if(!symbol)return;
  $("status").textContent="در حال دریافت...";$("statusWrap").className="status";
  try{raw=await BourseAPI.history(symbol);const rows=normalize(raw);if(!rows.length)throw new Error("داده تاریخی برای این نماد پیدا نشد");render(symbol,rows);$("status").textContent="دریافت موفق • "+rows.length+" رکورد";$("statusWrap").className="status online"}
  catch(e){$("status").textContent=e.message;$("statusWrap").className="status error"}
}
$("loadBtn").addEventListener("click",load);$("inputSymbol").addEventListener("keydown",e=>{if(e.key==="Enter")load()});load();