
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { signalPersistence } from '../utils/signalPersistence';
import type { IndicatorValues } from '../utils/indicators';

interface ScalpingStrategyProps {
  symbol: string;
  currentPrice: number;
  indicators: IndicatorValues;
}

const ScalpingStrategy = ({ symbol, currentPrice, indicators }: ScalpingStrategyProps) => {
  // Enhanced scalping strategy conditions
  const checkScalpingConditions = () => {
    const entryPrice = currentPrice;
    const takeProfit = entryPrice * 1.005; // +0.5% for scalping
    const stopLoss = entryPrice * 0.9975; // -0.25% stop loss
    
    // Step 1: Check RSI (oversold for LONG entry)
    const rsiCondition = indicators.rsi < 30;
    
    // Step 2: Check Moving Averages (5 EMA > 20 EMA for trend)
    const maCondition = indicators.ma5 > indicators.ma20;
    
    // Step 3: Check Bollinger Bands (Price near lower band)
    const bollingerCondition = currentPrice <= indicators.bollingerLower * 1.002; // Within 0.2% of lower band
    
    // Step 4: Check MACD (MACD Line > Signal Line for momentum)
    const macdCondition = indicators.macd.line > indicators.macd.signal;
    
    // Step 5: Check Volume Spike (enhanced detection)
    const volumeCondition = indicators.volumeSpike;
    
    // Step 6: Check CVD (positive trend for buying pressure)
    const cvdCondition = indicators.cvdTrend === 'bullish';
    
    const conditions = {
      rsi: rsiCondition,
      movingAverages: maCondition,
      bollingerBands: bollingerCondition,
      macd: macdCondition,
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

  const strategy = checkScalpingConditions();

  // Save signal if conditions are met
  if (strategy.allConditionsMet) {
    const signalId = signalPersistence.generateSignalId(symbol, 'scalping', Date.now());
    const signal = {
      id: signalId,
      symbol,
      strategy: 'scalping' as const,
      signal: strategy.signal as 'LONG',
      timestamp: Date.now(),
      entryPrice: strategy.entryPrice,
      takeProfit: strategy.takeProfit,
      stopLoss: strategy.stopLoss,
      indicators: {
        rsi: indicators.rsi,
        macd: indicators.macd,
        ma5: indicators.ma5,
        ma20: indicators.ma20,
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
        <h3 className="text-lg font-semibold text-primary mb-4">Scalping Strategy - {symbol}</h3>
        
        <div className="grid grid-cols-1 gap-3 mb-4">
          {/* RSI Check */}
          <div className={`p-3 rounded-lg ${strategy.conditions.rsi ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">RSI &lt; 30 (Oversold)</span>
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
              <span className="font-medium">5 EMA &gt; 20 EMA</span>
              <span className="font-mono">{indicators.ma5.toFixed(4)} / {indicators.ma20.toFixed(4)}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                strategy.conditions.movingAverages ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'
              }`}>
                {strategy.conditions.movingAverages ? '✓' : '✗'}
              </span>
            </div>
          </div>

          {/* Bollinger Bands Check */}
          <div className={`p-3 rounded-lg ${strategy.conditions.bollingerBands ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">Near Lower Band</span>
              <span className="font-mono">{currentPrice.toFixed(4)} ≤ {indicators.bollingerLower.toFixed(4)}</span>
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
              <span className="font-medium">MACD Momentum</span>
              <span className="font-mono">{indicators.macd.line.toFixed(6)} / {indicators.macd.signal.toFixed(6)}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                strategy.conditions.macd ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'
              }`}>
                {strategy.conditions.macd ? '✓' : '✗'}
              </span>
            </div>
          </div>

          {/* Volume Spike Check */}
          <div className={`p-3 rounded-lg ${strategy.conditions.volume ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">Volume Spike</span>
              <span className="font-mono">{indicators.volume.toLocaleString()} (Spike: {indicators.volumeSpike ? 'YES' : 'NO'})</span>
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
              <span className="font-medium">CVD Bullish Trend</span>
              <span className="font-mono">{indicators.cvd.toLocaleString()} ({indicators.cvdTrend})</span>
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
            <h4 className="text-lg font-semibold text-green-400 mb-3">🚀 SCALPING LONG POSITION SIGNAL</h4>
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
                  <TableCell>Take Profit (+0.5%)</TableCell>
                  <TableCell>${strategy.takeProfit.toFixed(4)}</TableCell>
                  <TableCell className="text-green-400">+${(strategy.takeProfit - strategy.entryPrice).toFixed(4)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Stop Loss (-0.25%)</TableCell>
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

export default ScalpingStrategy;
