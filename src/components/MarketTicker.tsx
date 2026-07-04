import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
  id: string;
  label: string;
  value: string;
  changePercent: number;
}

function formatARS(n: number): string {
  return `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}

function formatUSD(n: number): string {
  return `US$${n.toLocaleString('en-US', { maximumFractionDigits: n < 10 ? 4 : 2 })}`;
}

async function fetchDolares(): Promise<TickerItem[]> {
  try {
    const res = await fetch('https://dolarapi.com/v1/ambito/dolares');
    if (!res.ok) return [];
    const data = await res.json();
    const nombres: Record<string, string> = {
      oficial: 'Dólar Oficial',
      blue: 'Dólar Blue',
      bolsa: 'Dólar MEP',
      contadoconliqui: 'Dólar CCL',
    };
    return data
      .filter((d: any) => nombres[d.casa])
      .map((d: any) => ({
        id: `dolar-${d.casa}`,
        label: nombres[d.casa],
        value: formatARS(d.venta),
        changePercent: typeof d.variacion === 'number' ? d.variacion : 0,
      }));
  } catch {
    return [];
  }
}

async function fetchCriptos(): Promise<TickerItem[]> {
  const nombres: Record<string, string> = { BTCUSDT: 'Bitcoin', ETHUSDT: 'Ethereum' };
  try {
    const results = await Promise.all(
      Object.keys(nombres).map(async (symbol) => {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
        if (!res.ok) return null;
        const data = await res.json();
        return {
          id: `cripto-${symbol}`,
          label: nombres[symbol],
          value: formatUSD(parseFloat(data.lastPrice)),
          changePercent: parseFloat(data.priceChangePercent),
        } as TickerItem;
      })
    );
    return results.filter((r): r is TickerItem => r !== null);
  } catch {
    return [];
  }
}

async function fetchAcciones(): Promise<TickerItem[]> {
  const apiKey = import.meta.env.VITE_TWELVEDATA_API_KEY;
  if (!apiKey) return [];

  try {
    const symbols = 'SPY,QQQ,YPF';
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${apiKey}`
    );
    if (!res.ok) return [];
    const data = await res.json();

    const nombres: Record<string, string> = {
      SPY: 'S&P 500',
      QQQ: 'Nasdaq',
      YPF: 'YPF',
    };

    return Object.keys(nombres)
      .filter((symbol) => data[symbol] && !data[symbol].code)
      .map((symbol) => ({
        id: `accion-${symbol}`,
        label: nombres[symbol],
        value: formatUSD(parseFloat(data[symbol].close)),
        changePercent: parseFloat(data[symbol].percent_change ?? '0'),
      }));
  } catch {
    return [];
  }
}

export default function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAll() {
      const [dolares, criptos, acciones] = await Promise.all([
        fetchDolares(),
        fetchCriptos(),
        fetchAcciones(),
      ]);
      if (active) {
        setItems([...dolares, ...criptos, ...acciones]);
        setLoading(false);
      }
    }

    loadAll();
    const interval = setInterval(loadAll, 5 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (loading || items.length === 0) {
    return null;
  }

  const loopItems = [...items, ...items];

  return (
    <div className="w-full bg-slate-900 dark:bg-black overflow-hidden border-b border-slate-800 select-none">
      <div className="flex w-max animate-market-ticker">
        {loopItems.map((item, index) => {
          const isUp = item.changePercent >= 0;
          return (
            <div
              key={`${item.id}-${index}`}
              className="flex items-center gap-2 px-5 py-2 whitespace-nowrap text-xs font-semibold"
            >
              <span className="text-slate-300">{item.label}</span>
              <span className="text-white">{item.value}</span>
              <span
                className={`flex items-center gap-0.5 ${
                  isUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(item.changePercent).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
