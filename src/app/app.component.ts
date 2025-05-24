import { Component } from '@angular/core'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  assets = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'BTC-USD', name: 'Bitcoin' },
  ];
  selectedAsset = this.assets[0];
}