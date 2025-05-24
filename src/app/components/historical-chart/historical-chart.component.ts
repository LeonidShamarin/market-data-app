import { Component, Input, OnInit } from '@angular/core';
import { HistoricalDataService } from '../../services/historical-data.service';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-historical-chart',
  templateUrl: './historical-chart.component.html',
  styleUrls: ['./historical-chart.component.scss']
})
export class HistoricalChartComponent implements OnInit {
  @Input() symbol!: string;
  chartOptions!: EChartsOption;
  isLoading = true;
  error: string | null = null;

  timeframes = [
    { value: 'D', label: 'День', days: 1 },
    { value: 'W', label: 'Тиждень', days: 7 },
    { value: 'M', label: 'Місяць', days: 30 },
    { value: 'Y', label: 'Рік', days: 365 }
  ];
  selectedTimeframe = 'W'; 

  constructor(private historicalDataService: HistoricalDataService) {}

  ngOnInit(): void {
    this.loadHistoricalData();
  }

  loadHistoricalData(): void {
    this.isLoading = true;
    this.error = null;
    
    const timeframe = this.timeframes.find(t => t.value === this.selectedTimeframe);
    const days = timeframe ? timeframe.days : 7;
    
    this.historicalDataService.getHistoricalData(this.symbol, this.selectedTimeframe, days)
      .subscribe({
        next: (data) => {
          if (data.length === 0) {
            this.error = 'Дані відсутні для обраного періоду';
            this.chartOptions = {};
          } else {
            this.chartOptions = this.createChartOptions(data);
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Помилка завантаження даних:', err);
          this.error = 'Не вдалося завантажити дані';
          this.isLoading = false;
        }
      });
  }

  private createChartOptions(data: any[]): EChartsOption {
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const date = new Date(params[0].value[0]);
          return `
            <b>${date.toLocaleDateString()}</b><br/>
            Відкриття: ${params[0].value[1].toFixed(2)}<br/>
            Закриття: ${params[0].value[2].toFixed(2)}<br/>
            Мінімум: ${params[0].value[3].toFixed(2)}<br/>
            Максимум: ${params[0].value[4].toFixed(2)}
          `;
        }
      },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: (value: any) => {
            return new Date(value).toLocaleDateString();
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => '$' + value.toFixed(2)
        }
      },
      series: [{
        type: 'candlestick',
        data: data.map(item => item.value),
        itemStyle: {
          color: '#4CAF50',
          color0: '#F44336',
          borderColor: '#4CAF50',
          borderColor0: '#F44336'
        }
      }],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      }
    };
  }

  onTimeframeChange(): void {
    this.loadHistoricalData();
  }
}