
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { signalPersistence } from '../utils/signalPersistence';
import type { IndicatorValues } from '../utils/indicators';

interface IntradayStrategyProps {
  symbol: string;
  currentPrice: number;
  indicators: IndicatorValues;
}

const IntradayStrategy = ({ symbol, currentPrice, indicators }: IntradayStrategyProps) => {
  // Revised intraday strategy conditions
  const checkIntradayConditions = () => {
    const entryPrice = currentPrice;
    const takeProfit = entryPrice * 1.02; // +2% for intraday
    const stopLoss = entryPrice * 0.99; // -1% stop loss
    
    // Step 1: Check Bollinger Bands (Price ≤ BBLower × 1.005)
    const bollingerCondition = currentPrice <= indicators.bollingerLower * 1.005;
    
    // Step 2: Check MACD (MACD Line > Signal Line)
    const macdCondition = indicators.macd.line > indicators.macd.signal;
    
    // Step 3: Check RSI (40 < RSI < 60)
    const rsiCondition = indicators.rsi > 40 && indicators.rsi < 60;
    
    // Step 4: Check Moving Averages (Price > EMA34 AND EMA20 > EMA34)
    const maCondition = currentPrice > indicators.ma34 && indicators.ma20 > indicators.ma34;
    
    // Step 5: Check Volume (> AvgVolume × 1.5)
    const volumeCondition = indicators.volume > indicators.avgVolume * 1.5;
    
    // Step 6: Check CVD (> 0 with increasing slope, last 10 candles)
    const cvdCondition = indicators.cvd > 0 && indicators.cvdSlope > 0;
    
    const conditions = {
      bollingerBands: bollingerCondition,
      macd: macdCondition,
      rsi: rsiCondition,
      movingAverages: maCondition,
      volume: volumeCondition,
      cvd: cvdCondition
    };
    
    const allConditionsMet = Object.values(conditions).every(Boolean);
    
    return {
      entryPrice,
      takeProfit,
      stopLoss,
      conditions,
      allConditionsMet,
      signal: allConditionsMet ? 'LONG' : 'WAIT'
    };
  };

  const strategy = checkIntradayConditions();

  // Save signal if conditions are met
  if (strategy.allConditionsMet) {
    const signalId = signalPersistence.generateSignalId(symbol, 'intraday', Date.now());
    const signal = {
      id: signalId,
      symbol,
      strategy: 'intraday' as const,
      signal: strategy.signal as 'LONG',
      timestamp: Date.now(),
      entryPrice: strategy.entryPrice,
      takeProfit: strategy.takeProfit,
      stopLoss: strategy.stopLoss,
      indicators: {
        rsi: indicators.rsi,
        macd: indicators.macd,
        ma5: indicators.ma5,
        ma8: indicators.ma8,
        ma13: indicators.ma13,
        ma20: indicators.ma20,
        ma21: indicators.ma21,
        ma34: indicators.ma34,
        ma50: indicators.ma50,
        bollingerUpper: indicators.bollingerUpper,
        bollingerLower: indicators.bollingerLower,
        currentPrice,
        volume: indicators.volume,
        volumeSpike: indicators.volumeSpike,
        cvd: indicators.cvd,
        cvdTrend: indicators.cvdTrend
      },
      conditions: strategy.conditions,
      active: true
    };
    
    signalPersistence.saveSignal(signal);
  }

  return (
    <div className="space-y-4">
      <div className="p-4 neo-border rounded-lg bg-card/50">
        <h3 className="text-lg font-semibold text-primary mb-4">Intraday Strategy - {symbol}</h3>
        
        <div className="grid grid-cols-1 gap-3 mb-4">
          {/* Bollinger Bands Check */}
          <div className={`p-3 rounded-lg ${strategy.conditions.bollingerBands ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">Price ≤ BBLower × 1.005</span>
              <span className="font-mono">{currentPrice.toFixed(4)} ≤ {(indicators.bollingerLower * 1.005).toFixed(4)}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                strategy.conditions.bollingerBands ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'
              }`}>
                {strategy.conditions.bollingerBands ? '✓' : '✗'}
              </span>
            </div>
          </div>

          {/* MACD Check */}
          <div className={`p-3 rounded-lg ${strategy.conditions.macd ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">MACD Line &gt; Signal</span>
              <span className="font-mono">{indicators.macd.line.toFixed(6)} / {indicators.macd.signal.toFixed(6)}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                strategy.conditions.macd ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'
              }`}>
                {strategy.conditions.macd ? '✓' : '✗'}
              </span>
            </div>
          </div>

          {/* RSI Check */}
          <div className={`p-3 rounded-lg ${strategy.conditions.rsi ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">RSI (40-60)</span>
              <span className="font-mono">{indicators.rsi.toFixed(2)}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                strategy.conditions.rsi ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'
              }`}>
                {strategy.conditions.rsi ? '✓' : '✗'}
              </span>
            </div>
          </div>

          {/* Moving Averages Check */}
          <div className={`p-3 rounded-lg ${strategy.conditions.movingAverages ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">Price &gt; EMA34 &amp; EMA20 &gt; EMA34</span>
              <span className="font-mono">{currentPrice.toFixed(4)} / {indicators.ma34.toFixed(4)} / {indicators.ma20.toFixed(4)}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                strategy.conditions.movingAverages ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'
              }`}>
                {strategy.conditions.movingAverages ? '✓' : '✗'}
              </span>
            </div>
          </div>

          {/* Volume Check */}
          <div className={`p-3 rounded-lg ${strategy.conditions.volume ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">Volume &gt; 1.5x Avg</span>
              <span className="font-mono">{indicators.volume.toLocaleString()} / {indicators.avgVolume.toLocaleString()}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                strategy.conditions.volume ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'
              }`}>
                {strategy.conditions.volume ? '✓' : '✗'}
              </span>
            </div>
          </div>

          {/* CVD Check */}
          <div className={`p-3 rounded-lg ${strategy.conditions.cvd ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">CVD &gt; 0 &amp; Slope &gt; 0 (10 candles)</span>
              <span className="font-mono">{indicators.cvd.toLocaleString()} / Slope: {indicators.cvdSlope.toFixed(2)}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                strategy.conditions.cvd ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'
              }`}>
                {strategy.conditions.cvd ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>

        {/* Entry Table */}
        {strategy.allConditionsMet && (
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
            <h4 className="text-lg font-semibold text-green-400 mb-3">🚀 INTRADAY LONG POSITION SIGNAL</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Entry Price</TableCell>
                  <TableCell>${strategy.entryPrice.toFixed(4)}</TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Take Profit (+2%)</TableCell>
                  <TableCell>${strategy.takeProfit.toFixed(4)}</TableCell>
                  <TableCell className="text-green-400">+${(strategy.takeProfit - strategy.entryPrice).toFixed(4)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Stop Loss (-1%)</TableCell>
                  <TableCell>${strategy.stopLoss.toFixed(4)}</TableCell>
                  <TableCell className="text-red-400">-${(strategy.entryPrice - strategy.stopLoss).toFixed(4)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntradayStrategy;
