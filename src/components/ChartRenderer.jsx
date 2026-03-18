import {
  Pie,
  Bar,
  Line
} from "react-chartjs-2";

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,  // CRITICAL: Required for line charts
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,  // For area fill under line charts
} from "chart.js";

import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register ALL required components including PointElement and DataLabels plugin
ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

const ChartRenderer = ({ data: chart, isDarkMode = false }) => {
  console.log("🎨 ChartRenderer received:", chart);

  if (!chart) {
    console.warn("⚠️ No chart data provided to ChartRenderer");
    return null;
  }

  // Validate chart data
  if (!chart.type) {
    console.warn("⚠️ Chart type is missing");
    return (
      <div style={styles.errorContainer}>
        <p>Chart type not specified</p>
      </div>
    );
  }

  if (!chart.labels || chart.labels.length === 0) {
    console.warn("⚠️ Chart labels missing or empty");
    return (
      <div style={styles.errorContainer}>
        <p>No data available for chart</p>
      </div>
    );
  }

  if (!chart.values || chart.values.length === 0) {
    console.warn("⚠️ Chart values missing or empty");
    return (
      <div style={styles.errorContainer}>
        <p>No values available for chart</p>
      </div>
    );
  }

  console.log("📊 Chart type:", chart.type);
  console.log("📊 Chart labels:", chart.labels?.length);
  console.log("📊 Chart values:", chart.values?.length);

  // Vibrant color palette for better visibility
  const baseColors = [
    "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
    "#ec4899", "#f43f5e", "#ef4444", "#f97316",
    "#f59e0b", "#eab308", "#84cc16", "#22c55e",
    "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
    "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7"
  ];

  // Generate colors dynamically
  const colors = [];
  const borderColors = [];
  for (let i = 0; i < chart.values.length; i++) {
    const color = baseColors[i % baseColors.length];
    colors.push(color);
    borderColors.push(color);
  }

  // Text color for dark/light mode
  const textColor = isDarkMode ? "#e2e8f0" : "#1e293b";
  const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";

  const data = {
    labels: chart.labels || [],
    datasets: [
      {
        label: chart.title || "Data",
        data: chart.values || [],
        backgroundColor: chart.type === "pie" ? colors : colors.map(c => c + "E6"),
        borderColor: chart.type === "line" ? colors[0] : "transparent",
        borderWidth: chart.type === "line" ? 3 : 0,
        borderRadius: chart.type === "bar" ? 8 : 0,
        borderSkipped: false,
        fill: chart.type === "line" ? {
          target: 'origin',
          above: colors[0] + '20',
        } : false,
        tension: chart.type === "line" ? 0.4 : undefined,
        pointRadius: chart.type === "line" ? 6 : undefined,
        pointHoverRadius: chart.type === "line" ? 9 : undefined,
        pointBackgroundColor: chart.type === "line" ? colors[0] : undefined,
        pointBorderColor: chart.type === "line" ? "#fff" : undefined,
        pointBorderWidth: chart.type === "line" ? 2 : undefined,
      },
    ],
  };

  // Chart options with proper configuration for all chart types
  const options = {
    indexAxis: chart.type === "bar" && chart.labels.length > 6 ? "y" : "x",
    scales: chart.type !== "pie" ? {
      x: {
        type: "category",
        display: true,
        title: {
          display: chart.type === "bar" && chart.labels.length > 6 ? true : false,
          text: chart.type === "bar" && chart.labels.length > 6 ? "Count" : "",
          font: { size: 14, weight: "bold" },
          color: textColor,
          padding: 15,
        },
        ticks: {
          font: { size: 12, weight: "500" },
          color: textColor,
          maxRotation: chart.type === "bar" && chart.labels.length > 6 ? 0 : 45,
          minRotation: 0,
          padding: 10,
        },
        grid: {
          display: chart.type === "line",
          color: gridColor,
          drawBorder: false,
        },
        offset: true,
      },
      y: {
        beginAtZero: true,
        display: true,
        title: {
          display: chart.type === "bar" && chart.labels.length > 6 ? true : false,
          text: chart.type === "bar" && chart.labels.length > 6 ? "Locations" : "",
          font: { size: 14, weight: "bold" },
          color: textColor,
          padding: 15,
        },
        ticks: {
          font: { size: 12, weight: "500" },
          color: textColor,
          precision: 0,
          padding: 10,
        },
        grid: {
          color: gridColor,
          drawBorder: false,
        },
      },
    } : undefined,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { size: 13, weight: "600" },
          color: textColor,
          padding: 20,
          usePointStyle: true,
          boxWidth: 14,
          boxHeight: 14,
        },
      },
      datalabels: {
        display: true,
        color: textColor,
        anchor: chart.type === "bar" && chart.labels.length > 6 ? "end" : "end",
        align: chart.type === "bar" && chart.labels.length > 6 ? "right" : "top",
        offset: chart.type === "bar" && chart.labels.length > 6 ? 12 : 6,
        font: {
          weight: 'bold',
          size: 13
        },
        formatter: (value) => Math.round(value),
      },
      tooltip: {
        backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.95)" : "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 14,
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
        cornerRadius: 10,
        displayColors: true,
        borderColor: isDarkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(71, 85, 105, 0.2)",
        borderWidth: 1,
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    layout: {
      padding: {
        top: 30,
        bottom: 30,
        left: 30,
        right: 30,
      },
    },
    animation: {
      duration: 800,
      easing: 'easeInOutQuart',
    },
  };

  const containerStyle = {
    ...styles.chartOuterContainer,
    backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
    borderColor: isDarkMode ? "#334155" : "#e2e8f0",
  };

  return (
    <div style={containerStyle}>
      <h4 style={{
        ...styles.chartTitle,
        color: textColor,
      }}>
        {chart.title || "Chart"}
      </h4>
      <div style={styles.chartInnerContainer}>
        {chart.type === "pie" && <Pie data={data} options={options} />}
        {chart.type === "bar" && <Bar data={data} options={options} />}
        {chart.type === "line" && <Line data={data} options={options} />}
      </div>
    </div>
  );
};

const styles = {
  chartOuterContainer: {
    height: "auto",
    width: "100%",
    padding: "28px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.04)",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
  },
  chartTitle: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "20px",
    textAlign: "center",
    letterSpacing: "-0.5px",
  },
  chartInnerContainer: {
    position: "relative",
    height: "450px",
    width: "100%",
  },
  errorContainer: {
    padding: "40px",
    textAlign: "center",
    color: "#64748b",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px dashed #cbd5e1",
  }
};

export default ChartRenderer;
