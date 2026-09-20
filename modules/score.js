function scoreNum(v){const n=Number(v);return Number.isFinite(n)?n:null}
function percentileMap(rows,key){
  const vals=rows.map(r=>scoreNum(r[key])).filter(v=>v!=null).sort((a,b)=>a-b);
  const out=new Map();
  rows.forEach(r=>{
    const v=scoreNum(r[key]);
    if(v==null||!vals.length)return;
    let lo=0,hi=vals.length;
    while(lo<hi){const m=(lo+hi)>>1;if(vals[m]<=v)lo=m+1;else hi=m}
    out.set(r.insCode,vals.length===1?50:((lo-1)/(vals.length-1))*100);
  });
  return out;
}
function addResearchPriority(rows){
  const enriched=rows.map(r=>{
    const dailyRange=r.max!=null&&r.min!=null&&r.max!==r.min&&r.last!=null
      ?Math.min(100,Math.max(0,(r.last-r.min)/(r.max-r.min)*100)):null;
    return {...r,absChange:r.change==null?null:Math.abs(r.change),dailyRange};
  });
  const activity=percentileMap(enriched,"activityScore");
  const change=percentileMap(enriched,"absChange");
  const value=percentileMap(enriched,"value");
  const volume=percentileMap(enriched,"volume");
  const trades=percentileMap(enriched,"trades");
  const range=percentileMap(enriched,"dailyRange");
  enriched.forEach(r=>{
    const parts=[
      [activity.get(r.insCode),35],
      [change.get(r.insCode),20],
      [value.get(r.insCode),15],
      [volume.get(r.insCode),15],
      [trades.get(r.insCode),10],
      [range.get(r.insCode),5]
    ];
    let weighted=0,total=0;
    parts.forEach(([v,w])=>{if(Number.isFinite(v)){weighted+=v*w;total+=w}});
    r.researchPriority=total?weighted/total:null;
  });
  return enriched;
}
window.BourseScore={addResearchPriority};
