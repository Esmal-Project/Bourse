const SYMBOL_STATE={current:"",history:[]};
function cleanSymbol(value){return String(value||"").trim().replace(/\s+/g," ")}
function setCurrentSymbol(value){const symbol=cleanSymbol(value);if(!symbol)throw new Error("نماد وارد نشده است");SYMBOL_STATE.current=symbol;SYMBOL_STATE.history=[...SYMBOL_STATE.history.filter(x=>x!==symbol),symbol].slice(-10);return symbol}
function getCurrentSymbol(){return SYMBOL_STATE.current}
window.BourseSymbol={clean:cleanSymbol,set:setCurrentSymbol,get:getCurrentSymbol,state:SYMBOL_STATE};
