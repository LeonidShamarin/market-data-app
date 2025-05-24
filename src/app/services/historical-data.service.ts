import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class HistoricalDataService {
  constructor(private http: HttpClient) {}

  getHistoricalData(symbol: string, resolution: string = 'D', from?: number, to?: number): Observable<any> {
    const now = Math.floor(Date.now() / 1000);
    const oneYearAgo = now - 365 * 24 * 60 * 60;

    return this.http
      .get(`https://finnhub.io/api/v1/stock/candle`, {
        params: {
          symbol,
          resolution,
          from: from || oneYearAgo,
          to: to || now,
          token: environment.finnhubApiKey,
        },
      })
      .pipe(
        map((response: any) => {
          return this.transformData(response);
        })
      );
  }

  private transformData(data: any): any {
    if (!data || data.s !== 'ok') return [];

    return data.t.map((timestamp: number, index: number) => ({
      name: new Date(timestamp * 1000),
      value: [
        new Date(timestamp * 1000),
        data.o[index], // open
        data.c[index], // close
        data.l[index], // low
        data.h[index], // high
      ],
    }));
  }
}