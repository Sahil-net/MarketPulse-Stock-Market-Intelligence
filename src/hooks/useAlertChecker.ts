import { useEffect, useRef } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { fetchQuotes } from '@/services/marketDataApi';
import { toast } from '@/hooks/use-toast';

export function useAlertChecker() {
  const store = useAppStore();
  const { user } = useAuth();
  const checkedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      checkedRef.current.clear();
      return;
    }

    const activeAlerts = store.priceAlerts.filter((a) => a.enabled && !a.triggered);
    if (activeAlerts.length === 0) return;

    const symbols = [...new Set(activeAlerts.map((a) => a.symbol))];
    let active = true;

    const check = async () => {
      const quotes = await fetchQuotes(symbols);
      if (!active) return;

      for (const alert of activeAlerts) {
        const quote = quotes[alert.symbol];
        if (!quote) continue;

        const crossed =
          (alert.direction === 'above' && quote.currentPrice >= alert.targetPrice) ||
          (alert.direction === 'below' && quote.currentPrice <= alert.targetPrice);

        if (crossed && !checkedRef.current.has(alert.id)) {
          checkedRef.current.add(alert.id);
          const dir = alert.direction === 'above' ? 'risen above' : 'dropped below';
          toast({
            title: `Price Alert: ${alert.symbol}`,
            description: `${alert.name} has ${dir} $${alert.targetPrice.toFixed(2)} (now $${quote.currentPrice.toFixed(2)})`,
          });
          store.markAlertTriggered(alert.id);
        }
      }
    };

    const timer = setTimeout(check, 2000);
    const interval = setInterval(check, 30000);

    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, store.priceAlerts]);
}
