const CONFIG=window.BOURSE_CONFIG||{worker:"https://brsapi-proxy.yasharesmaeili.workers.dev",historyPath:"/tsetmc/history"};
const API={
  worker:CONFIG.worker,
  historyPath:CONFIG.historyPath||"/tsetmc/history",
  async history(symbol){
    const url=this.worker+this.historyPath+"?symbol="+encodeURIComponent(symbol);
    const res=await fetch(url,{cache:"no-store"});
    const text=await res.text();
    if(!res.ok)throw new Error("History request failed: HTTP "+res.status);
    let data;try{data=JSON.parse(text)}catch{throw new Error("API پاسخ JSON معتبر برنگرداند")}
    if(Array.isArray(data))return data;
    if(Array.isArray(data.data))return data.data;
    if(Array.isArray(data.result))return data.result;
    throw new Error("ساختار پاسخ تاریخچه ناشناخته است");
  }
};
window.BourseAPI=API;