import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class HistoricalDataService {
  private readonly ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';
  private readonly YAHOO_FINANCE_URL =
    'https://query1.finance.yahoo.com/v8/finance/chart';

  constructor(private http: HttpClient) {}

  getHistoricalData(
    symbol: string,
    resolution: string,
    days: number
  ): Observable<any[]> {
    console.log('Fetching data for:', { symbol, resolution, days });

    return this.getYahooFinanceData(symbol, days).pipe(
      catchError((error) => {
        console.log('Yahoo Finance failed:', error, 'trying Alpha Vantage...');
        return this.getAlphaVantageData(symbol);
      }),
      catchError((error) => {
        console.log('All APIs failed:', error, 'using mock data...');
        return of(this.getMockData(symbol, days));
      })
    );
  }

  // Yahoo Finance API (безкоштовний, без ключа)
  private getYahooFinanceData(symbol: string, days: number): Observable<any[]> {
    const to = Math.floor(Date.now() / 1000);
    const from = to - days * 24 * 60 * 60;

    console.log('Yahoo Finance request:', {
      symbol,
      from: new Date(from * 1000).toISOString(),
      to: new Date(to * 1000).toISOString(),
      days,
    });

    const url = `${this.YAHOO_FINANCE_URL}/${symbol}`;
    const params = new HttpParams()
      .set('period1', from.toString())
      .set('period2', to.toString())
      .set('interval', '1d')
      .set('includePrePost', 'true')
      .set('events', 'div%2Csplit');

    return this.http.get(url, { params }).pipe(
      tap((response) => console.log('Yahoo Finance response:', response)),
      map((response) => this.transformYahooData(response)),
      catchError((error) => {
        console.error('Yahoo Finance API Error:', error);
        throw error;
      })
    );
  }

  // Alpha Vantage API (потрібен безкоштовний ключ)
  private getAlphaVantageData(symbol: string): Observable<any[]> {
    const params = new HttpParams()
      .set('function', 'TIME_SERIES_DAILY')
      .set('symbol', symbol)
      .set('apikey', 'demo') // Використовуємо demo ключ
      .set('outputsize', 'compact');

    return this.http.get(this.ALPHA_VANTAGE_URL, { params }).pipe(
      tap((response) => console.log('Alpha Vantage response:', response)),
      map((response) => this.transformAlphaVantageData(response)),
      catchError((error) => {
        console.error('Alpha Vantage API Error:', error);
        throw error;
      })
    );
  }

  private transformYahooData(data: any): any[] {
    try {
      console.log('Transforming Yahoo data structure:', data);

      const result = data?.chart?.result?.[0];
      if (!result) {
        throw new Error('No chart result in Yahoo Finance response');
      }

      const timestamps = result.timestamp;
      const quote = result.indicators?.quote?.[0];

      if (!timestamps || !quote) {
        console.warn('Missing timestamps or quote data:', {
          timestamps,
          quote,
        });
        throw new Error('Missing timestamp or quote data');
      }

      console.log(
        'Yahoo data - timestamps:',
        timestamps?.length,
        'quotes:',
        Object.keys(quote || {})
      );

      return timestamps
        .map((timestamp: number, index: number) => ({
          name: new Date(timestamp * 1000),
          value: [
            new Date(timestamp * 1000),
            quote.open?.[index] || 0,
            quote.close?.[index] || 0,
            quote.low?.[index] || 0,
            quote.high?.[index] || 0,
          ],
        }))
        .filter((item: any) =>
          item.value
            .slice(1)
            .some((val: any) => val !== null && val !== undefined && val !== 0)
        );
    } catch (error) {
      console.error('Error transforming Yahoo data:', error);
      throw error;
    }
  }

  private transformAlphaVantageData(data: any): any[] {
    if (!data || !data['Time Series (Daily)']) {
      throw new Error('Invalid Alpha Vantage data structure');
    }

    const timeSeries = data['Time Series (Daily)'];
    return Object.keys(timeSeries)
      .slice(0, 30)
      .map((date) => ({
        name: new Date(date),
        value: [
          new Date(date),
          parseFloat(timeSeries[date]['1. open']),
          parseFloat(timeSeries[date]['4. close']),
          parseFloat(timeSeries[date]['3. low']),
          parseFloat(timeSeries[date]['2. high']),
        ],
      }));
  }

  // Реалістичні mock дані для розробки
  private getMockData(symbol: string, days: number): any[] {
    console.log(`Generating mock data for ${symbol} (${days} days)`);

    const data = [];
    let basePrice = 150; // Початкова ціна

    // Симулюємо реалістичні ціни з трендом
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Додаємо волатильність та тренд
      const trend = (Math.random() - 0.5) * 2; // -1 до 1
      const volatility = Math.random() * 5; // 0 до 5

      const open = basePrice + (Math.random() - 0.5) * volatility;
      const close = open + trend + (Math.random() - 0.5) * 2;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;

      data.push({
        name: date,
        value: [
          date,
          Math.round(open * 100) / 100,
          Math.round(close * 100) / 100,
          Math.round(low * 100) / 100,
          Math.round(high * 100) / 100,
        ],
      });

      basePrice = close; // Оновлюємо базову ціну для наступного дня
    }

    return data;
  }

  // Метод для отримання поточної ціни (спрощений)
  getCurrentPrice(symbol: string): Observable<number> {
    // Для demo повертаємо випадкову ціну
    const price = 150 + (Math.random() - 0.5) * 20;
    return of(Math.round(price * 100) / 100);
  }

  // Список популярних символів для тестування
  getPopularSymbols(): string[] {
    return ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
  }
}
