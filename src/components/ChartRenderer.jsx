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

// Register ALL required components including PointElement
ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,  // CRITICAL: This was missing!
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
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
        backgroundColor: chart.type === "pie" ? colors : colors.map(c => c + "CC"),
        borderColor: chart.type === "line" ? colors[0] : borderColors,
        borderWidth: chart.type === "line" ? 3 : 2,
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
        ticks: {
          font: { size: 11, weight: "500" },
          color: textColor,
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          display: chart.type === "line",
          color: gridColor,
        },
      },
      y: {
        beginAtZero: true,
        display: true,
        ticks: {
          font: { size: 11, weight: "500" },
          color: textColor,
          precision: 0,  // Only show whole numbers
        },
        grid: {
          color: gridColor,
        },
      },
    } : undefined,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { size: 12, weight: "600" },
          color: textColor,
          padding: 15,
          usePointStyle: true,
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.95)" : "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
        cornerRadius: 8,
        displayColors: true,
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20,
      },
    },
    animation: {
      duration: 750,
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
    padding: "20px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  chartTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "16px",
    textAlign: "center",
  },
  chartInnerContainer: {
    position: "relative",
    height: "400px",
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
