
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { signalDebouncer } from '../utils/signalDebouncer';
import { googleSheetsService } from '../services/googleSheetsService';
import { signalPersistence } from '../utils/signalPersistence';
import { useToast } from '@/components/ui/use-toast';

const SignalDiagnostics = () => {
  const [debouncerStats, setDebouncerStats] = useState({ blockedCount: 0, approvedCount: 0, pendingSignals: 0 });
  const [sheetsStats, setSheetsStats] = useState({ successCount: 0, errorCount: 0, lastError: null });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setDebouncerStats(signalDebouncer.getStats());
      setSheetsStats(googleSheetsService.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefreshStats = () => {
    setIsRefreshing(true);
    setDebouncerStats(signalDebouncer.getStats());
    setSheetsStats(googleSheetsService.getStats());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleResetStats = () => {
    signalDebouncer.resetStats();
    setDebouncerStats({ blockedCount: 0, approvedCount: 0, pendingSignals: 0 });
    toast({
      title: 'Stats Reset',
      description: 'Signal statistics have been reset',
    });
  };

  const handleTestSignal = async () => {
    try {
      const testSignal = {
        id: 'diagnostic_test_' + Date.now(),
        symbol: 'BTCUSDT',
        strategy: 'diagnostic' as const,
        signal: 'TEST' as const,
        timestamp: Date.now(),
        entryPrice: 50000,
        takeProfit: 51000,
        stopLoss: 49000,
        indicators: {
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
          currentPrice: 50000,
          volume: 1000000,
          avgVolume: 800000,
          volumeSpike: true,
          cvd: 500000,
          cvdTrend: 'bullish',
          cvdSlope: 10
        },
        conditions: {
          test: true
        },
        active: true
      };

      await signalPersistence.saveSignal(testSignal);
      
      toast({
        title: 'Test Signal Generated',
        description: 'A diagnostic test signal has been created and should appear in Google Sheets if configured',
      });
    } catch (error) {
      toast({
        title: 'Test Signal Failed',
        description: `Failed to generate test signal: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Signal Diagnostics
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshStats}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signal Debouncer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
            <div className="text-sm text-muted-foreground">Approved Signals</div>
            <div className="text-2xl font-bold text-green-400">{debouncerStats.approvedCount}</div>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
            <div className="text-sm text-muted-foreground">Blocked Signals</div>
            <div className="text-2xl font-bold text-red-400">{debouncerStats.blockedCount}</div>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <div className="text-sm text-muted-foreground">Pending Signals</div>
            <div className="text-2xl font-bold text-blue-400">{debouncerStats.pendingSignals}</div>
          </div>
        </div>

        {/* Google Sheets Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
            <div className="text-sm text-muted-foreground">Sheets Success</div>
            <div className="text-2xl font-bold text-green-400">{sheetsStats.successCount}</div>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
            <div className="text-sm text-muted-foreground">Sheets Errors</div>
            <div className="text-2xl font-bold text-red-400">{sheetsStats.errorCount}</div>
          </div>
        </div>

        {/* Last Error */}
        {sheetsStats.lastError && (
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
            <div className="text-sm text-muted-foreground mb-2">Last Google Sheets Error:</div>
            <div className="text-sm text-red-400 font-mono">{sheetsStats.lastError}</div>
          </div>
        )}

        {/* Google Sheets Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Google Sheets Status:</span>
          <Badge variant={googleSheetsService.isConfigured() ? "default" : "destructive"}>
            {googleSheetsService.isConfigured() ? 'Configured' : 'Not Configured'}
          </Badge>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleResetStats}
            size="sm"
          >
            Reset Stats
          </Button>
          <Button 
            variant="outline" 
            onClick={handleTestSignal}
            size="sm"
          >
            Generate Test Signal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignalDiagnostics;
