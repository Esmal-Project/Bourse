# Cloudflare Worker — Bourse Terminal

این Worker مسیر فعلی /tsetmc/history را حفظ می‌کند و علاوه بر آن حالت حقیقی/حقوقی و مسیرهای TSETMC برای موتور بازار را آماده می‌کند.

## Secret
در Cloudflare Worker یک Secret با نام زیر وجود داشته باشد:
BRSAPI_KEY

کلید داخل فرانت‌اند قرار نمی‌گیرد.

## Routes
- GET /tsetmc/history?symbol=بترانس → BRSAPI type=0
- GET /tsetmc/history?symbol=بترانس&type=1 → BRSAPI type=1، حقیقی/حقوقی
- GET /tsetmc/search?query=بترانس → TSETMC Instrument Search
- GET /tsetmc/quote?insCode=... → TSETMC Quote
- GET /tsetmc/orderbook?insCode=... → TSETMC BestLimits
- GET /tsetmc/client-type?insCode=... → TSETMC ClientType
- GET /tsetmc/market-watch → TSETMC MarketWatch

قبل از فعال‌کردن routeهای زنده، هر route را جداگانه با URL خود Worker تست کن.