import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./Firebase-Config"; // Import your Firebase configuration file
import { useParams } from "react-router-dom";

const ProgressCircle = ({ percentage, gradient, label }) => {
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;

  const [dashOffset, setDashOffset] = useState(circumference);

  useEffect(() => {
    const newDashOffset = circumference - (percentage / 100) * circumference;
    setDashOffset(newDashOffset);
  }, [percentage, circumference]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center mx-auto w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-20 lg:h-20">
        <svg
          width="100%"
          height="100%"
          className="transform rotate-90"
          viewBox="0 0 120 120"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#e6e6e6"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={gradient}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 1s ease-out, stroke 0.3s ease",
            }}
          />
        </svg>
        <div className="absolute flex items-center justify-center top-0 left-0 w-full h-full">
          <span className="text-sm md:text-base font-semibold text-gray-800">
            {percentage}%
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm md:text-base lg:text-sm text-gray-600">{label}</p>
    </div>
  );
};

const GradientCircleDashboard = () => {
  const { id, projectId } = useParams();
  const [pendingPercentage, setPendingPercentage] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [completedPercentage, setCompletedPercentage] = useState(0);

  const fetchTasks = async () => {
    try {
      const tasksCollection = collection(
        db,
        "companies",
        id,
        "projects",
        projectId,
        "tasks"
      );

      const snapshot = await getDocs(tasksCollection);

      let totalTasks = 0;
      let completedTasks = 0;
      let pendingTasks = 0;

      snapshot.forEach((doc) => {
        totalTasks++;
        const task = doc.data();
        if (task.stage === "completed") {
          completedTasks++;
        } else {
          pendingTasks++;
        }
      });

      const overallCompletion =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const pendingTaskPercentage =
        totalTasks > 0 ? (pendingTasks / totalTasks) * 100 : 0;
      const completedTaskPercentage =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      setPendingPercentage(pendingTaskPercentage.toFixed(0));
      setCompletionPercentage(overallCompletion.toFixed(0));
      setCompletedPercentage(completedTaskPercentage.toFixed(0));
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [id, projectId]);

  return (
    
      <div className="max-w-full  p-4 sm:p-6 bg-white rounded-lg shadow-lg lg:p-4 lg:max-w-[30%]  xl:max-w-[100%]">
        <div className="flex justify-center align-items-center gap-6 lg:gap-4">
          <ProgressCircle
            percentage={pendingPercentage}
            gradient="url(#gradient1)"
            label="Pending Tasks"
          />
          <ProgressCircle
            percentage={completionPercentage}
            gradient="url(#gradient2)"
            label="Overall Project Completion"
          />
          <ProgressCircle
            percentage={completedPercentage}
            gradient="url(#gradient3)"
            label="Completed Tasks"
          />
        </div>
    
        <svg width="0" height="0">
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EA657E" />
              <stop offset="100%" stopColor="#F09E5C" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5571FD" />
              <stop offset="100%" stopColor="#C77AFD" />
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#41D79C" />
              <stop offset="100%" stopColor="#A7E25F" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
    
};

export default GradientCircleDashboard;
