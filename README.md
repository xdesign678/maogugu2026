# 毛估估 Maoguugu

段永平价值投资估值工具 — Duan Yongping's "rough estimate" value investing valuation tool.

Built with **Next.js** (full-stack, no separate backend needed).

## Features

- **Bank Deposit Method** (银行存款法): If current earnings were a bank deposit, what would the stock be worth?
- **Simplified DCF** (简化DCF): Discounted Cash Flow valuation based on Free Cash Flow
- **PE-based Check** (PE估值校验): Forward earnings-based sanity check
- **Moat Analysis** (护城河分析): Brand/pricing power, capital efficiency, cash flow quality, financial safety
- **Buy/Hold/Avoid Recommendation**: Confidence-scored recommendation

## Data Source

Real-time data from Yahoo Finance (no API key required). Supports US stocks, Hong Kong stocks, and A-shares (Shanghai/Shenzhen).

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to use the tool.

## Deploy to Vercel

The easiest way to deploy:

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com), import the repo
3. Click Deploy - done!

No environment variables or configuration needed.

## How It Works

1. **API Route** (`app/api/quote/[symbol]/route.js`): Server-side Yahoo Finance proxy using cookie/crumb authentication
2. **Frontend** (`app/page.js`): React client component with valuation calculations, moat analysis, and recommendation engine

## License

MIT
