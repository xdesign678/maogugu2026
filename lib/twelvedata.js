// Twelve Data API - primary data source for US stocks
// Free tier: 800 calls/day, 8 calls/min

const API_KEY = process.env.TWELVE_DATA_API_KEY || '';
const BASE = 'https://api.twelvedata.com';

async function tdFetch(endpoint, params = {}) {
  params.apikey = API_KEY;
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/${endpoint}?${qs}`, {
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  if (data.code && data.status === 'error') {
    throw new Error(data.message || `Twelve Data error: ${data.code}`);
  }
  return data;
}

// Determine if a symbol needs exchange hint
function getExchangeParam(symbol) {
  if (/^\d{4}$/.test(symbol)) return { exchange: 'HKEX' };
  if (/^\d{4}\.HK$/i.test(symbol)) return { symbol: symbol.replace('.HK', ''), exchange: 'HKEX' };
  if (/^\d{6}\.SS$/i.test(symbol)) return { symbol: symbol.replace('.SS', ''), exchange: 'SSE' };
  if (/^\d{6}\.SZ$/i.test(symbol)) return { symbol: symbol.replace('.SZ', ''), exchange: 'SZSE' };
  return {};
}

export async function fetchTwelveData(symbol) {
  const exchangeParams = getExchangeParam(symbol);
  const symParam = exchangeParams.symbol || symbol;
  const extra = exchangeParams.exchange ? { exchange: exchangeParams.exchange } : {};

  // Fetch statistics (main data) + cash_flow (FCF history) in parallel
  const [statsData, cfData] = await Promise.all([
    tdFetch('statistics', { symbol: symParam, ...extra }),
    tdFetch('cash_flow', { symbol: symParam, ...extra }).catch(() => null),
  ]);

  return processTwelveData(statsData, cfData, symbol);
}

function processTwelveData(statsData, cfData, originalSymbol) {
  const meta = statsData.meta || {};
  const stats = statsData.statistics || {};
  const val = stats.valuations_metrics || {};
  const fin = stats.financials || {};
  const is = fin.income_statement || {};
  const bs = fin.balance_sheet || {};
  const cf = fin.cash_flow || {};
  const ss = stats.stock_statistics || {};

  const currency = meta.currency || 'USD';
  const marketCap = val.market_capitalization;
  const sharesOutstanding = ss.shares_outstanding;

  // Current price from market cap / shares
  const currentPrice = marketCap && sharesOutstanding
    ? marketCap / sharesOutstanding
    : null;

  const totalDebt = bs.total_debt_mrq;
  const totalCash = bs.total_cash_mrq;
  const debtToEquity = bs.total_debt_to_equity_mrq;
  const totalRevenue = is.revenue_ttm;
  const eps = is.diluted_eps_ttm;
  const freeCashflow = cf.levered_free_cash_flow_ttm;
  const operatingCashflow = cf.operating_cash_flow_ttm;

  const roe = fin.return_on_equity_ttm;
  const grossMargin = fin.gross_margin;
  const operatingMargin = fin.operating_margin;
  const profitMargin = fin.profit_margin;

  // Calculate ROIC from available data
  let roic = null;
  if (operatingMargin && totalRevenue && totalDebt != null && totalCash != null && marketCap) {
    const nopat = operatingMargin * totalRevenue * 0.79;
    const bookEquity = marketCap / (val.price_to_book_mrq || 10);
    const investedCapital = totalDebt + bookEquity - totalCash;
    if (investedCapital > 0) roic = nopat / investedCapital;
  }

  // FCF history from cash flow statement
  const fcfHistory = [];
  if (cfData && cfData.cash_flow) {
    for (const item of cfData.cash_flow.slice(0, 5).reverse()) {
      if (item.free_cash_flow != null) {
        const year = item.fiscal_date ? item.fiscal_date.substring(0, 4) : '--';
        fcfHistory.push({ year, fcf: item.free_cash_flow });
      }
    }
  }
  if (fcfHistory.length === 0 && freeCashflow) {
    fcfHistory.push({ year: 'TTM', fcf: freeCashflow });
  }

  // Growth rates
  const earningsGrowth = is.quarterly_earnings_growth_yoy;
  const revenueGrowth = is.quarterly_revenue_growth;

  // Forward PE and EPS
  const forwardPE = val.forward_pe;
  const forwardEps = currentPrice && forwardPE ? currentPrice / forwardPE : null;

  // Debt ratio
  let debtRatio = null;
  if (debtToEquity != null) {
    debtRatio = debtToEquity / (100 + debtToEquity) * 100;
  }

  return {
    symbol: originalSymbol,
    companyName: meta.name || originalSymbol,
    sector: '--',
    industry: '--',
    currency,
    currentPrice,
    marketCapB: marketCap ? marketCap / 1e9 : null,
    sharesOutstanding,
    eps,
    forwardEps,
    pe: val.trailing_pe || null,
    forwardPE: typeof forwardPE === 'number' ? forwardPE : null,
    priceToBook: val.price_to_book_mrq || null,
    enterpriseValueB: val.enterprise_value ? val.enterprise_value / 1e9 : null,
    roe: roe != null ? roe * 100 : null,
    roic: roic != null ? roic * 100 : null,
    grossMargin: grossMargin != null ? grossMargin * 100 : null,
    operatingMargin: operatingMargin != null ? operatingMargin * 100 : null,
    profitMargin: profitMargin != null ? profitMargin * 100 : null,
    freeCashflow,
    freeCashflowB: freeCashflow ? freeCashflow / 1e9 : null,
    operatingCashflow,
    totalRevenue,
    totalDebt,
    totalCash,
    debtToEquity,
    debtRatio,
    earningsGrowth: earningsGrowth != null ? earningsGrowth * 100 : null,
    revenueGrowth: revenueGrowth != null ? revenueGrowth * 100 : null,
    nextYearGrowth: null,
    fcfHistory,
    dataSource: 'Twelve Data (Live)',
    timestamp: new Date().toISOString(),
  };
}
