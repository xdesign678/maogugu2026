'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// --- Analysis logic (same as original) ---

function sf(n, d = 1) {
  if (n == null || typeof n !== 'number' || isNaN(n)) return '--';
  return n.toFixed(d);
}

function fmt(n, d = 2) {
  if (n == null || typeof n !== 'number' || isNaN(n)) return '--';
  if (Math.abs(n) >= 1e4) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(d);
}

function fmtB(n) {
  if (n == null || typeof n !== 'number' || isNaN(n)) return '--';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'T';
  return n.toFixed(1);
}

function pct(a, b) {
  if (!b || b === 0) return 0;
  return ((a - b) / Math.abs(b) * 100);
}

function normalizeSymbol(raw) {
  let sym = raw.trim().toUpperCase();
  if (/^\d{6}$/.test(sym)) {
    if (sym.startsWith('6')) return sym + '.SS';
    return sym + '.SZ';
  }
  return sym;
}

function getReasonablePE(gm, roe, roic) {
  let base = 15;
  if (gm > 60) base += 5; else if (gm > 40) base += 2;
  if (roe > 25) base += 4; else if (roe > 20) base += 2;
  if (roic > 20) base += 3; else if (roic > 15) base += 1;
  return Math.min(base, 35);
}

function analyzeMoats(gm, roe, roic, debt, fcfs) {
  const moats = [];

  const brandScore = Math.min(Math.round(gm * 1.1), 100);
  const brandDesc = gm > 60 ? `毛利率${sf(gm)}%，定价权极强` :
    gm > 40 ? `毛利率${sf(gm)}%，定价权良好` :
    `毛利率${sf(gm)}%，定价权一般`;
  moats.push({ name: '品牌/定价权', score: brandScore, desc: brandDesc });

  const capScore = Math.min(Math.max(Math.round(roic * 3), 0), 100);
  const capDesc = roic > 20 ? `ROIC ${sf(roic)}%，资本回报卓越` :
    roic > 15 ? `ROIC ${sf(roic)}%，资本效率良好` :
    roic > 0 ? `ROIC ${sf(roic)}%，资本效率一般` :
    'ROIC 数据不可用';
  moats.push({ name: '资本效率', score: capScore, desc: capDesc });

  const positiveFCFs = fcfs.filter(f => f.fcf > 0).length;
  const cfScore = fcfs.length > 0 ? Math.round((positiveFCFs / fcfs.length) * 100) : 50;
  const cfDesc = cfScore >= 80 ? `近${fcfs.length}期中${positiveFCFs}期为正FCF，现金流稳健` :
    cfScore >= 50 ? `现金流有一定波动` : `现金流不稳定，需要关注`;
  moats.push({ name: '现金流质量', score: cfScore, desc: cfDesc });

  const safeScore = Math.max(Math.min(Math.round(100 - debt * 1.5), 100), 0);
  const safeDesc = debt < 20 ? `负债率${sf(debt)}%，财务极其稳健` :
    debt < 40 ? `负债率${sf(debt)}%，财务较安全` :
    `负债率${sf(debt)}%，负债偏高需关注`;
  moats.push({ name: '财务安全', score: safeScore, desc: safeDesc });

  return moats;
}

function computeRec(price, bankVal, dcfVal, peVal, moats, roe, roic, gm, debt) {
  if (!price || price <= 0) return { type: 'hold', label: '数据不足', conf: 0 };

  const avgMoat = moats.reduce((s, m) => s + m.score, 0) / moats.length;
  const vals = [bankVal, dcfVal, peVal].filter(v => v > 0);
  const avgVal = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : price;
  const upside = (avgVal - price) / price;

  let score = 50;
  if (upside > 0.3) score += 25;
  else if (upside > 0.15) score += 15;
  else if (upside > 0) score += 5;
  else if (upside > -0.15) score -= 5;
  else score -= 20;

  score += (avgMoat - 50) * 0.3;
  if (roe > 20) score += 5;
  if (roic > 15) score += 5;
  if (gm > 60) score += 5;
  if (debt > 50) score -= 10;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let type, label;
  if (score >= 70) { type = 'buy'; label = '值得买入'; }
  else if (score >= 45) { type = 'hold'; label = '持有观察'; }
  else { type = 'avoid'; label = '暂时观望'; }

  return { type, label, conf: score };
}

