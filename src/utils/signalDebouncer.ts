
interface PendingSignal {
  id: string;
  symbol: string;
  strategy: string;
  timestamp: number;
  timeoutId: NodeJS.Timeout;
}

class SignalDebouncer {
  private pendingSignals: Map<string, PendingSignal> = new Map();
  private readonly debounceTime = 2000; // Reduced to 2 seconds
  private readonly duplicateWindow = 10000; // Reduced to 10 seconds
  private blockedCount = 0;
  private approvedCount = 0;

  private getSignalKey(symbol: string, strategy: string, signal: string): string {
    return `${symbol}_${strategy}_${signal}`;
  }

  shouldProcessSignal(symbol: string, strategy: string, signal: string, timestamp: number): boolean {
    const key = this.getSignalKey(symbol, strategy, signal);
    const pending = this.pendingSignals.get(key);

    // Check if there's a pending signal that's too recent
    if (pending && timestamp - pending.timestamp < this.duplicateWindow) {
      this.blockedCount++;
      console.log(`🚫 Duplicate signal blocked for ${symbol} ${strategy} ${signal} (${timestamp - pending.timestamp}ms ago)`);
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

    this.approvedCount++;
    console.log(`✅ Signal approved for ${symbol} ${strategy} ${signal}`);
    return true;
  }

  getStats(): { blockedCount: number; approvedCount: number; pendingSignals: number } {
    return {
      blockedCount: this.blockedCount,
      approvedCount: this.approvedCount,
      pendingSignals: this.pendingSignals.size
    };
  }

  resetStats(): void {
    this.blockedCount = 0;
    this.approvedCount = 0;
  }

  cleanup(): void {
    this.pendingSignals.forEach(signal => {
      clearTimeout(signal.timeoutId);
    });
    this.pendingSignals.clear();
  }
}

export const signalDebouncer = new SignalDebouncer();
