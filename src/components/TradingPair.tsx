
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ScalpingStrategy from './ScalpingStrategy';

interface TradingPairProps {
  symbol: string;
  strategy: 'scalping' | 'intraday' | 'pump';
}

const TradingPair = ({ symbol, strategy }: TradingPairProps) => {
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);
  const [indicators, setIndicators] = useState<any>(null);

  useEffect(() => {
    // This would normally connect to the WebSocket and get real data
    // For now, we'll use placeholder data
    setCurrentPrice(50000);
    setPriceChange(2.5);
    setVolume(1000000);
    setIndicators({
      rsi: 45,
      macd: { macd: 0.1, signal: 0.05, line: 0.1 },
      ma5: 50100,
      ma8: 50150,
      ma13: 50200,
      ma20: 50250,
      ma21: 50300,
      ma34: 50350,
      ma50: 50400,
      bollingerUpper: 51000,
      bollingerLower: 49000,
      bollingerMiddle: 50000,
      volume: 1000000,
      avgVolume: 800000,
      volumeSpike: true,
      cvd: 500000,
      cvdTrend: 'bullish',
      cvdSlope: 10
    });
  }, [symbol]);

  const renderStrategy = () => {
    if (!indicators) return <div>Loading indicators...</div>;

    switch (strategy) {
      case 'scalping':
        return <ScalpingStrategy symbol={symbol} currentPrice={currentPrice} indicators={indicators} />;
      case 'intraday':
        return <div className="p-4 text-center text-muted-foreground">Intraday strategy component not implemented yet</div>;
      case 'pump':
        return <div className="p-4 text-center text-muted-foreground">Pump strategy component not implemented yet</div>;
      default:
        return <div className="p-4 text-center text-muted-foreground">Unknown strategy</div>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{symbol}</span>
            <Badge variant="outline">{strategy.toUpperCase()}</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-mono">${currentPrice.toLocaleString()}</span>
            <span className={`font-mono ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
            <span className="text-muted-foreground">Vol: {volume.toLocaleString()}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderStrategy()}
      </CardContent>
    </Card>
  );
};

export default TradingPair;
