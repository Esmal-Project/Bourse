const SCAN_HISTORY_KEY="bourseTerminalScanHistory";
function safeRead(){
  try{
    const raw=localStorage.getItem(SCAN_HISTORY_KEY);
    const parsed=raw?JSON.parse(raw):[];
    return Array.isArray(parsed)?parsed:[];
  }catch{return []}
}
function snapshotRows(rows){
  return rows.map(r=>({
    insCode:r.insCode,symbol:r.symbol,name:r.name,
    change:r.change,value:r.value,volume:r.volume,trades:r.trades,
    activityScore:r.activityScore,researchPriority:r.researchPriority
  }));
}
function saveSnapshot(rows){
  const history=safeRead();
  history.push({ts:Date.now(),rows:snapshotRows(rows)});
  while(history.length>12)history.shift();
  try{localStorage.setItem(SCAN_HISTORY_KEY,JSON.stringify(history));}catch{}
}
function latestSnapshot(){
  const history=safeRead();
  return history.length?history.at(-1):null;
}
function compareWithLatest(rows){
  const prev=latestSnapshot();
  if(!prev)return rows.map(r=>({...r,scoreDelta:null,activityDelta:null,changeDelta:null}));
  const map=new Map((prev.rows||[]).map(r=>[String(r.insCode),r]));
  return rows.map(r=>{
    const p=map.get(String(r.insCode));
    return {
      ...r,
      scoreDelta:p?.researchPriority!=null&&r.researchPriority!=null?r.researchPriority-p.researchPriority:null,
      activityDelta:p?.activityScore!=null&&r.activityScore!=null?r.activityScore-p.activityScore:null,
      changeDelta:p?.change!=null&&r.change!=null?r.change-p.change:null
    };
  });
}
function count(){return safeRead().length}
window.BourseScanHistory={save:saveSnapshot,latest:latestSnapshot,compare:compareWithLatest,count};
