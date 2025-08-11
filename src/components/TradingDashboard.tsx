import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TradingPair } from './TradingPair';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton"
import SignalDiagnostics from './SignalDiagnostics';

const TradingDashboard = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [activePairs, setActivePairs] = useState<string[]>([]);

  useEffect(() => {
    const pairsParam = searchParams.get('pairs');
    if (pairsParam) {
      try {
        const parsedPairs = JSON.parse(pairsParam);
        if (Array.isArray(parsedPairs) && parsedPairs.every(item => typeof item === 'string')) {
          setActivePairs(parsedPairs);
        } else {
          setError('Invalid format for "pairs" parameter. Expected an array of strings.');
        }
      } catch (e: any) {
        setError('Error parsing "pairs" parameter. Please ensure it is valid JSON.');
      }
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trading Dashboard</h1>
        <button className="btn btn-sm btn-primary">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
        </button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Signal Diagnostics Panel */}
      <SignalDiagnostics />

      <Tabs defaultValue="scalping" className="w-full">
        <TabsList>
          <TabsTrigger value="scalping">Scalping</TabsTrigger>
          <TabsTrigger value="intraday">Intraday</TabsTrigger>
          <TabsTrigger value="pump">Pump Mode</TabsTrigger>
        </TabsList>
        <TabsContent value="scalping" className="space-y-4">
          {activePairs.length > 0 ? (
            activePairs.map((pair) => (
              <TradingPair key={pair} symbol={pair} strategy="scalping" />
            ))
          ) : (
            <Alert>
              <AlertTitle>No Trading Pairs Configured</AlertTitle>
              <AlertDescription>
                Please configure trading pairs using the URL parameter <code>pairs</code>.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        <TabsContent value="intraday">
          {activePairs.length > 0 ? (
            activePairs.map((pair) => (
              <TradingPair key={pair} symbol={pair} strategy="intraday" />
            ))
          ) : (
            <Alert>
              <AlertTitle>No Trading Pairs Configured</AlertTitle>
              <AlertDescription>
                Please configure trading pairs using the URL parameter <code>pairs</code>.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        <TabsContent value="pump">
          {activePairs.length > 0 ? (
            activePairs.map((pair) => (
              <TradingPair key={pair} symbol={pair} strategy="pump" />
            ))
          ) : (
            <Alert>
              <AlertTitle>No Trading Pairs Configured</AlertTitle>
              <AlertDescription>
                Please configure trading pairs using the URL parameter <code>pairs</code>.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TradingDashboard;
