export interface GoogleSheetsConfig {
  spreadsheetId: string;
  serviceAccountKey: string;
  sheetName: string;
}

export interface GoogleSheetsCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

class GoogleSheetsService {
  private config: GoogleSheetsConfig | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private lastError: string | null = null;
  private successCount: number = 0;
  private errorCount: number = 0;

  setConfig(config: GoogleSheetsConfig): void {
    this.config = config;
    localStorage.setItem('googleSheetsConfig', JSON.stringify(config));
    console.log('📊 Google Sheets configuration saved');
  }

  getConfig(): GoogleSheetsConfig | null {
    if (this.config) return this.config;
    
    const stored = localStorage.getItem('googleSheetsConfig');
    if (stored) {
      this.config = JSON.parse(stored);
      return this.config;
    }
    
    return null;
  }

  getStats(): { successCount: number; errorCount: number; lastError: string | null } {
    return {
      successCount: this.successCount,
      errorCount: this.errorCount,
      lastError: this.lastError
    };
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const config = this.getConfig();
    if (!config) {
      throw new Error('Google Sheets not configured');
    }

    const credentials: GoogleSheetsCredentials = JSON.parse(config.serviceAccountKey);
    
    // Create JWT token
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const jwt = await this.createJWT(header, payload, credentials.private_key);
    
    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
    
    return this.accessToken;
  }

  private async createJWT(header: any, payload: any, privateKey: string): Promise<string> {
    const encoder = new TextEncoder();
    
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const message = `${headerB64}.${payloadB64}`;
    
    // Import the private key
    const keyData = privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s/g, '');
    
    const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyBuffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    // Sign the message
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      encoder.encode(message)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${message}.${signatureB64}`;
  }

  async appendSignalToSheet(signal: any): Promise<void> {
    const config = this.getConfig();
    if (!config) {
      const error = 'Google Sheets not configured';
      this.lastError = error;
      throw new Error(error);
    }

    try {
      const accessToken = await this.getAccessToken();
      
      // Updated to handle new EMA periods and ensure all fields are properly mapped
      const values = [[
        signal.id,
        signal.symbol,
        signal.strategy,
        signal.signal,
        new Date(signal.timestamp).toISOString(),
        signal.entryPrice,
        signal.takeProfit,
        signal.stopLoss,
        signal.indicators.rsi || 0,
        signal.indicators.macd?.line || 0,
        signal.indicators.macd?.signal || 0,
        signal.indicators.ma5 || 0,
        signal.indicators.ma8 || 0,
        signal.indicators.ma13 || 0,
        signal.indicators.ma20 || 0,
        signal.indicators.ma21 || 0,
        signal.indicators.ma34 || 0,
        signal.indicators.ma50 || 0,
        signal.indicators.bollingerUpper || 0,
        signal.indicators.bollingerLower || 0,
        signal.indicators.bollingerMiddle || 0,
        signal.indicators.currentPrice || 0,
        signal.indicators.volume || 0,
        signal.indicators.avgVolume || 0,
        signal.indicators.volumeSpike || false,
        signal.indicators.cvd || 0,
        signal.indicators.cvdTrend || 'neutral',
        signal.indicators.cvdSlope || 0,
        signal.active || false,
        signal.executed || false,
        signal.executedAt ? new Date(signal.executedAt).toISOString() : '',
        signal.pnl || ''
      ]];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.sheetName}:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        this.lastError = `Failed to append to sheet: ${error}`;
        this.errorCount++;
        throw new Error(this.lastError);
      }

      this.successCount++;
      this.lastError = null;
      console.log('📊 Signal successfully appended to Google Sheets:', {
        symbol: signal.symbol,
        strategy: signal.strategy,
        signal: signal.signal,
        timestamp: new Date(signal.timestamp).toISOString()
      });
    } catch (error) {
      this.errorCount++;
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to append signal to Google Sheets:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return this.getConfig() !== null;
  }

  clearConfig(): void {
    this.config = null;
    this.accessToken = null;
    this.tokenExpiry = 0;
    localStorage.removeItem('googleSheetsConfig');
    console.log('🗑️ Google Sheets configuration cleared');
  }
}

export const googleSheetsService = new GoogleSheetsService();
