'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import './methodology.css';

// Scroll-triggered fade-in observer
function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    if (ref.current) {
      ref.current.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    }
    return () => observer.disconnect();
  }, []);
  return ref;
}

function QuoteBlock({ text, source }) {
  return (
    <blockquote className="meth-quote reveal">
      <div className="meth-quote-mark">&ldquo;</div>
      <p>{text}</p>
      <cite>— {source}</cite>
    </blockquote>
  );
}

function FormulaCard({ number, title, subtitle, formula, steps, warning, color }) {
  return (
    <div className={`formula-card reveal formula-${color}`}>
      <div className="formula-num">{number}</div>
      <h3 className="formula-title">{title}</h3>
      <p className="formula-subtitle">{subtitle}</p>
      <div className="formula-box">
        <code>{formula}</code>
      </div>
      <div className="formula-steps">
        {steps.map((s, i) => (
          <div key={i} className="formula-step">
            <span className="formula-step-n">{i + 1}</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
      {warning && <div className="formula-warn">{warning}</div>}
    </div>
  );
}

function ChecklistItem({ title, desc }) {
  return (
    <div className="checklist-item reveal">
      <div className="checklist-diamond" />
      <div>
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
    </div>
  );
}

export default function MethodologyPage() {
  const containerRef = useScrollReveal();

  return (
    <div className="meth-page" ref={containerRef}>
      {/* Decorative background */}
      <div className="meth-bg-grid" />
      <div className="meth-bg-glow" />

      {/* Navigation */}
      <nav className="meth-nav reveal">
        <Link href="/" className="meth-back">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          返回估值工具
        </Link>
      </nav>

      {/* Hero */}
      <header className="meth-hero reveal">
        <div className="meth-hero-badge">METHODOLOGY</div>
        <h1 className="meth-hero-title">
          <span className="meth-hero-char">毛</span>
          <span className="meth-hero-char">估</span>
          <span className="meth-hero-char">估</span>
        </h1>
        <p className="meth-hero-sub">段永平价值投资方法论</p>
        <div className="meth-hero-line" />
        <p className="meth-hero-desc">
          &ldquo;毛估估&rdquo;并非精确计算，而是一种思维框架。<br/>
          它帮助投资者用常识判断企业是否值得拥有，以及合理的买入价格。
        </p>
      </header>

      {/* Who is Duan Yongping */}
      <section className="meth-section">
        <div className="meth-section-label reveal">关于段永平</div>
        <div className="meth-person reveal">
          <div className="meth-person-info">
            <h2>段永平</h2>
            <p className="meth-person-titles">步步高集团创始人 &middot; OPPO/vivo 幕后推手 &middot; 价值投资践行者</p>
            <p className="meth-person-bio">
              段永平是中国最成功的价值投资者之一。他在2001年以$1附近买入网易（NTES），最终获利超过100倍；
              2011年买入苹果（AAPL）并长期持有。他的投资哲学深受沃伦·巴菲特和查理·芒格影响，
              强调&ldquo;买股票就是买公司&rdquo;，关注企业的长期内在价值而非短期股价波动。
            </p>
            <div className="meth-person-stats">
              <div className="meth-stat">
                <div className="meth-stat-val">100x+</div>
                <div className="meth-stat-label">网易投资回报</div>
              </div>
              <div className="meth-stat">
                <div className="meth-stat-val">20+年</div>
                <div className="meth-stat-label">持有苹果股票</div>
              </div>
              <div className="meth-stat">
                <div className="meth-stat-val">62万美元</div>
                <div className="meth-stat-label">拍下巴菲特午餐</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <QuoteBlock
        text="投资很简单，但不容易。所谓的'毛估估'就是用最简单的方法算出一个大概的价值范围。"
        source="段永平"
      />

      {/* Core Philosophy */}
      <section className="meth-section">
        <div className="meth-section-label reveal">核心理念</div>
        <h2 className="meth-section-title reveal">四个基本原则</h2>
        <div className="meth-principles">
          {[
            {
              icon: '01',
              title: '买股票就是买公司',
              desc: '不要把股票当成交易的筹码。每买一股，你都成为了这家公司的合伙人。要像买下整家公司一样去思考。',
              emphasis: '如果你不愿意持有一家公司10年，那就连10分钟也不要持有。'
            },
            {
              icon: '02',
              title: '安全边际',
              desc: '即使是最好的公司，也需要在合理或低估的价格买入。毛估估的核心就是估算一个"大概对"的内在价值，然后在价格远低于价值时买入。',
              emphasis: '宁可"模糊的正确"，也不要"精确的错误"。'
            },
            {
              icon: '03',
              title: '能力圈',
              desc: '只投资你真正理解的企业。如果你无法用简单的话解释一家公司怎么赚钱、为什么10年后它还能赚钱，那就不要投。',
              emphasis: '知道自己不懂什么，比知道自己懂什么更重要。'
            },
            {
              icon: '04',
              title: '长期主义',
              desc: '好公司需要时间来兑现价值。频繁交易是投资的大敌。找到好公司，买入后耐心持有，让复利为你工作。',
              emphasis: '时间是好公司的朋友，坏公司的敌人。'
            },
          ].map((p, i) => (
            <div key={i} className="meth-principle reveal">
              <div className="meth-principle-icon">{p.icon}</div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
              <div className="meth-principle-emphasis">{p.emphasis}</div>
            </div>
          ))}
        </div>
      </section>

      <QuoteBlock
        text="所谓的毛估估，就是用自由现金流来毛估估一下公司的内在价值，看看现在的价格是不是'便宜'。"
        source="段永平"
      />

      {/* Three Methods */}
      <section className="meth-section">
        <div className="meth-section-label reveal">估值方法</div>
        <h2 className="meth-section-title reveal">三种毛估估方法</h2>
        <p className="meth-section-desc reveal">
          段永平从不追求精确到小数点的估值。以下三种方法从不同角度给出&ldquo;大概对&rdquo;的价值范围，
          彼此交叉验证。
        </p>

        <div className="formula-grid">
          <FormulaCard
            number="I"
            title="存银行本金法"
            subtitle="最直觉的估值方法 — 如果这笔现金流是银行存款利息，本金值多少？"
            formula="估值 = (年均自由现金流 / 无风险利率) x 安全系数"
            color="gold"
            steps={[
              '计算企业近3-5年的平均自由现金流（FCF）',
              '除以无风险利率（如5%长期国债利率），得到"本金"',
              '乘以安全系数（通常0.6，即打六折），体现安全边际',
              '除以总股数得到每股内在价值',
            ]}
            warning={null}
          />

          <FormulaCard
            number="II"
            title="DCF 现金流折现"
            subtitle="将企业未来10年的现金流折算到今天 — 未来的钱不如今天的钱值钱"
            formula="估值 = Sum(FCF x (1+g)^t / (1+r)^t) + 终值"
            color="green"
            steps={[
              '以历史平均FCF为基础，按保守增长率g逐年增长',
              '每年的FCF按折现率r（通常6%）折算到今天的价值',
              '累加10年的折现现金流',
              '加上第10年后的永续经营终值（永续增长3%）',
            ]}
            warning="段永平强调：DCF是一种思维方式，而不是数学公式。不要迷信精确的数字。"
          />

          <FormulaCard
            number="III"
            title="PE 市盈率校验"
            subtitle="辅助参考 — 基于企业质量推算合理的PE倍数"
            formula="估值 = 每股收益(EPS) x 合理PE倍数"
            color="amber"
            steps={[
              '根据毛利率、ROE、ROIC判断企业质量等级',
              '高质量企业（毛利率>60%, ROE>25%）给予更高PE',
              '合理PE范围通常在15-35倍之间',
              '乘以当前EPS得到参考估值',
            ]}
            warning={'段永平警告：PE是历史数据，只说了\u201C上半句\u201D。通用汽车曾因低PE被误判为便宜，最终破产。'}
          />
        </div>
      </section>

      <QuoteBlock
        text="利润是观点，现金流才是事实。看一家公司好不好，先看它能不能持续产生自由现金流。"
        source="段永平"
      />

      {/* Moat Analysis */}
      <section className="meth-section">
        <div className="meth-section-label reveal">护城河</div>
        <h2 className="meth-section-title reveal">护城河分析框架</h2>
        <p className="meth-section-desc reveal">
          好价格买到烂公司，不如好价格买到好公司。护城河决定了企业能否长期保持竞争优势。
        </p>

        <div className="moat-analysis-grid">
          {[
            {
              name: '品牌/定价权',
              indicator: '毛利率',
              thresholds: '> 60% 极强 | > 40% 良好 | < 40% 一般',
              example: '茅台毛利率91%，消费者愿意排队加价购买',
              why: '高毛利率意味着企业可以自主定价，不惧竞争对手的价格战。这是品牌护城河的直接体现。',
            },
            {
              name: '资本效率',
              indicator: 'ROIC',
              thresholds: '> 20% 卓越 | > 15% 良好 | < 15% 一般',
              example: '苹果ROIC超过100%，每投入1元产生超过1元回报',
              why: '高ROIC说明企业能用更少的资本产生更多利润，是护城河有效性的关键验证指标。',
            },
            {
              name: '现金流质量',
              indicator: 'FCF稳定性',
              thresholds: '多年持续为正 | 偶有波动 | 不稳定',
              example: '微软连续20年正FCF，现金流如印钞机般稳定',
              why: '持续为正的FCF说明企业不需要大量再投资就能维持竞争力，是"躺赚"型商业模式的标志。',
            },
            {
              name: '财务安全',
              indicator: '负债率',
              thresholds: '< 20% 极安全 | < 40% 安全 | > 40% 需关注',
              example: '茅台几乎零负债，即使经济危机也高枕无忧',
              why: '低负债让企业在经济下行期有更强的生存能力，也意味着管理层不需要用杠杆来维持回报。',
            },
          ].map((m, i) => (
            <div key={i} className="moat-deep-card reveal">
              <div className="moat-deep-header">
                <span className="moat-deep-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{m.name}</h3>
              </div>
              <div className="moat-deep-indicator">
                <span className="moat-deep-tag">核心指标</span>
                <span>{m.indicator}</span>
              </div>
              <div className="moat-deep-thresholds">{m.thresholds}</div>
              <p className="moat-deep-why">{m.why}</p>
              <div className="moat-deep-example">
                <span>案例</span> {m.example}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Checklist */}
      <section className="meth-section">
        <div className="meth-section-label reveal">投资清单</div>
        <h2 className="meth-section-title reveal">买入前必须回答的六个问题</h2>
        <p className="meth-section-desc reveal">
          段永平说：&ldquo;投资最重要的是'不做什么'，而不是'做什么'。&rdquo;
          以下六个问题，任何一个答不上来，都应该放弃。
        </p>
        <div className="checklist-grid">
          <ChecklistItem title="你能看懂这家公司吗？" desc="你能用一句话说清它怎么赚钱吗？10年后这门生意还在吗？如果答案不确定，那就在你的能力圈之外。" />
          <ChecklistItem title="它的护城河够宽吗？" desc="竞争对手能轻易复制它的商业模式吗？它的客户转换成本高吗？它有网络效应或规模优势吗？" />
          <ChecklistItem title="管理层值得信任吗？" desc="管理层是否诚信？是否做'对的事情'？是否关注长期价值而非短期股价？创始人文化是加分项。" />
          <ChecklistItem title="价格让你睡得着觉吗？" desc="如果明天股价跌50%，你会恐慌还是会兴奋地加仓？如果是前者，说明你买贵了或不够理解这家公司。" />
          <ChecklistItem title="有没有更好的选择？" desc="投资有机会成本。这笔钱放在这里，是否比放在其他地方回报更高、风险更小？" />
          <ChecklistItem title="你遵守了三不原则吗？" desc="不做空（风险无限大）、不借钱炒股（杠杆是毒药）、不懂不做（承认自己的无知）。" />
        </div>
      </section>

      <QuoteBlock
        text="投资很简单，不容易。简单是因为原则就那么几条；不容易是因为人性的弱点让你很难坚持。"
        source="段永平"
      />

      {/* CTA */}
      <section className="meth-cta reveal">
        <h2>开始你的毛估估之旅</h2>
        <p>选择一家你真正理解的公司，用上述方法估算它的价值。</p>
        <Link href="/" className="meth-cta-btn">
          打开估值工具
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </section>

      <footer className="meth-footer reveal">
        <p>本页面内容整理自段永平公开发言及投资案例，仅供学习研究，不构成投资建议。</p>
      </footer>
    </div>
  );
}
