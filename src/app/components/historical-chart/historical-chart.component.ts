import { Component, Input, OnInit } from '@angular/core';
import { HistoricalDataService } from '../../services/historical-data.service';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-historical-chart',
  templateUrl: './historical-chart.component.html',
  styleUrls: ['./historical-chart.component.scss'],
})
export class HistoricalChartComponent implements OnInit {
  @Input() symbol!: string;
  chartOptions!: EChartsOption;
  isLoading = true;

  constructor(private historicalDataService: HistoricalDataService) {}

  ngOnInit(): void {
    this.loadHistoricalData();
  }

  loadHistoricalData(): void {
    this.isLoading = true;
    this.historicalDataService.getHistoricalData(this.symbol).subscribe({
      next: (data) => {
        this.chartOptions = this.createChartOptions(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load historical data:', err);
        this.isLoading = false;
      },
    });
  }

  private createChartOptions(data: any[]): EChartsOption {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      xAxis: { type: 'time' },
      yAxis: { type: 'value', scale: true },
      series: [
        {
          type: 'candlestick',
          data: data.map((item) => item.value),
        },
      ],
    };
  }
}