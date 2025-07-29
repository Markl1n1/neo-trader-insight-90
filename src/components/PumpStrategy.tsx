
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { signalPersistence } from '../utils/signalPersistence';
import type { IndicatorValues } from '../utils/indicators';

interface PumpStrategyProps {
  symbol: string;
  currentPrice: number;
  indicators: IndicatorValues;
}

const PumpStrategy = ({ symbol, currentPrice, indicators }: PumpStrategyProps) => {
  // Pump mode strategy conditions based on the provided strategy
  const checkPumpConditions = () => {
    const entryPrice = currentPrice;
    const takeProfit = entryPrice * 1.03; // +3% for pump mode
    const stopLoss = entryPrice * 0.99; // -1% stop loss
    
    // Step 1: Volume Spike Detection (critical for pump detection)
    const volumeSpikeCondition = indicators.volumeSpike && indicators.volume > indicators.avgVolume * 3;
    
    // Step 2: RSI momentum (looking for RSI > 50 for pump momentum)
    const rsiCondition = indicators.rsi > 50 && indicators.rsi < 80; // Not overbought yet
    
    // Step 3: Price above key EMAs (bullish structure)
    const maCondition = currentPrice > indicators.ma20 && indicators.ma5 > indicators.ma20;
    
    // Step 4: MACD showing momentum
    const macdCondition = indicators.macd.line > indicators.macd.signal && indicators.macd.line > 0;
    
    // Step 5: CVD showing buying pressure
    const cvdCondition = indicators.cvdTrend === 'bullish' && indicators.cvd > 0;
    
    // Step 6: Price breakout above Bollinger Middle
    const bollingerCondition = currentPrice > indicators.bollingerMiddle;
    
    // All conditions for pump LONG entry
    const conditions = {
      volumeSpike: volumeSpikeCondition,
      rsi: rsiCondition,
      movingAverages: maCondition,
      macd: macdCondition,
      cvd: cvdCondition,
      bollinger: bollingerCondition
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

  const strategy = checkPumpConditions();

  // Save signal if conditions are met
  if (strategy.allConditionsMet) {
    const signalId = signalPersistence.generateSignalId(symbol, 'pump', Date.now());
    const signal = {
      id: signalId,
      symbol,
      strategy: 'pump' as const,
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
        <h3 className="text-lg font-semibold text-primary mb-4">Pump Mode Strategy - {symbol}</h3>
        
        <div className="grid grid-cols-1 gap-3 mb-4">
          {/* Volume Spike Check */}
          <div className={`p-3 rounded-lg ${strategy.conditions.volumeSpike ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">Volume Spike (3x avg)</span>
              <span className="font-mono">{indicators.volume.toLocaleString()} / {indicators.avgVolume.toLocaleString()}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                strategy.conditions.volumeSpike ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'
              }`}>
                {strategy.conditions.volumeSpike ? '✓' : '✗'}
              </span>
            </div>
          </div>

          {/* RSI Momentum Check */}
          <div className={`p-3 rounded-lg ${strategy.conditions.rsi ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">RSI Momentum (50-80)</span>
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
              <span className="font-medium">Bullish MA Structure</span>
              <span className="font-mono">{indicators.ma5.toFixed(4)} &gt; {indicators.ma20.toFixed(4)}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                strategy.conditions.movingAverages ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'
              }`}>
                {strategy.conditions.movingAverages ? '✓' : '✗'}
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

          {/* Bollinger Check */}
          <div className={`p-3 rounded-lg ${strategy.conditions.bollinger ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">Above BB Middle</span>
              <span className="font-mono">{currentPrice.toFixed(4)} &gt; {indicators.bollingerMiddle.toFixed(4)}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                strategy.conditions.bollinger ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'
              }`}>
                {strategy.conditions.bollinger ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>

        {/* Entry Table */}
        {strategy.allConditionsMet && (
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
            <h4 className="text-lg font-semibold text-green-400 mb-3">🚀 PUMP LONG POSITION SIGNAL</h4>
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
                  <TableCell>Take Profit (+3%)</TableCell>
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

export default PumpStrategy;
