import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { binanceWS } from '../services/binanceWebSocket';
import { indicatorCalculator, checkIndicatorMatch, type IndicatorValues } from '../utils/indicators';
import ScalpingStrategy from './ScalpingStrategy';
import IntradayStrategy from './IntradayStrategy';
import PumpStrategy from './PumpStrategy';
import SignalHistory from './SignalHistory';

interface TradingPairTabProps {
  symbol: string;
  isActive: boolean;
}

interface IndicatorDisplay {
  name: string;
  value: string;
  isMatch: boolean;
  delay: number;
}

const TradingPairTab = ({ symbol, isActive }: TradingPairTabProps) => {
  const [indicators, setIndicators] = useState<IndicatorDisplay[]>([]);
  const [indicatorValues, setIndicatorValues] = useState<IndicatorValues | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting to Futures...');
  const [activeStrategyTab, setActiveStrategyTab] = useState('indicators');

  useEffect(() => {
    if (!isActive) return;

    console.log(`🎯 Setting up futures data handler for ${symbol}`);
    setConnectionStatus('Connecting to Futures...');

    const handleData = (data: any) => {
      console.log(`📊 Received futures data for ${symbol}:`, data);
      
      if (data.type === 'ticker') {
        setConnectionStatus('Connected to Futures');
        
        const price = parseFloat(data.c || data.price || '0');
        const volume = parseFloat(data.v || data.volume || '0');
        const delay = data.delay || 0;
        
        const openInterest = volume * 0.1;
        
        console.log(`💰 Processing FUTURES price: ${price}, volume: ${volume}, OI: ${openInterest} for ${symbol} (${delay}ms delay)`);
        
        if (price > 0) {
          indicatorCalculator.updatePrice(symbol, price, volume, openInterest);
          
          const indicatorValues = indicatorCalculator.getIndicatorValues(symbol);
          console.log(`📈 Calculated futures indicators for ${symbol}:`, indicatorValues);
          
          const displayIndicators = formatIndicators(indicatorValues, price, delay);
          
          setIndicators(displayIndicators);
          setIndicatorValues(indicatorValues);
          setLastUpdate(new Date().toLocaleTimeString());
        } else {
          console.warn(`⚠️ Invalid futures price data for ${symbol}:`, data);
        }
      } else if (data.type === 'kline_1m') {
        console.log(`📊 Received futures kline data for ${symbol}`);
      }
    };

    binanceWS.subscribe(symbol, handleData);

    const connectionTimeout = setTimeout(() => {
      if (indicators.length === 0) {
        setConnectionStatus('Futures connection issues - check console');
      }
    }, 10000);

    return () => {
      clearTimeout(connectionTimeout);
      binanceWS.unsubscribe(symbol);
    };
  }, [symbol, isActive]);

  const formatIndicators = (values: IndicatorValues, currentPrice: number, delay: number): IndicatorDisplay[] => {
    return [
      {
        name: 'Current Price',
        value: `$${values.price.toFixed(4)}`,
        isMatch: true,
        delay
      },
      {
        name: 'RSI',
        value: values.rsi.toFixed(2),
        isMatch: checkIndicatorMatch('RSI', values.rsi, currentPrice),
        delay
      },
      {
        name: 'MACD Line',
        value: values.macd.line.toFixed(6),
        isMatch: checkIndicatorMatch('MACD Line', values.macd.line, currentPrice),
        delay
      },
      {
        name: 'MACD Signal',
        value: values.macd.signal.toFixed(6),
        isMatch: values.macd.line > values.macd.signal,
        delay
      },
      {
        name: '5 EMA',
        value: values.ma5.toFixed(4),
        isMatch: checkIndicatorMatch('5 EMA', values.ma5, currentPrice),
        delay
      },
      {
        name: '20 EMA',
        value: values.ma20.toFixed(4),
        isMatch: checkIndicatorMatch('20 EMA', values.ma20, currentPrice),
        delay
      },
      {
        name: '50 EMA',
        value: values.ma50.toFixed(4),
        isMatch: checkIndicatorMatch('50 EMA', values.ma50, currentPrice),
        delay
      },
      {
        name: 'Bollinger Upper',
        value: values.bollingerUpper.toFixed(4),
        isMatch: currentPrice <= values.bollingerUpper,
        delay
      },
      {
        name: 'Bollinger Lower',
        value: values.bollingerLower.toFixed(4),
        isMatch: currentPrice >= values.bollingerLower,
        delay
      },
      {
        name: 'Bollinger Middle',
        value: values.bollingerMiddle.toFixed(4),
        isMatch: Math.abs(currentPrice - values.bollingerMiddle) / currentPrice <= 0.01,
        delay
      },
      {
        name: 'Volume',
        value: values.volume.toLocaleString(),
        isMatch: values.volume > 0,
        delay
      },
      {
        name: 'Avg Volume',
        value: values.avgVolume.toLocaleString(),
        isMatch: true,
        delay
      },
      {
        name: 'Volume Spike',
        value: values.volumeSpike ? 'YES' : 'NO',
        isMatch: values.volumeSpike,
        delay
      },
      {
        name: 'Open Interest',
        value: values.openInterest.toLocaleString(),
        isMatch: checkIndicatorMatch('Open Interest', values.openInterest, currentPrice),
        delay
      },
      {
        name: 'CVD',
        value: values.cvd.toLocaleString(),
        isMatch: checkIndicatorMatch('CVD', values.cvd, currentPrice),
        delay
      },
      {
        name: 'CVD Trend',
        value: values.cvdTrend.toUpperCase(),
        isMatch: values.cvdTrend === 'bullish',
        delay
      }
    ];
  };

  if (!isActive) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary neo-glow">
          {symbol}
        </h2>
        <div className="text-sm text-muted-foreground">
          Status: {connectionStatus} | Last Update: {lastUpdate || 'Never'}
        </div>
      </div>

      <Tabs value={activeStrategyTab} onValueChange={setActiveStrategyTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6 bg-card/50 neo-border p-1">
          <TabsTrigger value="indicators">Indicators</TabsTrigger>
          <TabsTrigger value="scalping">Scalping</TabsTrigger>
          <TabsTrigger value="intraday">Intraday</TabsTrigger>
          <TabsTrigger value="pump">Pump Mode</TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="indicators" className="mt-0">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 gap-4 p-4 neo-border rounded-lg bg-card/50">
              <div className="font-semibold text-primary">Indicator</div>
              <div className="font-semibold text-primary">Value</div>
              <div className="font-semibold text-primary">Delay (ms)</div>
            </div>

            {indicators.map((indicator, index) => (
              <div
                key={index}
                className={`grid grid-cols-3 gap-4 p-4 rounded-lg transition-all duration-300 ${
                  indicator.isMatch ? 'indicator-positive' : 'indicator-negative'
                }`}
              >
                <div className="font-medium text-foreground">
                  {indicator.name}
                </div>
                <div className="font-mono text-foreground font-bold">
                  {indicator.value}
                </div>
                <div className="font-mono text-foreground">
                  {indicator.delay}ms
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scalping" className="mt-0">
          {indicatorValues && (
            <ScalpingStrategy 
              symbol={symbol}
              currentPrice={indicatorValues.price}
              indicators={indicatorValues}
            />
          )}
        </TabsContent>

        <TabsContent value="intraday" className="mt-0">
          {indicatorValues && (
            <IntradayStrategy 
              symbol={symbol}
              currentPrice={indicatorValues.price}
              indicators={indicatorValues}
            />
          )}
        </TabsContent>

        <TabsContent value="pump" className="mt-0">
          {indicatorValues && (
            <PumpStrategy 
              symbol={symbol}
              currentPrice={indicatorValues.price}
              indicators={indicatorValues}
            />
          )}
        </TabsContent>

        <TabsContent value="signals" className="mt-0">
          <SignalHistory />
        </TabsContent>
      </Tabs>

      {indicators.length === 0 && (
        <div className="flex items-center justify-center p-8 neo-border rounded-lg">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">{connectionStatus}</p>
            <p className="text-sm text-muted-foreground mt-2">Loading {symbol} data</p>
            <p className="text-xs text-muted-foreground mt-2">Check browser console for detailed logs</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingPairTab;
