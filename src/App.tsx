import { useState, useEffect, useMemo } from 'react';
import './App.css';
import { useRouter } from '@/hooks/useRouter';
import { useAppStore } from '@/hooks/useAppStore';
import { Sidebar, TopBar } from '@/components/layouts/AppLayout';
import { ErrorState } from '@/components/shared/States';

import { MarketOverview } from '@/pages/MarketOverview';
import { StocksExplorer } from '@/pages/StocksExplorer';
import { Rankings } from '@/pages/Rankings';
import { PerformanceRankings } from '@/pages/PerformanceRankings';
import { ETFsExplorer } from '@/pages/ETFsExplorer';
import { MutualFundsExplorer } from '@/pages/MutualFundsExplorer';
import { SectorAnalysis } from '@/pages/SectorAnalysis';
import { StockScreener } from '@/pages/StockScreener';
import { FundScreener } from '@/pages/FundScreener';
import { AssetComparison } from '@/pages/AssetComparison';
import { Watchlists } from '@/pages/Watchlists';
import { Portfolio } from '@/pages/Portfolio';
import { MarketNews } from '@/pages/MarketNews';
import { Settings } from '@/pages/Settings';
import { StockDetail } from '@/pages/StockDetail';
import { ETFDetail } from '@/pages/ETFDetail';
import { MutualFundDetail } from '@/pages/MutualFundDetail';

function App() {
  const { route, navigate } = useRouter();
  const store = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Apply theme class to html element
  useEffect(() => {
    const html = document.documentElement;
    if (store.theme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
    }
  }, [store.theme]);

  const page = useMemo(() => {
    // Route matching
    if (route === '/' || route === '') return <MarketOverview navigate={navigate} />;
    if (route === '/stocks') return <StocksExplorer navigate={navigate} />;
    if (route.startsWith('/stock/')) {
      const ticker = route.replace('/stock/', '');
      return <StockDetail ticker={ticker} navigate={navigate} />;
    }
    if (route === '/gainers') return <Rankings navigate={navigate} mode="gainers" />;
    if (route === '/losers') return <Rankings navigate={navigate} mode="losers" />;
    if (route === '/rankings') return <PerformanceRankings navigate={navigate} />;
    if (route === '/etfs') return <ETFsExplorer navigate={navigate} />;
    if (route.startsWith('/etf/')) {
      const ticker = route.replace('/etf/', '');
      return <ETFDetail ticker={ticker} navigate={navigate} />;
    }
    if (route === '/mutual-funds') return <MutualFundsExplorer navigate={navigate} />;
    if (route.startsWith('/mutual-fund/')) {
      const id = route.replace('/mutual-fund/', '');
      return <MutualFundDetail id={id} navigate={navigate} />;
    }
    if (route === '/sectors') return <SectorAnalysis navigate={navigate} />;
    if (route === '/stock-screener') return <StockScreener navigate={navigate} />;
    if (route === '/fund-screener') return <FundScreener navigate={navigate} />;
    if (route === '/comparison') return <AssetComparison navigate={navigate} />;
    if (route === '/watchlists') return <Watchlists navigate={navigate} />;
    if (route === '/portfolio') return <Portfolio navigate={navigate} />;
    if (route === '/news') return <MarketNews navigate={navigate} />;
    if (route === '/settings') return <Settings navigate={navigate} />;
    return <ErrorState message={`Page not found: ${route}`} onRetry={() => navigate('/')} />;
  }, [route, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        route={route}
        navigate={navigate}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
        <TopBar route={route} navigate={navigate} onMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">
          {page}
        </main>
      </div>
    </div>
  );
}

export default App;
