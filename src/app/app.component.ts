import { Component } from '@angular/core';
import { Asset } from './models/asset.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  assets: Asset[] = [
    {
      id: 'AAPL',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'Stock',
      lastUpdated: new Date()
    },
    {
      id: 'MSFT',
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      type: 'Stock',
      lastUpdated: new Date()
    },
    {
      id: 'TSLA',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      type: 'Stock',
      lastUpdated: new Date()
    },
    {
      id: 'BTC-USD',
      symbol: 'BTC-USD',
      name: 'Bitcoin',
      type: 'Crypto',
      lastUpdated: new Date()
    }
  ];
  selectedAsset: Asset = this.assets[0];

  selectAsset(asset: Asset): void {
    this.selectedAsset = asset;
  }
}