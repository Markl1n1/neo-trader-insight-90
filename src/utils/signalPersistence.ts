import { googleSheetsService } from '../services/googleSheetsService';

export interface TradingSignal {
  id: string;
  symbol: string;
  strategy: 'scalping' | 'intraday' | 'pump';
  signal: 'LONG' | 'SHORT' | 'WAIT';
  timestamp: number;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  indicators: {
    rsi: number;
    macd: { macd: number; signal: number; line: number };
    ma5: number;
    ma20: number;
    ma50: number;
    bollingerUpper: number;
    bollingerLower: number;
    currentPrice: number;
    volume: number;
    volumeSpike: boolean;
    cvd: number;
    cvdTrend: string;
  };
  conditions: Record<string, boolean>;
  active: boolean;
  executed?: boolean;
  executedAt?: number;
  pnl?: number;
}

export interface SignalHistory {
  signals: TradingSignal[];
  lastUpdate: number;
}

class SignalPersistenceManager {
  private readonly storageKey = 'trading_signals';
  private readonly maxSignals = 1000;

  async saveSignal(signal: TradingSignal): Promise<void> {
    const history = this.getSignalHistory();
    
    // Remove existing signal for same symbol/strategy if exists
    history.signals = history.signals.filter(
      s => !(s.symbol === signal.symbol && s.strategy === signal.strategy && s.active)
    );
    
    // Add new signal
    history.signals.unshift(signal);
    
    // Keep only the most recent signals
    if (history.signals.length > this.maxSignals) {
      history.signals = history.signals.slice(0, this.maxSignals);
    }
    
    history.lastUpdate = Date.now();
    
    localStorage.setItem(this.storageKey, JSON.stringify(history));
    
    console.log(`💾 Saved ${signal.signal} signal for ${signal.symbol} (${signal.strategy})`);

    // Send to Google Sheets if configured
    if (googleSheetsService.isConfigured()) {
      try {
        await googleSheetsService.appendSignalToSheet(signal);
        console.log('📊 Signal sent to Google Sheets');
      } catch (error) {
        console.error('Failed to send signal to Google Sheets:', error);
      }
    }
  }

  getSignalHistory(): SignalHistory {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading signal history:', error);
    }
    
    return { signals: [], lastUpdate: Date.now() };
  }

  getActiveSignals(): TradingSignal[] {
    const history = this.getSignalHistory();
    return history.signals.filter(signal => signal.active && !signal.executed);
  }

  getSignalsBySymbol(symbol: string): TradingSignal[] {
    const history = this.getSignalHistory();
    return history.signals.filter(signal => signal.symbol === symbol);
  }

  getSignalsByStrategy(strategy: string): TradingSignal[] {
    const history = this.getSignalHistory();
    return history.signals.filter(signal => signal.strategy === strategy);
  }

  deactivateSignal(signalId: string): void {
    const history = this.getSignalHistory();
    const signal = history.signals.find(s => s.id === signalId);
    
    if (signal) {
      signal.active = false;
      history.lastUpdate = Date.now();
      localStorage.setItem(this.storageKey, JSON.stringify(history));
      console.log(`🔕 Deactivated signal ${signalId}`);
    }
  }

  markSignalExecuted(signalId: string, executionPrice: number): void {
    const history = this.getSignalHistory();
    const signal = history.signals.find(s => s.id === signalId);
    
    if (signal) {
      signal.executed = true;
      signal.executedAt = Date.now();
      signal.active = false;
      
      // Calculate P&L based on signal type
      if (signal.signal === 'LONG') {
        signal.pnl = executionPrice - signal.entryPrice;
      } else if (signal.signal === 'SHORT') {
        signal.pnl = signal.entryPrice - executionPrice;
      }
      
      history.lastUpdate = Date.now();
      localStorage.setItem(this.storageKey, JSON.stringify(history));
      console.log(`✅ Marked signal ${signalId} as executed at ${executionPrice}`);
    }
  }

  generateSignalId(symbol: string, strategy: string, timestamp: number): string {
    return `${symbol}_${strategy}_${timestamp}`;
  }

  clearHistory(): void {
    localStorage.removeItem(this.storageKey);
    console.log('🗑️ Cleared signal history');
  }

  exportHistory(): string {
    const history = this.getSignalHistory();
    return JSON.stringify(history, null, 2);
  }
}

export const signalPersistence = new SignalPersistenceManager();