function buildAnalysis(d) {
  const isRMB = d.currency === 'CNY';
  const isHKD = d.currency === 'HKD';
  const ps = isRMB ? '¥' : isHKD ? 'HK$' : '$';
  const price = d.currentPrice;
  const sharesB = d.sharesOutstanding || 1;
  const fcf = d.freeCashflow || 0;
  const fcfB = fcf / 1e9;

  let fcfHistory = d.fcfHistory && d.fcfHistory.length > 0 ? d.fcfHistory : [{ year: 'TTM', fcf }];
  const lastYear = fcfHistory[fcfHistory.length - 1];
  if (lastYear && lastYear.year !== 'TTM' && fcf) {
    fcfHistory = [...fcfHistory, { year: 'TTM', fcf }];
  }

  const histFCFs = fcfHistory.map(f => f.fcf).filter(f => f && f > 0);
  const effectiveFCF = histFCFs.length > 0 ? histFCFs.reduce((a, b) => a + b, 0) / histFCFs.length : fcf;
  const effectiveFCFB = effectiveFCF / 1e9;

  // Method 1: Bank Deposit
  const bondRate = 0.05;
  const bankValTotal = (effectiveFCFB / bondRate) * 0.6;
  const bankValPerShare = sharesB > 0 ? (bankValTotal * 1e9) / sharesB : 0;

  // Method 2: DCF
  const roe = d.roe || 0;
  const growthRate = Math.min(Math.max((roe > 0 ? roe / 100 * 0.3 : 0.03), 0.02), 0.15);
  const discountRate = 0.06;
  let dcfTotal = 0;
  for (let t = 1; t <= 10; t++) {
    dcfTotal += effectiveFCF * Math.pow(1 + growthRate, t) / Math.pow(1 + discountRate, t);
  }
  const termVal = (effectiveFCF * Math.pow(1 + growthRate, 10) * 1.03) / (discountRate - 0.03);
  dcfTotal += termVal / Math.pow(1 + discountRate, 10);
  const dcfPerShare = sharesB > 0 ? dcfTotal / sharesB : 0;

  // Method 3: PE-based
  const gm = d.grossMargin || 0;
  const roic = d.roic || 0;
  const reasonablePE = getReasonablePE(gm, roe, roic);
  const eps = d.eps || 0;
  const peValPerShare = eps > 0 ? eps * reasonablePE : 0;

  const debtRatio = d.debtRatio || 0;
  const moats = analyzeMoats(gm, roe, roic, debtRatio, fcfHistory);
  const rec = computeRec(price, bankValPerShare, dcfPerShare, peValPerShare, moats, roe, roic, gm, debtRatio);

  return {
    sym: d.symbol, price, priceSymbol: ps,
    mktCapB: d.marketCapB || 0, currency: d.currency,
    profile: { companyName: d.companyName, sector: d.sector, industry: d.industry },
    roe, roic, grossMargin: gm, operatingMargin: d.operatingMargin || 0,
    pe: d.pe, forwardPE: d.forwardPE, debtRatio,
    debtToEquity: d.debtToEquity,
    fcfB: effectiveFCFB, fcfs: fcfHistory, eps,
    bankValPerShare, dcfPerShare, peValPerShare, reasonablePE, growthRate,
    moats, rec, sharesB,
    earningsGrowth: d.earningsGrowth, revenueGrowth: d.revenueGrowth,
    nextYearGrowth: d.nextYearGrowth,
    dataSource: d.dataSource, timestamp: d.timestamp,
  };
}

// --- Sub-components ---

function Tip({ text }) {
  return (
    <div className="tip">
      <div className="tip-dot">?</div>
      <div className="tip-box">{text}</div>
    </div>
  );
}

function MetricCard({ label, value, unit, tip }) {
  return (
    <div className="m-card">
      <div className="m-label">{label} {tip && <Tip text={tip} />}</div>
      <div className="m-val">{value}<span className="m-unit">{unit}</span></div>
    </div>
  );
}

function MoatCard({ moat, animated }) {
  const cls = moat.score >= 75 ? 's' : moat.score >= 50 ? 'm' : 'w';
  const lb = moat.score >= 75 ? '强' : moat.score >= 50 ? '中' : '弱';
  return (
    <div className="moat-card">
      <div className="moat-top">
        <div className="moat-name">{moat.name}</div>
        <div className={`moat-tag ${cls}`}>{lb} {moat.score}</div>
      </div>
      <div className="moat-bar">
        <div className={`moat-fill ${cls}`} style={{ width: animated ? `${moat.score}%` : '0%' }} />
      </div>
      <div className="moat-desc">{moat.desc}</div>
    </div>
  );
}

