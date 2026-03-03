import { fetchYahooQuote, processQuoteData } from '@/lib/yahoo';

export async function GET(request, { params }) {
  const { symbol } = await params;

  try {
    const raw = await fetchYahooQuote(symbol);
    const data = processQuoteData(raw, symbol);
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
