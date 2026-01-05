import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MarketData from './pages/MarketData';
import Portfolio from './pages/Portfolio';
import PaperTrading from './pages/PaperTrading';
import TechnicalAnalysis from './pages/TechnicalAnalysis';
import News from './pages/News';
import AIInsights from './pages/AIInsights';
import Settings from './pages/Settings';
import TradingViewPro from './pages/TradingViewPro';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/market" element={<MarketData />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/paper-trading" element={<PaperTrading />} />
            <Route path="/analysis" element={<TechnicalAnalysis />} />
            <Route path="/trading" element={<TradingViewPro />} />
            <Route path="/news" element={<News />} />
            <Route path="/insights" element={<AIInsights />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;