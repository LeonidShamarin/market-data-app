import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HistoricalDataService {
  private readonly API_URL = 'https://finnhub.io/api/v1';

  constructor(private http: HttpClient) {}

  getHistoricalData(symbol: string, resolution: string, days: number): Observable<any[]> {
    const to = Math.floor(Date.now() / 1000);
    const from = to - days * 24 * 60 * 60;

   
    const params = new HttpParams()
      .set('symbol', symbol)
      .set('resolution', resolution)
      .set('from', from.toString())
      .set('to', to.toString())
      .set('token', environment.finnhubApiKey);

    return this.http.get(`${this.API_URL}/stock/candle`, { params }).pipe(
      map(response => this.transformData(response)),
      catchError(error => {
        console.error('API Error:', error);
        return of([]);
      })
    );
  }

  private transformData(data: any): any[] {
   
    if (!data || data.s !== 'ok' || !data.t || data.t.length === 0) {
      return [];
    }

    return data.t.map((timestamp: number, index: number) => ({
      name: new Date(timestamp * 1000),
      value: [
        new Date(timestamp * 1000),
        data.o[index], // open
        data.c[index], // close
        data.l[index], // low
        data.h[index]  // high
      ]
    }));
  }
}