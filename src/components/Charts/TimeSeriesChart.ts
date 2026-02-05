import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { getChartColors } from '@/utils/formatters';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface TimeSeriesData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export class TimeSeriesChart {
  private container: HTMLElement;
  private chart: Chart | null = null;
  private canvas: HTMLCanvasElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="chart-container">
        <canvas id="chart-canvas"></canvas>
      </div>
    `;
    
    this.canvas = this.container.querySelector('#chart-canvas') as HTMLCanvasElement;
  }

  public updateTimeSeries(data: TimeSeriesData, title: string, unit: string = ''): void {
    if (!this.canvas) return;

    const colors = getChartColors();

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    // Prepare datasets
    const datasets = data.datasets.map((dataset, index) => {
      const datasetColors = [
        colors.primary,
        colors.secondary,
        colors.tertiary
      ];
      
      return {
        label: dataset.label,
        data: dataset.data,
        borderColor: dataset.color || datasetColors[index % datasetColors.length],
        backgroundColor: (dataset.color || datasetColors[index % datasetColors.length]) + '20',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: dataset.color || datasetColors[index % datasetColors.length],
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2
      };
    });

    // Create new chart
    this.chart = new Chart(this.canvas, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          title: {
            display: true,
            text: title,
            color: '#ffffff',
            font: {
              size: 16,
              weight: '600'
            },
            padding: {
              bottom: 20
            }
          },
          legend: {
            display: data.datasets.length > 1,
            position: 'top',
            labels: {
              color: '#ffffff',
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#00d4ff',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += context.parsed.y.toFixed(1);
                if (unit) {
                  label += ' ' + unit;
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            },
            ticks: {
              color: '#ffffff',
              maxTicksLimit: 10
            }
          },
          y: {
            display: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            },
            ticks: {
              color: '#ffffff'
            },
            title: {
              display: !!unit,
              text: unit,
              color: '#ffffff'
            }
          }
        }
      }
    });
  }

  public updateScatterPlot(data: { x: number; y: number }[], title: string, xLabel: string, yLabel: string): void {
    if (!this.canvas) return;

    const colors = getChartColors();

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    // Create scatter plot
    this.chart = new Chart(this.canvas, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Data Points',
          data: data,
          borderColor: colors.primary,
          backgroundColor: colors.primary + '80',
          borderWidth: 1,
          pointRadius: 3,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: title,
            color: '#ffffff',
            font: {
              size: 16,
              weight: '600'
            },
            padding: {
              bottom: 20
            }
          },
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#00d4ff',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => {
                return `${xLabel}: ${context.parsed.x.toFixed(1)}, ${yLabel}: ${context.parsed.y.toFixed(1)}`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            },
            ticks: {
              color: '#ffffff'
            },
            title: {
              display: true,
              text: xLabel,
              color: '#ffffff'
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            },
            ticks: {
              color: '#ffffff'
            },
            title: {
              display: true,
              text: yLabel,
              color: '#ffffff'
            }
          }
        }
      }
    });
  }

  public destroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}