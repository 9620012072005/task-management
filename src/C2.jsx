import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './Firebase-Config'; // Replace with your Firebase configuration file
import { useParams } from 'react-router-dom';
import "./App.css";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const TaskManagementChart = () => {
  const { id, projectId } = useParams(); // Get the id and projectId from the URL parameters
  const [chartData, setChartData] = useState(null);

  const fetchTasks = async () => {
    try {
      const tasksCollection = collection(
        db,
        'companies',  // Assuming the collection is 'companies'
        id,            // Use 'id' from useParams
        'projects',    // The collection is under projects
        projectId,     // Use 'projectId' from useParams
        'tasks'        // The 'tasks' subcollection
      );

      const querySnapshot = await getDocs(tasksCollection);

      if (querySnapshot.empty) {
        console.warn('No tasks found in Firestore.');
        setChartData(null);
        return;
      }

      const tasks = querySnapshot.docs
        .map((doc) => {
          const data = doc.data();

          if (!data.createdOn || !data.deadlineTo || !data.task) {
            console.error('Missing fields in task:', data);
            return null;
          }

          // Ensure correct date handling for Firestore Timestamps
          const createdOn = new Date(data.createdOn.seconds * 1000);
          const deadlineTo = new Date(data.deadlineTo.seconds * 1000);
          const now = new Date();

          const totalDuration = deadlineTo - createdOn;
          const elapsedDuration = now - createdOn;
          const completion = Math.min((elapsedDuration / totalDuration) * 100, 100);

          return {
            name: data.task,
            completion: Math.round(completion),
            targetGoal: 100, // Assuming target goal is always 100% for all tasks
            deadlineTo,
          };
        })
        .filter(Boolean); // Filter out null values due to missing fields

      const labels = tasks.map((task) => task.name);
      const completionData = tasks.map((task) => task.completion);
      const targetData = tasks.map((task) => task.targetGoal);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Completion (%)',
            data: completionData,
            backgroundColor: (ctx) => {
              const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 400);
              gradient.addColorStop(0, 'rgba(219, 189, 239)');
              gradient.addColorStop(1, 'rgba(219, 189, 239)');
              return gradient;
            },
            borderColor: 'rgba(93, 173, 226, 1)',
            borderWidth: 0.1,
            barPercentage: 0.4,
            categoryPercentage: 0.7,
          },
          {
            label: 'Target Goal (%)',
            data: targetData,
            backgroundColor: (ctx) => {
              const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 400);
              gradient.addColorStop(0, 'rgba(101, 215, 247)');
              gradient.addColorStop(1, 'rgba(119, 0, 255)');
              return gradient;
            },
            borderColor: 'rgba(165, 105, 189, 1)',
            borderWidth: 0.1,
            barPercentage: 0.4,
            categoryPercentage: 0.7,
          },
        ],
        metadata: tasks, // Attach tasks metadata for tooltips
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    fetchTasks(); // Fetch tasks on component mount
  }, [id, projectId]); // Fetch new tasks if id or projectId changes

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const task = chartData?.metadata?.[context.dataIndex];
            if (context.dataset.label === 'Completion (%)') {
              return `Completion: ${context.raw}%\nCurrent Time: ${new Date().toLocaleString()}`;
            }
            if (context.dataset.label === 'Target Goal (%)') {
              return `Target Goal: ${context.raw}%\nDeadline: ${task?.deadlineTo?.toLocaleString()}`;
            }
            return `${context.raw}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(200, 200, 200, 0.2)',
        },
        ticks: {
          callback: (value) => `${value}%`, // Format ticks as percentages
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 sm:p-8  rounded-xl shadow-lg w-full max-w-full lg:max-w-[480px]  mt-4 mb-5 sm:p-4 md:p-5 ">
      <div className="flex items-center mb-6">
        <h3 className="text-3xl sm:text-4xl font-semibold text-gray-800">Task Progress Overview</h3>
        <div className="text-gray-600 text-lg">Current Tasks</div>
      </div>
  
      {/* Conditionally add `overflow-x-auto` based on task count */}
      <div
        className={`chart-container-wrapper ${
          chartData?.labels?.length > 5 ? "overflow-x-auto" : ""
        } w-full`}
      >
        <div className="chart-container w-full sm:w-[800px] md:w-[1000px] lg:w-[100%] h-[200px]">
          {chartData ? <Bar data={chartData} options={options} /> : <p>Loading chart...</p>}
        </div>
      </div>
  
      <div className="flex justify-between mt-6 gap-10 ">
        <div className="flex items-center text-sm text-gray-600">
          <div className="w-4 h-4 mr-2 rounded-full bg-blue-500"></div>
          <span>Target</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <div className="w-4 h-4 mr-2 rounded-full bg-purple-500"></div>
          <span>Completion</span>
        </div>
      </div>
    </div>
  );
  
};

export default TaskManagementChart;
