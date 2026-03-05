import { fetchTwelveData } from '@/lib/twelvedata';
import { fetchFMPData } from '@/lib/fmp';
import { fetchYahooQuote, processQuoteData } from '@/lib/yahoo';

// Non-US symbols have a dot suffix (.HK, .SS, .SZ, .T) or are pure digits
function isUSStock(symbol) {
  if (/\.\w{1,4}$/.test(symbol)) return false;
  if (/^\d{4,6}$/.test(symbol)) return false;
  return true;
}

// Triple fallback: Twelve Data -> FMP -> Yahoo Finance
// US stocks try all three; non-US go straight to Yahoo
export async function GET(request, { params }) {
  const { symbol } = await params;
  const us = isUSStock(symbol);

  // 1. Twelve Data (US only, free tier 800/day, 8/min)
  if (us) {
    try {
      const data = await fetchTwelveData(symbol);
      return Response.json(data);
    } catch (e) {
      console.log(`[TwelveData] ${symbol}: ${e.message}`);
    }
  }

  // 2. FMP (US only on free tier, 250/day)
  if (us) {
    try {
      const data = await fetchFMPData(symbol);
      return Response.json(data);
    } catch (e) {
      console.log(`[FMP] ${symbol}: ${e.message}`);
    }
  }

  // 3. Yahoo Finance (all markets, no key needed, less reliable)
  try {
    const raw = await fetchYahooQuote(symbol);
    const data = processQuoteData(raw, symbol);
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: `无法获取 ${symbol} 的数据: ${e.message}` }, { status: 500 });
  }
}
