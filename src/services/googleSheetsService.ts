
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
      throw new Error('Google Sheets not configured');
    }

    const accessToken = await this.getAccessToken();
    
    const values = [[
      signal.id,
      signal.symbol,
      signal.strategy,
      signal.signal,
      new Date(signal.timestamp).toISOString(),
      signal.entryPrice,
      signal.takeProfit,
      signal.stopLoss,
      signal.indicators.rsi,
      signal.indicators.macd.line,
      signal.indicators.macd.signal,
      signal.indicators.ma5,
      signal.indicators.ma20,
      signal.indicators.ma50,
      signal.indicators.bollingerUpper,
      signal.indicators.bollingerLower,
      signal.indicators.currentPrice,
      signal.indicators.volume,
      signal.indicators.volumeSpike,
      signal.indicators.cvd,
      signal.indicators.cvdTrend,
      signal.active,
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
      throw new Error(`Failed to append to sheet: ${error}`);
    }

    console.log('📊 Signal appended to Google Sheets');
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
