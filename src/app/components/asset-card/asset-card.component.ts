import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Asset } from '../../models/asset.model';

@Component({
  selector: 'app-asset-card',
  templateUrl: './asset-card.component.html',
  styleUrls: ['./asset-card.component.scss']
})
export class AssetCardComponent implements OnChanges {
  @Input() asset!: Asset;
  currentPrice!: number;
  priceChange!: number;
  isPositive!: boolean;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['asset']) {
      this.currentPrice = 100 + Math.random() * 50;
      this.priceChange = Math.random() * 10 - 5;
      this.isPositive = this.priceChange >= 0;
    }
  }
}