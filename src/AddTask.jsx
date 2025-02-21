import React, { useState, useEffect } from "react";
import {
  AccessTime,
  PlayCircleFilled,
  HourglassEmpty,
  CheckCircle,
} from "@mui/icons-material";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./Firebase-Config"; // Import your Firebase config file
import { useParams } from "react-router-dom";

// GradientCard Component with Progress Bar
const GradientCard = ({
  title,
  count,
  gradient,
  totalTasks,
  progressBarGradient,
  Icon,
}) => {
  const progress = totalTasks > 0 ? (count / totalTasks) * 100 : 0; // Avoid division by zero

  return (
    <div
      className=" w-full  rounded-lg shadow-lg p-4 sm:p-5 lg:p-6 flex flex-col transition-transform transform hover:scale-105 hover:shadow-2xl"
      style={{ background: gradient }}
    >
      <div className="flex-1 mb-4">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-2">
          {title}
        </h3>
        <p className="text-white text-sm sm:text-md lg:text-lg font-semibold mb-2">
          {count} tasks
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-300 rounded-full h-2 relative">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-in-out"
            style={{
              background: progressBarGradient,
              width: `${progress}%`, // Dynamic progress bar width
            }}
          ></div>

          <span
            className="absolute top-0 right-0 text-white text-xs font-semibold"
            style={{ right: "-5px", top: "-20px" }}
          >
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <div className="absolute top-0 right-0 m-2 opacity-50">
        <Icon className="text-white" style={{ fontSize: "30px" }} />
      </div>
    </div>
  );
};

// RandomCardDashboard Component
const RandomCardDashboard = () => {
  const { id, projectId } = useParams(); // Destructure route params
  const [taskCounts, setTaskCounts] = useState({
    unstarted: 0,
    begin: 0,
    intermediate: 0,
    completed: 0,
  });

  useEffect(() => {
    if (!id || !projectId) return; // Ensure required params exist

    const tasksCollection = collection(
      db,
      "companies",
      id,
      "projects",
      projectId,
      "tasks"
    );

    const unsubscribe = onSnapshot(
      tasksCollection,
      (snapshot) => {
        const counts = {
          unstarted: 0,
          begin: 0,
          intermediate: 0,
          completed: 0,
        };

        snapshot.forEach((doc) => {
          const task = doc.data();
          const stage = task.stage; // Fetch the stage field

          if (stage && counts.hasOwnProperty(stage)) {
            counts[stage]++;
          } else {
            console.warn("Invalid stage detected:", stage); // Log invalid stages
          }
        });

        setTaskCounts(counts); // Update state with the new counts
      },
      (error) => {
        console.error("Error fetching tasks:", error);
      }
    );

    return () => unsubscribe(); // Cleanup Firestore listener on unmount
  }, [id, projectId]);

  const totalTasks = Object.values(taskCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  const cardData = [
    {
      title: "Unstarted",
      count: taskCounts.unstarted,
      gradient: "linear-gradient(to right, #EA657E, #F09E5C)",
      progressBarGradient: "linear-gradient(to right,#F093A6, #F2F7F9)",
      Icon: AccessTime,
    },
    {
      title: "Begin",
      count: taskCounts.begin,
      gradient: "linear-gradient(to right, #3FABF6, #747BFC)",
      progressBarGradient: "linear-gradient(to right, #75C5F9, #F2F7F9)",
      Icon: PlayCircleFilled,
    },
    {
      title: "Intermediate",
      count: taskCounts.intermediate,
      gradient: "linear-gradient(to right, #5571FD, #C77AFD)",
      progressBarGradient: "linear-gradient(to right,#869CFF, #F2F7F9)",
      Icon: HourglassEmpty,
    },
    {
      title: "Completed",
      count: taskCounts.completed,
      gradient: "linear-gradient(to right, #41D79C, #A7E25F)",
      progressBarGradient: "linear-gradient(to right, #6FE3BA,#F2F7F9)",
      Icon: CheckCircle,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4  md:p-4 lg:gap-6 xl:gap-4 lg">
      {cardData.map((card, index) => (
        <GradientCard
          key={index}
          title={card.title}
          count={card.count}
          gradient={card.gradient}
          totalTasks={totalTasks}
          progressBarGradient={card.progressBarGradient}
          Icon={card.Icon}
        />
      ))}
    </div>
  );
};

export default RandomCardDashboard;
