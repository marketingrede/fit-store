import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js"

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
)

const BRAND = {
  teal: "#2dbda8",
  tealSoft: "rgba(45, 189, 168, 0.14)",
  blue: "#256897",
  grey: "#d8dde2",
  muted: "#8a9199",
  text: "#303238",
}

const CATEGORY_COLORS = [
  "#2dbda8",
  "#256897",
  "#1e9a88",
  "#326f91",
  "#62c7ba",
  "#4f9fd0",
  "#8f9499",
  "#d8dde2",
]

const charts = []

function readPayload() {
  const root = document.getElementById("admin-dashboard-charts")
  if (!root?.dataset.charts) return null

  try {
    return JSON.parse(root.dataset.charts)
  } catch {
    return null
  }
}

function baseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: BRAND.muted,
          font: { size: 11, weight: "600" },
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "#2d3035",
        titleFont: { size: 12, weight: "700" },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
    },
  }
}

function createTradeDaysChart(canvas, tradeDays) {
  const labels = tradeDays.map((day) => day.label)
  const values = tradeDays.map((day) => day.value)

  return new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Trocas",
          data: values,
          borderColor: BRAND.teal,
          backgroundColor: BRAND.tealSoft,
          fill: true,
          tension: 0.35,
          pointRadius: values.length > 20 ? 0 : 3,
          pointHoverRadius: 5,
          pointBackgroundColor: BRAND.teal,
          borderWidth: 2,
        },
      ],
    },
    options: {
      ...baseOptions(),
      plugins: {
        ...baseOptions().plugins,
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: BRAND.muted,
            font: { size: 11 },
            maxTicksLimit: 8,
            maxRotation: 0,
          },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: BRAND.muted,
            font: { size: 11 },
            precision: 0,
          },
          grid: { color: "#edf0f2" },
          border: { display: false },
        },
      },
    },
  })
}

function createTopProductsChart(canvas, topProducts) {
  const labels = topProducts.map((item) => item.name)
  const values = topProducts.map((item) => item.value)

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Pedidos",
          data: values,
          backgroundColor: BRAND.teal,
          borderRadius: 999,
          barThickness: 12,
          maxBarThickness: 14,
        },
      ],
    },
    options: {
      ...baseOptions(),
      indexAxis: "y",
      plugins: {
        ...baseOptions().plugins,
        legend: { display: false },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            color: BRAND.muted,
            font: { size: 11 },
            precision: 0,
          },
          grid: { color: "#edf0f2" },
          border: { display: false },
        },
        y: {
          grid: { display: false },
          ticks: {
            color: BRAND.text,
            font: { size: 11, weight: "600" },
          },
          border: { display: false },
        },
      },
    },
  })
}

function createDoughnutChart(canvas, items, { cutout = "68%" } = {}) {
  return new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: items.map((item) => item.label),
      datasets: [
        {
          data: items.map((item) => item.value),
          backgroundColor: items.map(
            (item, index) => item.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length],
          ),
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      ...baseOptions(),
      cutout,
      plugins: {
        ...baseOptions().plugins,
        legend: {
          ...baseOptions().plugins.legend,
          position: "bottom",
        },
      },
    },
  })
}

export function initDashboardCharts() {
  const payload = readPayload()
  if (!payload) return

  const tradeCanvas = document.getElementById("admin-chart-trade-days")
  if (tradeCanvas && payload.tradeDays?.length) {
    charts.push(createTradeDaysChart(tradeCanvas, payload.tradeDays))
  }

  const topCanvas = document.getElementById("admin-chart-top-products")
  if (topCanvas && payload.topProducts?.length) {
    charts.push(createTopProductsChart(topCanvas, payload.topProducts))
  }

  const categoryCanvas = document.getElementById("admin-chart-categories")
  if (categoryCanvas && payload.categories?.length) {
    charts.push(createDoughnutChart(categoryCanvas, payload.categories))
  }

  const statusCanvas = document.getElementById("admin-chart-catalog-status")
  if (statusCanvas && payload.catalogStatus?.length) {
    charts.push(createDoughnutChart(statusCanvas, payload.catalogStatus, { cutout: "72%" }))
  }
}

export function teardownDashboardCharts() {
  while (charts.length) {
    charts.pop()?.destroy()
  }
}