function ResultView({ d }) {
  const [moatAnimated, setMoatAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMoatAnimated(true), 300);
    return () => clearTimeout(timer);
  }, [d]);

  const up1 = pct(d.bankValPerShare, d.price);
  const up2 = pct(d.dcfPerShare, d.price);
  const up3 = pct(d.peValPerShare, d.price);
  const ps = d.priceSymbol;

  const maxFCF = Math.max(...d.fcfs.map(f => Math.abs(f.fcf)), 1);

  const growthInfo = [];
  if (typeof d.earningsGrowth === 'number') growthInfo.push(`盈利增长 ${d.earningsGrowth > 0 ? '+' : ''}${d.earningsGrowth.toFixed(1)}%`);
  if (typeof d.revenueGrowth === 'number') growthInfo.push(`营收增长 ${d.revenueGrowth > 0 ? '+' : ''}${d.revenueGrowth.toFixed(1)}%`);

  return (
    <>
      {/* Company Header */}
      <div className="co-header anim">
        <div>
          <div className="co-symbol">{d.sym}</div>
          <div className="co-name">{d.profile.companyName || d.sym}</div>
          <div className="co-meta">
            <span>{d.profile.sector || '--'}</span>
            <span>|</span>
            <span>市值 {ps}{fmtB(d.mktCapB)}B</span>
            {growthInfo.length > 0 && <><span>|</span><span>{growthInfo.join(' / ')}</span></>}
          </div>
          <div className="co-price" style={{ marginTop: '.5rem' }}>{ps}{sf(d.price, 2)}</div>
          <div className="co-source">&#9679; {d.dataSource || 'Yahoo Finance'} &middot; {new Date(d.timestamp).toLocaleString('zh-CN')}</div>
        </div>
        <div className={`rec ${d.rec.type}`}>
          <div className="rec-label">投资建议</div>
          <div className="rec-value">{d.rec.label}</div>
          <div className="rec-conf">置信度 {d.rec.conf}%</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="section anim-1">
        <div className="section-head"><span>&#9670;</span><h2>关键财务指标</h2></div>
        <div className="metrics">
          <MetricCard label="自由现金流(TTM)" value={`${ps}${fmt(d.fcfB, 1)}`} unit="B"
            tip='经营活动现金流减去资本支出。段永平："利润是观点，现金流是事实"' />
          <MetricCard label="ROE 净资产收益率" value={d.roe != null ? fmt(d.roe, 1) : '--'} unit="%"
            tip="段永平要求长期>20%为优秀，且来源必须是高利润率而非高杠杆" />
          <MetricCard label="ROIC 投入资本回报率" value={d.roic != null ? fmt(d.roic, 1) : '--'} unit="%"
            tip={`验证护城河有效性，段永平要求持续>15%${d.roic == null ? '。当前为估算值' : ''}`} />
          <MetricCard label="毛利率" value={d.grossMargin != null ? fmt(d.grossMargin, 1) : '--'} unit="%"
            tip="体现定价权和品牌溢价。60%以上为优秀，如茅台91%" />
          <MetricCard label="负债率" value={d.debtRatio != null ? fmt(d.debtRatio, 1) : '--'} unit="%"
            tip={`段永平偏好低负债公司，有息负债率<30%为安全。D/E: ${sf(d.debtToEquity, 1)}`} />
          <MetricCard label="PE 市盈率" value={d.pe != null ? fmt(d.pe, 1) : '--'} unit="x"
            tip={`⚠️ PE是历史数据，不能单独用于估值。段永平："PE只说了上半句"。远期PE: ${sf(d.forwardPE, 1)}`} />
        </div>
      </div>

      {/* FCF Chart */}
      <div className="section anim-2">
        <div className="section-head"><span>&#9670;</span><h2>自由现金流趋势</h2></div>
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '1rem' }}>
          <div className="chart-bars">
            {d.fcfs.map((f, i) => {
              const h = Math.max((Math.abs(f.fcf) / maxFCF) * 100, 3);
              const cls = f.fcf >= 0 ? 'positive' : 'negative';
              const valB = (f.fcf / 1e9).toFixed(1);
              return (
                <div className="chart-bar-wrap" key={i}>
                  <div className="chart-val">{valB}B</div>
                  <div className={`chart-bar ${cls}`} style={{ height: `${h}%` }} />
                  <div className="chart-label">{f.year}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Valuation Methods */}
      <div className="section anim-3">
        <div className="section-head"><span>&#9670;</span><h2>三种毛估估方法</h2></div>
        <div className="val-grid">
          {/* Bank Deposit */}
          <div className="val-card">
            <div className="val-title">存银行本金法</div>
            <div className="val-desc">将企业视为能持续产生现金流的&ldquo;银行账户&rdquo;，按长期国债利率折算本金，再打六折体现安全边际</div>
            <div className="val-result">
              <div className="val-amount">{ps}{sf(d.bankValPerShare, 2)}</div>
              <div className="val-sub">合理估值 / 每股</div>
            </div>
            <div className="val-row"><span className="l">当前价格</span><span className="v">{ps}{sf(d.price, 2)}</span></div>
            <div className="val-row"><span className="l">估值差距</span><span className={`v ${up1 > 0 ? 'pos' : 'neg'}`}>{up1 > 0 ? '+' : ''}{sf(up1, 1)}%</span></div>
            <div className="val-formula">公式: ({ps}{fmt(d.fcfB, 1)}B / 5%) x 0.6</div>
          </div>

          {/* DCF */}
          <div className="val-card">
            <div className="val-title">DCF 现金流折现</div>
            <div className="val-desc">10年期自由现金流折现，折现率6%，增长率基于ROE保守估算，含永续增长终值</div>
            <div className="val-result">
              <div className="val-amount">{ps}{sf(d.dcfPerShare, 2)}</div>
              <div className="val-sub">合理估值 / 每股</div>
            </div>
            <div className="val-row"><span className="l">当前价格</span><span className="v">{ps}{sf(d.price, 2)}</span></div>
            <div className="val-row"><span className="l">估值差距</span><span className={`v ${up2 > 0 ? 'pos' : 'neg'}`}>{up2 > 0 ? '+' : ''}{sf(up2, 1)}%</span></div>
            <div className="val-formula">折现率: 6% | 增长率: {sf(d.growthRate * 100, 1)}% | 终值增长: 3%</div>
            <div className="val-warn"><span>&#9888;</span> DCF是思维方式而非精确计算，结果仅供参考</div>
          </div>

          {/* PE */}
          <div className="val-card">
            <div className="val-title">PE 市盈率参考</div>
            <div className="val-desc">基于企业质量（毛利率、ROE、ROIC）推算合理PE区间，乘以每股收益</div>
            <div className="val-result">
              <div className="val-amount">{ps}{d.peValPerShare > 0 ? d.peValPerShare.toFixed(2) : '--'}</div>
              <div className="val-sub">合理估值 / 每股 (合理PE: {d.reasonablePE}x)</div>
            </div>
            <div className="val-row"><span className="l">当前价格</span><span className="v">{ps}{sf(d.price, 2)}</span></div>
            <div className="val-row"><span className="l">估值差距</span><span className={`v ${up3 > 0 ? 'pos' : 'neg'}`}>{d.peValPerShare > 0 ? `${up3 > 0 ? '+' : ''}${sf(up3, 1)}%` : '--'}</span></div>
            <div className="val-formula">EPS: {ps}{sf(d.eps, 2)} x 合理PE {d.reasonablePE}x</div>
            <div className="val-warn"><span>&#9888;</span> 段永平警告：PE是历史数据，不能预测未来。通用汽车(GM)曾因低PE被误判，最终破产。</div>
          </div>
        </div>
      </div>

      {/* Moat Analysis */}
      <div className="section anim-4">
        <div className="section-head"><span>&#9670;</span><h2>护城河分析</h2></div>
        <div className="moat-grid">
          {d.moats.map((m, i) => <MoatCard key={i} moat={m} animated={moatAnimated} />)}
        </div>
      </div>

      {/* Methodology */}
      <div className="method anim-4">
        <h2>段永平投资清单</h2>
        <div className="method-grid">
          {[
            { t: '能力圈', d: '你能看懂这家公司吗？10年后它的营业额和净利润会比现在低吗？' },
            { t: '商业模式', d: '护城河是否宽广且持久？能否持续产生自由现金流？' },
            { t: '企业文化', d: '管理层是否诚信？是否做"对的事情"？是否有长期主义？' },
            { t: '安全边际', d: '这个价格让你睡得着觉吗？下跌50%你还敢加仓吗？' },
            { t: '机会成本', d: '有没有回报率更高、风险更小的选择？' },
            { t: '三不原则', d: '不做空、不借钱（杠杆）、不懂不做' },
          ].map((item, i) => (
            <div className="method-item" key={i}>
              <h4>{item.t}</h4>
              <p>{item.d}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// --- Example stocks ---
const EXAMPLES = [
  { sym: 'AAPL', label: 'AAPL 苹果' },
  { sym: 'MSFT', label: 'MSFT 微软' },
  { sym: 'GOOG', label: 'GOOG 谷歌' },
  { sym: 'TSLA', label: 'TSLA 特斯拉' },
  { sym: 'NVDA', label: 'NVDA 英伟达' },
  { sym: '600519.SS', label: '600519 茅台' },
  { sym: 'BABA', label: 'BABA 阿里' },
  { sym: 'NTES', label: 'NTES 网易' },
  { sym: 'PDD', label: 'PDD 拼多多' },
  { sym: 'BRK-B', label: 'BRK-B 伯克希尔' },
  { sym: '9988.HK', label: '9988 阿里(港)' },
  { sym: '0700.HK', label: '0700 腾讯' },
];

// --- Main Page ---

export default function Home() {
  const [inputVal, setInputVal] = useState('');
  const [state, setState] = useState('empty'); // empty | loading | error | result
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('连接中');
  const inputRef = useRef(null);

  const analyze = useCallback(async (overrideSym) => {
    const rawSym = overrideSym || inputVal;
    if (!rawSym.trim()) return;
    const sym = normalizeSymbol(rawSym);

    setState('loading');
    setHint(`正在从 Yahoo Finance 获取 ${sym} 实时数据...`);

    try {
      const resp = await fetch(`/api/quote/${encodeURIComponent(sym)}`, {
        signal: AbortSignal.timeout(20000),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      const analysisResult = buildAnalysis(data);
      setResult(analysisResult);
      setState('result');
    } catch (e) {
      setError(e.message || '获取数据失败');
      setState('error');
    }
  }, [inputVal]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') analyze();
  };

  const quickAnalyze = (sym) => {
    setInputVal(sym);
    analyze(sym);
  };

  return (
    <div className="wrap">
      <header>
        <div className="logo">
          <div className="logo-mark">毛</div>
          <div>
            <h1>毛估估</h1>
            <p>Rough Estimation Valuation Tool</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="live-badge"><span className="live-dot" /> LIVE DATA</div>
          <p className="tagline">&ldquo;估值是思维方式，不是数学公式&rdquo; — 段永平</p>
        </div>
      </header>

      <div className="grid">
        {/* Search Panel */}
        <div className="panel search-panel">
          <h2>开始分析</h2>
          <div className="search-box">
            <input
              ref={inputRef}
              type="text"
              placeholder="输入任意股票代码 (如 AAPL, TSLA, 600519.SS)"
              autoComplete="off"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            className="btn-analyze"
            onClick={() => analyze()}
            disabled={state === 'loading'}
          >
            开始估值
          </button>

          <div className="examples">
            <h3>快速示例</h3>
            <div className="examples-row">
              {EXAMPLES.map((ex) => (
                <button key={ex.sym} className="ex-btn" onClick={() => quickAnalyze(ex.sym)}>
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sym-hint">
            <strong style={{ color: 'var(--tx-1)', fontSize: '.8125rem' }}>支持全球股票代码:</strong>
            {' '}美股直接输入代码 (AAPL, MSFT)；A股加 .SS/.SZ (600519.SS, 000858.SZ)；港股加 .HK (0700.HK, 9988.HK)；日股加 .T (7203.T)
          </div>

          <div className="guide">
            <strong>段永平&ldquo;毛估估&rdquo;核心方法</strong>
            <ul>
              <li>存银行本金法（简化估值）</li>
              <li>DCF 现金流折现法</li>
              <li>PE 市盈率参考（含局限性警告）</li>
            </ul>
            <em>本工具使用 Yahoo Finance 实时数据。仅供学习研究，不构成投资建议。</em>
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="panel analysis">
          {state === 'empty' && (
            <div className="state-empty">
              <div className="state-empty-icon">&#x25C8;</div>
              <p>输入任意股票代码，开始毛估估分析</p>
              <small>接入 Yahoo Finance 实时数据，支持全球股票</small>
            </div>
          )}

          {state === 'loading' && (
            <div className="state-loading">
              <div className="spinner" />
              <p>正在从 Yahoo Finance 获取实时数据...</p>
              <small>{hint}</small>
            </div>
          )}

          {state === 'error' && (
            <div className="state-error">
              <p>{error}</p>
              <small>请确认股票代码正确。美股: AAPL; A股: 600519.SS; 港股: 0700.HK</small>
              <button className="retry-btn" onClick={() => analyze()}>重试</button>
            </div>
          )}

          {state === 'result' && result && <ResultView d={result} />}
        </div>
      </div>
    </div>
  );
}
