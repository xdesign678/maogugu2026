// Financial Modeling Prep API - secondary data source for US stocks
// Free tier: 250 calls/day

const API_KEY = process.env.FMP_API_KEY || '';
const BASE = 'https://financialmodelingprep.com/stable';

async function fmpFetch(endpoint, params = {}) {
  params.apikey = API_KEY;
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/${endpoint}?${qs}`, {
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  if (data['Error Message']) throw new Error(data['Error Message']);
  if (typeof data === 'string' && data.includes('Premium')) throw new Error('FMP: Premium required');
  return data;
}

export async function fetchFMPData(symbol) {
  // Fetch profile + ratios + cash-flow in parallel
  const [profile, ratios, cashFlow, incomeStmt] = await Promise.all([
    fmpFetch('profile', { symbol }),
    fmpFetch('ratios', { symbol, period: 'annual' }).catch(() => []),
    fmpFetch('cash-flow-statement', { symbol, period: 'annual' }).catch(() => []),
    fmpFetch('income-statement', { symbol, period: 'annual' }).catch(() => []),
  ]);

  if (!profile || !Array.isArray(profile) || profile.length === 0) {
    throw new Error(`FMP: No data for ${symbol}`);
  }

  const result = processFMPData(profile[0], ratios, cashFlow, incomeStmt, symbol);

  // If no meaningful financial data, throw so we fall through to Yahoo
  if (!result.pe && !result.roe && !result.freeCashflow && !result.grossMargin) {
    throw new Error(`FMP: Incomplete data for ${symbol} (only profile available)`);
  }

  return result;
}

function processFMPData(profile, ratios, cashFlow, incomeStmt, originalSymbol) {
  const r = Array.isArray(ratios) && ratios.length > 0 ? ratios[0] : {};
  const currency = profile.currency || 'USD';
  const currentPrice = profile.price;
  const marketCap = profile.marketCap;
  const sharesOutstanding = currentPrice > 0 ? Math.round(marketCap / currentPrice) : null;

  // EPS from income statement
  const latestIncome = Array.isArray(incomeStmt) && incomeStmt.length > 0 ? incomeStmt[0] : {};
  const eps = latestIncome.epsDiluted || null;

  // Ratios
  const pe = r.priceToEarningsRatio || null;
  const forwardPE = null; // FMP free doesn't provide forward PE directly
  const priceToBook = r.priceToBookRatio || null;
  const grossMargin = r.grossProfitMargin != null ? r.grossProfitMargin * 100 : null;
  const operatingMargin = r.operatingProfitMargin != null ? r.operatingProfitMargin * 100 : null;
  const profitMargin = r.netProfitMargin != null ? r.netProfitMargin * 100 : null;
  const debtToEquity = r.debtToEquityRatio != null ? r.debtToEquityRatio * 100 : null;
  const debtRatio = r.debtToAssetsRatio != null ? r.debtToAssetsRatio * 100 : null;

  // ROE from net income / equity
  let roe = null;
  if (latestIncome.netIncome && priceToBook && marketCap) {
    const equity = marketCap / priceToBook;
    if (equity > 0) roe = (latestIncome.netIncome / equity) * 100;
  }

  // ROIC estimate
  let roic = null;
  if (operatingMargin != null && latestIncome.revenue) {
    const nopat = (operatingMargin / 100) * latestIncome.revenue * 0.79;
    const equity = priceToBook ? marketCap / priceToBook : 0;
    const totalDebt = latestIncome.revenue * (r.debtToAssetsRatio || 0);
    const investedCapital = equity + totalDebt;
    if (investedCapital > 0) roic = (nopat / investedCapital) * 100;
  }

  // Cash flow data
  const latestCF = Array.isArray(cashFlow) && cashFlow.length > 0 ? cashFlow[0] : {};
  const freeCashflow = latestCF.freeCashFlow || null;
  const operatingCashflow = latestCF.operatingCashFlow || null;

  // Balance sheet from cash flow (FMP includes these)
  const totalDebt = null; // Not directly in these endpoints on free tier
  const totalCash = null;

  // FCF history
  const fcfHistory = [];
  if (Array.isArray(cashFlow)) {
    for (const item of cashFlow.slice(0, 5).reverse()) {
      if (item.freeCashFlow != null) {
        const year = item.date ? item.date.substring(0, 4) : '--';
        fcfHistory.push({ year, fcf: item.freeCashFlow });
      }
    }
  }
  if (fcfHistory.length === 0 && freeCashflow) {
    fcfHistory.push({ year: 'TTM', fcf: freeCashflow });
  }

  // Growth from income statements
  let earningsGrowth = null;
  let revenueGrowth = null;
  if (Array.isArray(incomeStmt) && incomeStmt.length >= 2) {
    const cur = incomeStmt[0];
    const prev = incomeStmt[1];
    if (cur.netIncome && prev.netIncome && prev.netIncome !== 0) {
      earningsGrowth = ((cur.netIncome - prev.netIncome) / Math.abs(prev.netIncome)) * 100;
    }
    if (cur.revenue && prev.revenue && prev.revenue !== 0) {
      revenueGrowth = ((cur.revenue - prev.revenue) / Math.abs(prev.revenue)) * 100;
    }
  }

  return {
    symbol: originalSymbol,
    companyName: profile.companyName || originalSymbol,
    sector: profile.sector || '--',
    industry: profile.industry || '--',
    currency,
    currentPrice,
    marketCapB: marketCap ? marketCap / 1e9 : null,
    sharesOutstanding,
    eps,
    forwardEps: null,
    pe,
    forwardPE,
    priceToBook,
    enterpriseValueB: null,
    roe,
    roic,
    grossMargin,
    operatingMargin,
    profitMargin,
    freeCashflow,
    freeCashflowB: freeCashflow ? freeCashflow / 1e9 : null,
    operatingCashflow,
    totalRevenue: latestIncome.revenue || null,
    totalDebt,
    totalCash,
    debtToEquity,
    debtRatio,
    earningsGrowth,
    revenueGrowth,
    nextYearGrowth: null,
    fcfHistory,
    dataSource: 'FMP (Live)',
    timestamp: new Date().toISOString(),
  };
}
