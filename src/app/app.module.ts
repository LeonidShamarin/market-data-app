import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NgxEchartsModule } from 'ngx-echarts';

import { AppComponent } from './app.component';
import { AssetCardComponent } from './components/asset-card/asset-card.component';
import { HistoricalChartComponent } from './components/historical-chart/historical-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    AssetCardComponent,
    HistoricalChartComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }