function scanNum(v){
  if(v!=null&&typeof v==="object")v=v.value??v.Value??v.amount??v.price??v.number;
  const n=Number(v);return Number.isFinite(n)?n:null;
}
function scanPercent(v){
  if(v!=null&&typeof v==="object")v=v.percent??v.Percent??v.value??v.Value??v.change??v.Change;
  return scanNum(v);
}
function normalizeMarketWatch(raw){
  const base=raw?.payload??raw;
  const rows=base?.marketwatch||base?.data||base?.Items||base?.items||base;
  if(!Array.isArray(rows))return [];
  return rows.map(r=>{
    const pl=scanNum(r?.pcl??r?.pl??r?.pDrCotVal??r?.lastprice??r?.lastPrice);
    const py=scanNum(r?.py??r?.priceYesterday??r?.yesterdayPrice);
    const explicit=scanPercent(r?.pricechangepercent??r?.priceChangePercent??r?.lastPriceChangePercent??r?.lastpricechangepercent);
    const change=explicit??(pl!=null&&py?((pl-py)/py)*100:null);
    return {
      insCode:r?.insCode??r?.ins_code??r?.instrumentId??r?.instrumentid??null,
      symbol:r?.lva??r?.lVal18??r?.l18??r?.lVal18AFC??r?.instrument_Name??r?.instrumentName??"",
      name:r?.lvc??r?.lVal30??r?.l30??r?.companyNamePersian??r?.company_Name_Persian??"",
      last:pl,
      close:scanNum(r?.pClosing??r?.pc??r?.closingprice??r?.closingPrice??r?.pcl),
      yesterday:py,
      change,
      volume:scanNum(r?.tvol??r?.qTotTran5J??r?.tradeVolume),
      value:scanNum(r?.tval??r?.qTotCap??r?.tradeValue),
      trades:scanNum(r?.ztt??r?.tno??r?.zTotTran??r?.tradeCount),
      min:scanNum(r?.pmn??r?.pmin??r?.priceMin??r?.minValue),
      max:scanNum(r?.pmx??r?.pmax??r?.priceMax??r?.maxValue),
      flow:r?.flow??null,raw:r
    };
  }).filter(r=>r.insCode&&r.symbol);
}
function scanSort(rows,key="change",dir="desc"){
  return [...rows].sort((a,b)=>{
    const av=Number.isFinite(a[key])?a[key]:-Infinity,bv=Number.isFinite(b[key])?b[key]:-Infinity;
    return dir==="asc"?av-bv:bv-av;
  });
}
function scanStats(rows){
  const valid=rows.filter(r=>Number.isFinite(r.change));
  return {
    count:rows.length,
    positive:valid.filter(r=>r.change>0).length,
    negative:valid.filter(r=>r.change<0).length,
    flat:valid.filter(r=>r.change===0).length,
    totalValue:rows.reduce((s,r)=>s+(r.value||0),0)
  };
}
function percentileRanks(rows,key){
  const vals=rows.map(r=>scanNum(r[key])).filter(v=>v!=null).sort((a,b)=>a-b);
  if(!vals.length)return new Map();
  const rank=new Map();
  rows.forEach(r=>{
    const v=scanNum(r[key]);
    if(v==null)return;
    let lo=0,hi=vals.length;
    while(lo<hi){const m=(lo+hi)>>1;if(vals[m]<=v)lo=m+1;else hi=m}
    rank.set(r.insCode,vals.length===1?50:((lo-1)/(vals.length-1))*100);
  });
  return rank;
}
function addActivityScore(rows){
  const enriched=[...rows];
  enriched.forEach(r=>{r.absChange=Math.abs(r.change??0)});
  const rv=percentileRanks(enriched,"volume"),rt=percentileRanks(enriched,"value"),rn=percentileRanks(enriched,"trades"),rc=percentileRanks(enriched,"absChange");
  enriched.forEach(r=>{
    const parts=[rv.get(r.insCode),rt.get(r.insCode),rn.get(r.insCode),rc.get(r.insCode)].filter(Number.isFinite);
    r.activityScore=parts.length?parts.reduce((x,y)=>x+y,0)/parts.length:null;
  });
  return enriched;
}
function filterNum(v){const n=Number(v);return Number.isFinite(n)?n:null}
function applyMarketFilters(rows,f){
  return rows.filter(r=>{
    const minChange=filterNum(f.minChange),maxChange=filterNum(f.maxChange),minValue=filterNum(f.minValue),minVolume=filterNum(f.minVolume),minTrades=filterNum(f.minTrades),minActivity=filterNum(f.minActivity);
    if(minChange!=null&&(r.change==null||r.change<minChange))return false;
    if(maxChange!=null&&(r.change==null||r.change>maxChange))return false;
    if(minValue!=null&&(r.value==null||r.value<minValue))return false;
    if(minVolume!=null&&(r.volume==null||r.volume<minVolume))return false;
    if(minTrades!=null&&(r.trades==null||r.trades<minTrades))return false;
    if(minActivity!=null&&(r.activityScore==null||r.activityScore<minActivity))return false;
    return true;
  });
}
window.BourseScanner={normalize:normalizeMarketWatch,sort:scanSort,stats:scanStats,activity:addActivityScore,filter:applyMarketFilters};
