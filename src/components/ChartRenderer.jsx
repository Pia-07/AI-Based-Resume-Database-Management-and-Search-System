import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);


import { Pie, Bar, Line } from "react-chartjs-2";

const ChartRenderer = ({ chart }) => {
  const data = {
    labels: chart.labels,
    datasets: [
      {
        data: chart.values,
        backgroundColor: [
          "#2563eb", "#16a34a", "#f97316", "#dc2626", "#9333ea"
        ]
      }
    ]
  };

  if (chart.type === "pie") return <Pie data={data} />;
  if (chart.type === "bar") return <Bar data={data} />;
  if (chart.type === "line") return <Line data={data} />;
  return null;
};

export default ChartRenderer;
