import React, { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Download, Filter } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const OccupancyGraph = ({ data = [], onDownload, onFilter }) => {
  const chartRef = useRef();

  const handleDownload = () => {
    if (chartRef.current) {
      const canvas = chartRef.current.canvas;
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `occupancy-chart-${
        new Date().toISOString().split("T")[0]
      }.png`;
      link.href = url;
      link.click();
    }
  };

  const chartData = {
    labels:
      data.length > 0
        ? data.map((item) => item._id)
        : [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
    datasets: [
      {
        label: "Vacant Rooms",
        data:
          data.length > 0
            ? data.map((item) => item.vacant)
            : [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: "Occupied Rooms",
        data:
          data.length > 0
            ? data.map((item) => item.occupied)
            : [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: window.innerWidth < 640 ? 10 : 20,
          font: {
            size: window.innerWidth < 640 ? 10 : 14,
            weight: "500",
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function (context) {
            return `Day: ${context[0].label}`;
          },
          label: function (context) {
            const total =
              context.parsed.y +
              (context.datasetIndex === 0
                ? context.chart.data.datasets[1].data[context.dataIndex]
                : context.chart.data.datasets[0].data[context.dataIndex]);
            const percentage =
              total > 0 ? Math.round((context.parsed.y / total) * 100) : 0;
            return `${context.dataset.label}: ${context.parsed.y} (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: window.innerWidth < 640 ? 9 : 12,
            weight: "500",
          },
          color: "#6B7280",
          maxRotation: window.innerWidth < 640 ? 45 : 0,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(107, 114, 128, 0.1)",
          drawBorder: false,
        },
        ticks: {
          font: {
            size: window.innerWidth < 640 ? 9 : 12,
            weight: "500",
          },
          color: "#6B7280",
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    animation: {
      duration: 1000,
      easing: "easeInOutQuart",
    },
    layout: {
      padding: {
        left: window.innerWidth < 640 ? 5 : 10,
        right: window.innerWidth < 640 ? 5 : 10,
        top: window.innerWidth < 640 ? 5 : 10,
        bottom: window.innerWidth < 640 ? 5 : 10,
      },
    },
  };

  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      chart.update();
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading analytics data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-3 sm:space-y-4">
      {/* Chart Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
            Chart Controls
          </span>
        </div>
        <div className="flex flex-wrap gap-2 sm:space-x-2">
          {onFilter && (
            <button
              onClick={onFilter}
              className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
            >
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors whitespace-nowrap"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* Chart Container - Fixed width containment */}
      <div className="w-full max-w-full overflow-hidden">
        <div
          className="relative h-48 sm:h-56 md:h-64 w-full min-w-0"
          style={{ touchAction: "pan-y pinch-zoom" }}
        >
          <Bar
            ref={chartRef}
            data={chartData}
            options={{
              ...options,
              maintainAspectRatio: false,
              responsive: true,
              scales: {
                ...options.scales,
                x: {
                  ...options.scales.x,
                  ticks: {
                    ...options.scales.x.ticks,
                    maxRotation: window.innerWidth < 640 ? 45 : 0,
                    autoSkip: true,
                    maxTicksLimit: window.innerWidth < 640 ? 5 : 7,
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default OccupancyGraph;
