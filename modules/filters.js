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
function presetFilters(name){
  return ({
    active:{minActivity:75},
    momentum:{minChange:1,minActivity:60},
    weak:{maxChange:-1,minActivity:60},
    highValue:{minValue:100000000000}
  })[name]||{};
}
window.BourseFilters={apply:applyMarketFilters,preset:presetFilters};
