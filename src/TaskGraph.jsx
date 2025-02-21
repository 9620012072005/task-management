import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { db } from "./Firebase-Config";
import { collection, onSnapshot } from "firebase/firestore";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement, // Register PointElement
  LineElement,
  LineController// Register LineElement
} from 'chart.js';
import { useParams } from "react-router-dom";

// Register necessary components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement, // Ensure PointElement is registered
  LineElement,
  LineController// Ensure LineElement is registered
);

const TaskGraph = () => {
  const [taskData, setTaskData] = useState([]);
  const { id, projectId } = useParams();

  useEffect(() => {
    // Fetch tasks from Firebase
    const unsubscribeTasks = onSnapshot(
      collection(db, "companies", id, "projects", projectId, "tasks"),
      (snapshot) => {
        const tasks = snapshot.docs.map((doc) => doc.data());
        setTaskData(tasks);
      },
      (error) => {
        console.error("Error fetching tasks:", error);
      }
    );

    // Clean up listener on unmount
    return () => unsubscribeTasks();
  }, [id, projectId]);

  // Extract unique stages from taskData
  const uniqueStages = [...new Set(taskData.map((task) => task.stage).filter(Boolean))];

  // Group tasks by assignedTo and count by stage
  const assignedToCounts = {};
  const stageCounts = uniqueStages.reduce((acc, stage) => {
    acc[stage] = 0;
    taskData.forEach((task) => {
      if (task.stage === stage) {
        acc[stage]++;
      }
    });
    return acc;
  }, {});

  taskData.forEach((task) => {
    const assignees = task.assignedTo || [];
    const { stage, color } = task;

    if (stage) {
      assignees.forEach((assignee) => {
        if (!assignedToCounts[assignee]) {
          assignedToCounts[assignee] = {
            counts: uniqueStages.reduce((acc, stage) => {
              acc[stage] = 0;
              return acc;
            }, {}),
            color: color || "#D3D3D3", // Default color if none is provided
          };
        }
        assignedToCounts[assignee].counts[stage]++;
      });
    }
  });

  // Prepare data for the chart
  const chartData = {
    labels: uniqueStages,
    datasets: Object.keys(assignedToCounts).map((assignee) => {
      const { counts, color } = assignedToCounts[assignee];
      return {
        label: assignee,
        data: uniqueStages.map((stage) => counts[stage] || 0),
        backgroundColor: color, // Use the color from the database
        borderWidth: 1,
      };
    }),
  };

  // Prepare line chart dataset (representing total task counts per stage)
  const lineChartData = {
    label: "Total Tasks",
    data: uniqueStages.map((stage) => stageCounts[stage] || 0),
    borderColor: "#B0B0B0",
    borderWidth: 2,
    fill: false,
    type: 'line',
    pointBackgroundColor: "#000000",
    pointBorderColor: "#000000",
    pointRadius: 4,
    pointHoverRadius: 6,
    order: -1, // Set lower order to display the line on top
  };

  // Update chart data to include the line chart
  chartData.datasets.push(lineChartData);

  const options = {
    responsive: true,
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true },
    },
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Task Stage Overview by Assigned To" },
    },
  };

  return (
    <div className="flex items-center justify-center w-full h-screen p-6">
      <div className="w-full h-full">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default TaskGraph;
