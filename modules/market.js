function marketNumber(v){const n=Number(v);return Number.isFinite(n)?n:null}
function normalizeQuote(raw){
  const x=raw?.payload?.closingPriceInfo||raw?.payload?.data||raw?.payload||raw;
  return {
    insCode:x?.insCode??x?.inscode??null,
    last:marketNumber(x?.pDrCotVal??x?.pl),
    close:marketNumber(x?.pClosing??x?.pc),
    yesterday:marketNumber(x?.priceYesterday??x?.py),
    open:marketNumber(x?.priceFirst??x?.pf),
    min:marketNumber(x?.priceMin??x?.pmin),
    max:marketNumber(x?.priceMax??x?.pmax),
    volume:marketNumber(x?.qTotTran5J??x?.tvol),
    value:marketNumber(x?.qTotCap??x?.tval),
    trades:marketNumber(x?.zTotTran??x?.tno),
    raw:x
  };
}
function normalizeOrderbook(raw){
  const rows=raw?.payload?.bestLimits||raw?.payload?.data||raw?.payload||raw;
  if(!Array.isArray(rows))return [];
  return rows.map(x=>({
    number:x?.number,
    bid:{price:marketNumber(x?.pMeDem??x?.pd),volume:marketNumber(x?.qTitMeDem??x?.qd),orders:marketNumber(x?.zOrdMeDem??x?.zd)},
    ask:{price:marketNumber(x?.pMeOf??x?.po),volume:marketNumber(x?.qTitMeOf??x?.qo),orders:marketNumber(x?.zOrdMeOf??x?.zo)}
  }));
}
function normalizeClientType(raw){
  const x=raw?.payload?.clientType||raw?.payload?.data||raw?.payload||raw;
  return {
    buyIndividualVolume:marketNumber(x?.buy_I_Volume),
    buyLegalVolume:marketNumber(x?.buy_N_Volume),
    sellIndividualVolume:marketNumber(x?.sell_I_Volume),
    sellLegalVolume:marketNumber(x?.sell_N_Volume),
    buyIndividualCount:marketNumber(x?.buy_CountI),
    buyLegalCount:marketNumber(x?.buy_CountN),
    sellIndividualCount:marketNumber(x?.sell_CountI),
    sellLegalCount:marketNumber(x?.sell_CountN),
    raw:x
  };
}
function normalizeSearch(raw){
  const rows=raw?.instrumentSearch||raw?.data||raw;
  if(!Array.isArray(rows))return [];
  return rows.map(x=>({
    insCode:x?.insCode??x?.inscode??null,
    symbol:x?.lVal18AFC??x?.l18??x?.symbol??"",
    name:x?.lVal30??x?.l30??x?.name??"",
    flow:x?.flow??null,
    raw:x
  })).filter(x=>x.insCode&&x.symbol);
}
window.BourseMarket={normalizeQuote,normalizeOrderbook,normalizeClientType,normalizeSearch};
