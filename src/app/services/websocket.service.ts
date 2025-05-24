import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket$!: WebSocketSubject<any>;

  connect(symbol: string) {
    this.socket$ = webSocket(`wss://ws.finnhub.io?token=${environment.finnhubApiKey}`);

    // Підписка на дані акції
    this.socket$.next({ type: 'subscribe', symbol });

    return this.socket$.asObservable();
  }

  disconnect(symbol: string) {
    if (this.socket$) {
      this.socket$.next({ type: 'unsubscribe', symbol });
      this.socket$.complete();
    }
  }
}