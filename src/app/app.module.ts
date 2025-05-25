import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { PriceChartComponent } from './components/price-chart/price-chart.component';
import { MarketDataService } from './services/market-data.service';

@NgModule({
  declarations: [
    AppComponent,
    PriceChartComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [MarketDataService],
  bootstrap: [AppComponent]
})
export class AppModule { }
