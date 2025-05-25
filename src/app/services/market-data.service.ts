import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  throwError,
} from 'rxjs';
import { MarketTick, HistoricalBar } from '../app.component';

@Injectable({
  providedIn: 'root',
})
export class MarketDataService {
  private readonly apiUrl = '';
  private readonly wsUrl = 'wss://platform.fintacharts.com';
  private readonly credentials = {
    username: 'r_test@fintatech.com',
    password: 'kisfiz-vUnvy9-sopnyv',
  };

  private accessToken = '';
  private refreshToken = '';
  private websocket: WebSocket | null = null;
  private marketTicksSubject = new Subject<MarketTick>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private instrumentsMap = new Map<string, string>();
  private lastPrices = new Map<string, number>();
  private simulationInterval: any = null;
  private isSimulationMode = false;

  constructor(private http: HttpClient) {
    this.startSimulation();
  }

  async authenticate(): Promise<void> {
    const tokenUrl = `/identity/realms/fintatech/protocol/openid-connect/token`;

    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', 'app-cli');
    body.set('username', this.credentials.username);
    body.set('password', this.credentials.password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    try {
      const response: any = await this.http
        .post(tokenUrl, body.toString(), { headers })
        .pipe(catchError(this.handleError.bind(this)))
        .toPromise();

      this.accessToken = response.access_token;
      this.refreshToken = response.refresh_token;
      console.log('Authentication successful');
      this.isSimulationMode = false;
      await this.loadInstruments();
    } catch (error) {
      console.warn('Authentication failed, using simulation mode:', error);
      this.isSimulationMode = true;
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error: ${error.status} - ${error.message}`;

      if (error.status === 404) {
        console.warn(
          'API endpoint not found - likely running in development without proper backend'
        );
      } else if (error.status === 0) {
        console.warn(
          'Network error - check if server is running and CORS is configured'
        );
      }
    }

    console.error('HTTP Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private async loadInstruments(): Promise<void> {
    if (this.isSimulationMode) {
      this.setupMockInstruments();
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
    });

    try {
      const response: any = await this.http
        .get(`/api/instruments/v1/instruments?provider=oanda&kind=forex`, {
          headers,
        })
        .pipe(catchError(this.handleError.bind(this)))
        .toPromise();

      if (response?.data) {
        response.data.forEach((instrument: any) => {
          this.instrumentsMap.set(instrument.symbol, instrument.id);
        });
        console.log('Loaded instruments:', this.instrumentsMap);
      }
    } catch (error) {
      console.warn('Failed to load instruments, using mock data:', error);
      this.setupMockInstruments();
    }
  }

  private setupMockInstruments(): void {
    const mockInstruments = [
      { symbol: 'EUR/USD', id: 'eur_usd_mock' },
      { symbol: 'GBP/USD', id: 'gbp_usd_mock' },
      { symbol: 'USD/JPY', id: 'usd_jpy_mock' },
      { symbol: 'AUD/USD', id: 'aud_usd_mock' },
    ];

    mockInstruments.forEach((instrument) => {
      this.instrumentsMap.set(instrument.symbol, instrument.id);
    });

    console.log('Using mock instruments:', this.instrumentsMap);
  }

  connect(): void {
    if (this.websocket) {
      this.websocket.close();
    }

    if (this.isSimulationMode || !this.accessToken) {
      this.startSimulation();
    } else {
      this.connectWebSocket();
    }
  }

  private connectWebSocket(): void {
    try {
      this.websocket = new WebSocket(`${this.wsUrl}/ws`);

      this.websocket.onopen = () => {
        console.log('WebSocket connected');
        this.connectionStatusSubject.next(true);
        this.authenticate_ws();
      };

      this.websocket.onmessage = (event) => {
        this.handleWebSocketMessage(event.data);
      };

      this.websocket.onclose = () => {
        console.log('WebSocket disconnected');
        this.connectionStatusSubject.next(false);
        // Fallback to simulation if WebSocket fails
        setTimeout(() => this.startSimulation(), 1000);
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.startSimulation();
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.startSimulation();
    }
  }

  private startSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    this.connectionStatusSubject.next(true);
    console.log('Starting price simulation...');

    const symbols = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'];
    const basePrices = {
      'EUR/USD': 1.095,
      'GBP/USD': 1.265,
      'USD/JPY': 148.5,
      'AUD/USD': 0.675,
    };

    // Initialize last prices
    Object.entries(basePrices).forEach(([symbol, price]) => {
      this.lastPrices.set(symbol, price);
    });

    // Simulate price updates every 2 seconds
    this.simulationInterval = setInterval(() => {
      if (this.connectionStatusSubject.value) {
        symbols.forEach((symbol) => {
          const lastPrice =
            this.lastPrices.get(symbol) ||
            basePrices[symbol as keyof typeof basePrices];
          const change = (Math.random() - 0.5) * 0.01;
          const newPrice = Number((lastPrice + change).toFixed(4));

          this.lastPrices.set(symbol, newPrice);

          const tick: MarketTick = {
            symbol: symbol,
            price: newPrice,
            timestamp: Date.now(),
            change: Number(change.toFixed(4)),
            changePercent: Number(((change / lastPrice) * 100).toFixed(2)),
          };

          this.marketTicksSubject.next(tick);
        });
      }
    }, 2000);
  }

  private authenticate_ws(): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const authMessage = {
        type: 'auth',
        token: this.accessToken,
      };
      this.websocket.send(JSON.stringify(authMessage));
    }
  }

  private handleWebSocketMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      if (message.type === 'tick') {
        const tick: MarketTick = {
          symbol: message.symbol,
          price: message.price,
          timestamp: message.timestamp || Date.now(),
          change: message.change,
          changePercent: message.changePercent,
        };
        this.marketTicksSubject.next(tick);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  subscribeToSymbol(symbol: string): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const subscribeMessage = {
        type: 'subscribe',
        symbol: symbol,
      };
      this.websocket.send(JSON.stringify(subscribeMessage));
    }
    console.log('Subscribed to symbol:', symbol);
  }

  async getHistoricalData(
    symbol: string,
    interval: string,
    periodicity: string,
    barsCount: number
  ): Promise<HistoricalBar[]> {
    if (this.isSimulationMode) {
      return this.generateMockHistoricalData(symbol, barsCount);
    }

    const instrumentId = this.instrumentsMap.get(symbol);

    if (!instrumentId) {
      console.warn(
        `Instrument ID not found for symbol: ${symbol}, generating mock data`
      );
      return this.generateMockHistoricalData(symbol, barsCount);
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
    });

    const url =
      `/api/bars/v1/bars/count-back` +
      `?instrumentId=${instrumentId}&provider=oanda&interval=${interval}` +
      `&periodicity=${periodicity}&barsCount=${barsCount}`;

    try {
      const response: any = await this.http
        .get(url, { headers })
        .pipe(catchError(this.handleError.bind(this)))
        .toPromise();

      if (response?.data) {
        return response.data.map((bar: any) => ({
          time: new Date(bar.timestamp).getTime(),
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume || 0,
        }));
      } else {
        return this.generateMockHistoricalData(symbol, barsCount);
      }
    } catch (error) {
      console.warn('Failed to fetch historical data, using mock data:', error);
      return this.generateMockHistoricalData(symbol, barsCount);
    }
  }

  private generateMockHistoricalData(
    symbol: string,
    count: number
  ): HistoricalBar[] {
    const basePrices = {
      'EUR/USD': 1.095,
      'GBP/USD': 1.265,
      'USD/JPY': 148.5,
      'AUD/USD': 0.675,
    };

    const basePrice = basePrices[symbol as keyof typeof basePrices] || 1.0;
    const data: HistoricalBar[] = [];
    let currentPrice = basePrice;

    for (let i = count; i > 0; i--) {
      const time = Date.now() - i * 60000; // 1 minute intervals
      const change = (Math.random() - 0.5) * 0.01;

      const open = currentPrice;
      const close = Number((currentPrice + change).toFixed(4));
      const high = Number(
        (Math.max(open, close) + Math.random() * 0.005).toFixed(4)
      );
      const low = Number(
        (Math.min(open, close) - Math.random() * 0.005).toFixed(4)
      );

      data.push({
        time,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 1000) + 100,
      });

      currentPrice = close;
    }

    return data;
  }

  getMarketTicks(): Observable<MarketTick> {
    return this.marketTicksSubject.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  disconnect(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.connectionStatusSubject.next(false);
  }

  // Getter для перевірки режиму
  get isInSimulationMode(): boolean {
    return this.isSimulationMode;
  }
}
