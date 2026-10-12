import { useState, useMemo } from 'react';
import { useNews } from '@/hooks/useData';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader, DemoBadge, EmptyState } from '@/components/shared/States';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/format';
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { NewsItem } from '@/types';

interface MarketNewsProps {
  navigate: (path: string) => void;
}

const CATEGORIES = [
  { value: 'all', label: 'All News' },
  { value: 'market', label: 'Market' },
  { value: 'company', label: 'Company' },
  { value: 'earnings', label: 'Earnings' },
  { value: 'dividend', label: 'Dividends' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'economic', label: 'Economic' },
];

export function MarketNews({ navigate }: MarketNewsProps) {
  const allNews = useNews();
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    if (category === 'all') return allNews;
    return allNews.filter((n) => n.category === category);
  }, [allNews, category]);

  const sentimentIcon = (s: NewsItem['sentiment']) => {
    if (s === 'positive') return <TrendingUp className="h-3.5 w-3.5 text-success" />;
    if (s === 'negative') return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Market News" description="Headlines, earnings, and corporate actions">
        <DemoBadge />
      </PageHeader>

      <Tabs value={category} onValueChange={setCategory}>
        <TabsList className="flex-wrap h-auto">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.value} value={c.value} className="text-xs">{c.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState title="No news available" description="No news articles found for this category." icon={<Newspaper className="h-12 w-12" />} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((n) => (
            <Card key={n.id} className="hover:border-muted-foreground/30 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">{n.category}</span>
                    {sentimentIcon(n.sentiment)}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(n.publishedAt)}</span>
                </div>
                <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-primary">
                  {n.title} <ExternalLink className="inline h-3 w-3" />
                </a>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{n.summary}</p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground/70">Source: {n.source}</span>
                  {n.tickers.length > 0 && (
                    <div className="flex gap-1">
                      {n.tickers.map((t) => (
                        <button key={t} onClick={() => navigate(`/stock/${t}`)} className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground hover:bg-primary/10 hover:text-primary">
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
