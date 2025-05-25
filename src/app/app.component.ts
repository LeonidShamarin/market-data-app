import { Component, OnInit, OnDestroy } from '@angular/core';
import { MarketDataService } from './services/market-data.service';
import { Subscription } from 'rxjs';

export interface MarketTick {
  symbol: string;
  price: number;
  timestamp: number;
  change?: number;
  changePercent?: number;
}

export interface HistoricalBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Market Data App';
  currentTick: MarketTick | null = null;
  historicalData: HistoricalBar[] = [];
  isConnected = false;
  selectedSymbol = 'EUR/USD';
  availableSymbols = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'];
  private subscriptions: Subscription[] = [];

  constructor(private marketDataService: MarketDataService) {}

  ngOnInit() {
    this.initializeConnection();
    this.subscribeToMarketData();
    this.loadHistoricalData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.marketDataService.disconnect();
  }

  private async initializeConnection() {
    try {
      await this.marketDataService.authenticate();
      this.marketDataService.connect();
      this.isConnected = true;
    } catch (error) {
      console.error('Failed to initialize connection:', error);
    }
  }

  private subscribeToMarketData() {
    const tickSub = this.marketDataService.getMarketTicks().subscribe(
      tick => {
        if (tick.symbol === this.selectedSymbol) {
          this.currentTick = tick;
        }
      },
      error => console.error('Market data error:', error)
    );
    this.subscriptions.push(tickSub);

    const connectionSub = this.marketDataService.getConnectionStatus().subscribe(
      status => this.isConnected = status
    );
    this.subscriptions.push(connectionSub);
  }

  private async loadHistoricalData() {
    try {
      this.historicalData = await this.marketDataService.getHistoricalData(
        this.selectedSymbol,
        '1',
        'minute',
        100
      );
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  }

  onSymbolChange() {
    this.loadHistoricalData();
    this.marketDataService.subscribeToSymbol(this.selectedSymbol);
  }

  reconnect() {
    this.initializeConnection();
  }
}

