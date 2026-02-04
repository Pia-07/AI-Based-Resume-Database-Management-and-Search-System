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
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const ChartRenderer = ({ data: chart }) => {
  console.log("🎨 ChartRenderer received:", chart);
  
  if (!chart) {
    console.warn("⚠️ No chart data provided to ChartRenderer");
    return null;
  }

  // Validate chart data
  if (!chart.type) {
    console.warn("⚠️ Chart type is missing");
    return null;
  }

  if (!chart.labels || chart.labels.length === 0) {
    console.warn("⚠️ Chart labels missing or empty");
    return null;
  }

  if (!chart.values || chart.values.length === 0) {
    console.warn("⚠️ Chart values missing or empty");
    return null;
  }

  console.log("📊 Chart type:", chart.type);
  console.log("📊 Chart labels:", chart.labels?.length);
  console.log("📊 Chart values:", chart.values?.length);

  // Generate enough colors for all data points
  const baseColors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
    "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2",
    "#F8B88B", "#AED6F1", "#F5B041", "#52BE80",
    "#E74C3C", "#3498DB", "#2ECC71", "#F39C12",
    "#9B59B6", "#1ABC9C", "#34495E", "#E67E22"
  ];

  // Generate colors dynamically if we need more
  const colors = [];
  const borderColors = [];
  for (let i = 0; i < chart.values.length; i++) {
    const color = baseColors[i % baseColors.length];
    colors.push(color);
    borderColors.push(color); // Same color as background
  }

  const data = {
    labels: chart.labels || [],
    datasets: [
      {
        label: chart.title,
        data: chart.values || [],
        backgroundColor: chart.type === "pie" ? colors : colors[0],
        borderColor: chart.type === "pie" ? borderColors : borderColors[0],
        borderWidth: 2,
        fill: chart.type === "line",
        tension: chart.type === "line" ? 0.4 : undefined,
        pointRadius: chart.type === "line" ? 5 : undefined,
        pointHoverRadius: chart.type === "line" ? 7 : undefined,
        pointBackgroundColor: chart.type === "line" ? borderColors[0] : undefined,
        pointBorderColor: chart.type === "line" ? "#fff" : undefined,
        pointBorderWidth: chart.type === "line" ? 2 : undefined,
      },
    ],
  };

  // Chart options with better visibility
  const options = {
    indexAxis: chart.type === "bar" ? "y" : "x",
    scales: chart.type !== "pie" ? {
      x: {
        type: "category",
        display: true,
        ticks: {
          font: {
            size: 11,
          },
        },
        grid: {
          drawBorder: false,
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      y: {
        beginAtZero: true,
        display: true,
        ticks: {
          font: {
            size: 11,
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
    } : {},
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: {
            size: 11,
            weight: "bold",
          },
          padding: 12,
          usePointStyle: true,
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 13, weight: "bold" },
        bodyFont: { size: 12 },
        cornerRadius: 4,
      },
      filler: {
        propagate: true,
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    layout: {
      padding: {
        top: 20,
        bottom: 80,
        left: 20,
        right: 20,
      },
    },
  };

  return (
    <div style={{ 
      height: "auto",
      maxHeight: "800px",
      width: "100%", 
      overflow: "auto",
      overflowX: "visible",
      overflowY: "auto",
      padding: "20px",
      border: "1px solid #e2e8f0",
      borderRadius: "8px"
    }}>
      <div style={{ position: "relative", height: "600px", width: "100%" }}>
        {chart.type === "pie" && <Pie data={data} options={options} />}
        {chart.type === "bar" && <Bar data={data} options={options} />}
        {chart.type === "line" && <Line data={data} options={options} />}
      </div>
    </div>
  );
};

export default ChartRenderer;
