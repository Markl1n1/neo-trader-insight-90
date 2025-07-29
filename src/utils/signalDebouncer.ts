
interface PendingSignal {
  id: string;
  symbol: string;
  strategy: string;
  timestamp: number;
  timeoutId: NodeJS.Timeout;
}

class SignalDebouncer {
  private pendingSignals: Map<string, PendingSignal> = new Map();
  private readonly debounceTime = 5000; // 5 seconds
  private readonly duplicateWindow = 30000; // 30 seconds

  private getSignalKey(symbol: string, strategy: string, signal: string): string {
    return `${symbol}_${strategy}_${signal}`;
  }

  shouldProcessSignal(symbol: string, strategy: string, signal: string, timestamp: number): boolean {
    const key = this.getSignalKey(symbol, strategy, signal);
    const pending = this.pendingSignals.get(key);

    // Check if there's a pending signal that's too recent
    if (pending && timestamp - pending.timestamp < this.duplicateWindow) {
      console.log(`🚫 Duplicate signal blocked for ${symbol} ${strategy} ${signal}`);
      return false;
    }

    // Clear any existing timeout for this key
    if (pending) {
      clearTimeout(pending.timeoutId);
    }

    // Set up debounce timeout
    const timeoutId = setTimeout(() => {
      this.pendingSignals.delete(key);
    }, this.debounceTime);

    this.pendingSignals.set(key, {
      id: key,
      symbol,
      strategy,
      timestamp,
      timeoutId
    });

    console.log(`✅ Signal approved for ${symbol} ${strategy} ${signal}`);
    return true;
  }

  cleanup(): void {
    this.pendingSignals.forEach(signal => {
      clearTimeout(signal.timeoutId);
    });
    this.pendingSignals.clear();
  }
}

export const signalDebouncer = new SignalDebouncer();
