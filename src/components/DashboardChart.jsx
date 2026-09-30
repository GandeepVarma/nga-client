import React from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";

const chartTypes = { bar: Bar, doughnut: Doughnut, line: Line };

const DashboardChart = ({ type, data, options, className = "" }) => {
  const ChartComponent = chartTypes[type];
  if (!ChartComponent) return null;

  return (
    <div className={`min-w-0 ${className}`}>
      <ChartComponent data={data} options={options} />
    </div>
  );
};

export default DashboardChart;