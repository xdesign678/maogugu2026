// Yahoo Finance data fetching with cookie/crumb auth
// Runs server-side only (API routes / server components)

let yfCookie = '';
let yfCrumb = '';
let crumbReady = false;

async function httpsGet(reqUrl, headers = {}) {
  const res = await fetch(reqUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...headers,
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(10000),
  });

  const data = await res.text();
  const cookies = res.headers.getSetCookie?.() || [];
  return { status: res.status, data, cookies, headers: Object.fromEntries(res.headers) };
}

async function initYahooCrumb() {
  try {
    const r1 = await httpsGet('https://fc.yahoo.com');
    if (r1.cookies.length) {
      yfCookie = r1.cookies.map(c => c.split(';')[0]).join('; ');
    }
    const r2 = await httpsGet('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      Cookie: yfCookie,
    });
    yfCrumb = r2.data.trim();
    crumbReady = !!yfCrumb && yfCrumb.length > 3;
  } catch (e) {
    console.error('[YF] Init failed:', e.message);
    crumbReady = false;
  }
}

async function fetchYahooQuote(symbol) {
  if (!crumbReady) {
    await initYahooCrumb();
    if (!crumbReady) throw new Error('Yahoo Finance auth failed');
  }

  const modules = [
    'financialData', 'defaultKeyStatistics', 'assetProfile',
    'earningsTrend', 'price', 'summaryDetail',
    'incomeStatementHistory', 'cashflowStatementHistory',
    'balanceSheetHistory',
  ].join(',');

  const apiUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(yfCrumb)}`;

  let res = await httpsGet(apiUrl, { Cookie: yfCookie });

  if (res.status === 401) {
    crumbReady = false;
    await initYahooCrumb();
    if (!crumbReady) throw new Error('Yahoo Finance re-auth failed');
    res = await httpsGet(
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(yfCrumb)}`,
      { Cookie: yfCookie }
    );
  }

  return JSON.parse(res.data);
}

function processQuoteData(raw, symbol) {
  const result = raw?.quoteSummary?.result?.[0];
  if (!result) throw new Error(`No data found for ${symbol}`);

  const fd = result.financialData || {};
  const ks = result.defaultKeyStatistics || {};
  const ap = result.assetProfile || {};
  const pr = result.price || {};
  const sd = result.summaryDetail || {};
  const et = result.earningsTrend || {};
  const cf = result.cashflowStatementHistory?.cashflowStatements || [];

  const g = (obj, key) => {
    const v = obj?.[key];
    if (!v) return null;
    if (typeof v === 'object' && 'raw' in v) return v.raw;
    return v;
  };

  const currency = g(pr, 'currency') || 'USD';
  const currentPrice = g(fd, 'currentPrice') || g(pr, 'regularMarketPrice');
  const marketCap = g(pr, 'marketCap');
  const sharesOutstanding = g(ks, 'sharesOutstanding');
  const freeCashflow = g(fd, 'freeCashflow');
  const operatingCashflow = g(fd, 'operatingCashflow');
  const totalRevenue = g(fd, 'totalRevenue');
  const roe = g(fd, 'returnOnEquity');
  const grossMargins = g(fd, 'grossMargins');
  const operatingMargins = g(fd, 'operatingMargins');
  const profitMargins = g(fd, 'profitMargins');
  const debtToEquity = g(fd, 'debtToEquity');
  const totalDebt = g(fd, 'totalDebt');
  const totalCash = g(fd, 'totalCash');
  const earningsGrowth = g(fd, 'earningsGrowth');
  const revenueGrowth = g(fd, 'revenueGrowth');
  const trailingEps = g(ks, 'trailingEps');
  const forwardEps = g(ks, 'forwardEps');
  const trailingPE = g(sd, 'trailingPE');
  const forwardPE = g(ks, 'forwardPE');
  const priceToBook = g(ks, 'priceToBook');
  const enterpriseValue = g(ks, 'enterpriseValue');

  let roic = null;
  if (operatingMargins && totalRevenue && totalDebt != null && totalCash != null && marketCap) {
    const nopat = operatingMargins * totalRevenue * 0.79;
    const investedCapital = totalDebt + (marketCap / (priceToBook || 10)) - totalCash;
    if (investedCapital > 0) roic = nopat / investedCapital;
  }

  const fcfHistory = cf.map(stmt => {
    const endDate = g(stmt, 'endDate');
    const netIncome = g(stmt, 'netIncome');
    const opCF = g(stmt, 'totalCashFromOperatingActivities');
    const capex = g(stmt, 'capitalExpenditures');
    let fcf = null;
    if (opCF != null && capex != null) {
      fcf = opCF + capex;
    } else if (netIncome != null) {
      fcf = netIncome * 0.85;
    }
    let year = '--';
    if (typeof endDate === 'number') {
      year = new Date(endDate * 1000).getFullYear().toString();
    } else if (endDate?.fmt) {
      year = endDate.fmt.substring(0, 4);
    }
    return { year, fcf };
  }).filter(f => f.fcf !== null).reverse();

  if (fcfHistory.length === 0 && freeCashflow) {
    fcfHistory.push({ year: 'TTM', fcf: freeCashflow });
  }

  const trends = et.trend || [];
  let nextYearGrowth = null;
  for (const t of trends) {
    if (t.period === '+1y') {
      nextYearGrowth = g(t, 'growth');
      break;
    }
  }

  let debtRatio = null;
  if (debtToEquity != null) {
    debtRatio = debtToEquity / (100 + debtToEquity) * 100;
  }

  return {
    symbol,
    companyName: g(pr, 'longName') || g(pr, 'shortName') || symbol,
    sector: ap.sector || g(pr, 'sector') || '--',
    industry: ap.industry || '--',
    currency,
    currentPrice,
    marketCapB: marketCap ? marketCap / 1e9 : null,
    sharesOutstanding,
    eps: trailingEps,
    forwardEps,
    pe: trailingPE,
    forwardPE: typeof forwardPE === 'number' ? forwardPE : null,
    priceToBook,
    enterpriseValueB: enterpriseValue ? enterpriseValue / 1e9 : null,
    roe: roe != null ? roe * 100 : null,
    roic: roic != null ? roic * 100 : null,
    grossMargin: grossMargins != null ? grossMargins * 100 : null,
    operatingMargin: operatingMargins != null ? operatingMargins * 100 : null,
    profitMargin: profitMargins != null ? profitMargins * 100 : null,
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
    nextYearGrowth: nextYearGrowth != null ? nextYearGrowth * 100 : null,
    fcfHistory,
    dataSource: 'Yahoo Finance (Live)',
    timestamp: new Date().toISOString(),
  };
}

export { fetchYahooQuote, processQuoteData };
