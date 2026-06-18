import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

const BRAND = {
  teal: '#2dbda8',
  blue: '#256897',
  grey: '#8a8a8d',
  surface: '#eae9e9',
};

const CHART_FONT = {
  family: 'Inter, system-ui, sans-serif',
  size: 11,
};

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        font: CHART_FONT,
        color: '#616164',
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: '#3d3d40',
      titleFont: CHART_FONT,
      bodyFont: CHART_FONT,
      padding: 10,
      cornerRadius: 8,
    },
  },
};

function palette(count) {
  const colors = [BRAND.teal, BRAND.blue, '#1e9a88', '#1a5278', '#5ec4b6', '#4a8fc4', BRAND.grey, BRAND.surface];
  return Array.from({ length: count }, (_, index) => colors[index % colors.length]);
}

function createLineChart(canvas, labels, values) {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Trocas',
        data: values,
        borderColor: BRAND.teal,
        backgroundColor: 'rgba(45, 189, 168, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4,
        borderWidth: 2,
      }],
    },
    options: {
      ...baseOptions,
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: CHART_FONT, color: BRAND.grey, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0, font: CHART_FONT, color: BRAND.grey },
          grid: { color: 'rgba(97, 97, 100, 0.08)' },
        },
      },
      plugins: {
        ...baseOptions.plugins,
        legend: { display: false },
      },
    },
  });
}

function createBarChart(canvas, items, horizontal = false) {
  const labels = items.map((item) => item.label);
  const values = items.map((item) => item.count);

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Quantidade',
        data: values,
        backgroundColor: palette(values.length).map((color) => `${color}cc`),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      ...baseOptions,
      indexAxis: horizontal ? 'y' : 'x',
      scales: {
        x: {
          beginAtZero: true,
          grid: horizontal ? { color: 'rgba(97, 97, 100, 0.08)' } : { display: false },
          ticks: {
            precision: 0,
            font: CHART_FONT,
            color: BRAND.grey,
            display: horizontal,
          },
        },
        y: {
          beginAtZero: true,
          grid: horizontal ? { display: false } : { color: 'rgba(97, 97, 100, 0.08)' },
          ticks: {
            precision: 0,
            font: CHART_FONT,
            color: BRAND.grey,
            display: !horizontal,
          },
        },
      },
      plugins: {
        ...baseOptions.plugins,
        legend: { display: false },
      },
    },
  });
}

function createDoughnutChart(canvas, items) {
  const labels = items.map((item) => item.label);
  const values = items.map((item) => item.count);

  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: palette(values.length),
        borderWidth: 0,
        hoverOffset: 4,
      }],
    },
    options: {
      ...baseOptions,
      cutout: '62%',
      plugins: {
        ...baseOptions.plugins,
        legend: {
          ...baseOptions.plugins.legend,
          position: 'bottom',
        },
      },
    },
  });
}

export function initAdminDashboard() {
  const root = document.querySelector('[data-dashboard-charts]');
  if (!root) return;

  let chartData;
  try {
    chartData = JSON.parse(root.dataset.dashboardCharts || '{}');
  } catch {
    return;
  }

  const charts = [];

  const timelineCanvas = root.querySelector('[data-chart="trades_timeline"]');
  if (timelineCanvas && chartData.trades_timeline) {
    charts.push(createLineChart(
      timelineCanvas,
      chartData.trades_timeline.labels,
      chartData.trades_timeline.values,
    ));
  }

  const topProductsCanvas = root.querySelector('[data-chart="top_products"]');
  if (topProductsCanvas && chartData.top_products?.length) {
    charts.push(createBarChart(topProductsCanvas, chartData.top_products, true));
  }

  const categoryCanvas = root.querySelector('[data-chart="products_by_category"]');
  if (categoryCanvas && chartData.products_by_category?.length) {
    charts.push(createDoughnutChart(categoryCanvas, chartData.products_by_category));
  }

  const statusCanvas = root.querySelector('[data-chart="products_by_status"]');
  if (statusCanvas && chartData.products_by_status?.length) {
    charts.push(createDoughnutChart(statusCanvas, chartData.products_by_status));
  }

  window.addEventListener('pagehide', () => {
    charts.forEach((chart) => chart.destroy());
  });
}
