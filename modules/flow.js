function flowNumber(v){const n=Number(v);return Number.isFinite(n)?n:null}
function normalizeFlowRows(rows){
  return (Array.isArray(rows)?rows:[]).map(r=>({
    date:r.date,
    buyICount:flowNumber(r.Buy_CountI??r.buy_CountI),
    buyNCount:flowNumber(r.Buy_CountN??r.buy_CountN),
    sellICount:flowNumber(r.Sell_CountI??r.sell_CountI),
    sellNCount:flowNumber(r.Sell_CountN??r.sell_CountN),
    buyIVolume:flowNumber(r.Buy_I_Volume??r.buy_I_Volume),
    buyNVolume:flowNumber(r.Buy_N_Volume??r.buy_N_Volume),
    sellIVolume:flowNumber(r.Sell_I_Volume??r.sell_I_Volume),
    sellNVolume:flowNumber(r.Sell_N_Volume??r.sell_N_Volume),
    buyIValue:flowNumber(r.Buy_I_Value??r.buy_I_Value),
    buyNValue:flowNumber(r.Buy_N_Value??r.buy_N_Value),
    sellIValue:flowNumber(r.Sell_I_Value??r.sell_I_Value),
    sellNValue:flowNumber(r.Sell_N_Value??r.sell_N_Value)
  })).filter(r=>r.date&&[r.buyIValue,r.buyNValue,r.sellIValue,r.sellNValue].some(v=>v!=null));
}
function summarizeFlow(rows){
  const r=normalizeFlowRows(rows), d=r.at(-1);
  if(!d)return null;
  const netIValue=(d.buyIValue??0)-(d.sellIValue??0), netNValue=(d.buyNValue??0)-(d.sellNValue??0);
  const buyPerBuyer=d.buyIValue!=null&&d.buyICount?d.buyIValue/d.buyICount:null;
  const sellPerSeller=d.sellIValue!=null&&d.sellICount?d.sellIValue/d.sellICount:null;
  const buyerPower=buyPerBuyer!=null&&sellPerSeller?buyPerBuyer/sellPerSeller:null;
  return {rows:r,lastDate:d.date,netIValue,netNValue,buyerPower,buyIValue:d.buyIValue,sellIValue:d.sellIValue,buyNValue:d.buyNValue,sellNValue:d.sellNValue};
}
window.BourseFlow={normalize:normalizeFlowRows,summarize:summarizeFlow};
