import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { WebSocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-asset-card',
  templateUrl: './asset-card.component.html',
  styleUrls: ['./asset-card.component.scss'],
})
export class AssetCardComponent implements OnInit, OnDestroy {
  @Input() asset: any;
  currentPrice: number | null = null;
  lastUpdated: Date | null = null;
  private socketSubscription!: Subscription;

  constructor(private webSocketService: WebSocketService) {}

  ngOnInit(): void {
    this.socketSubscription = this.webSocketService.connect(this.asset.symbol).subscribe((message) => {
      if (message.type === 'trade') {
        this.currentPrice = message.data[0].p;
        this.lastUpdated = new Date();
      }
    });
  }

  ngOnDestroy(): void {
    this.webSocketService.disconnect(this.asset.symbol);
    this.socketSubscription.unsubscribe();
  }
}