import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./Firebase-Config"; // Your Firebase config
import { useParams } from "react-router-dom";

const LineChartWithGradient = () => {
  const { id, projectId } = useParams();
  const [isMobile, setIsMobile] = useState(false);
  const [isLaptop, setIsLaptop] = useState(false);
  const [tasksData, setTasksData] = useState([]); // Fetched tasks data
  const [tooltip, setTooltip] = useState(null); // Tooltip data

  // Check screen width for responsiveness
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024); // Mobile if screen <= lg
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize); // Cleanup
  }, []);

  // Fetch tasks from Firebase
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

      const querySnapshot = await getDocs(tasksCollection);
      const tasks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTasksData(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Process tasks data and group by date
  const getDailyTaskPercentages = () => {
    const taskCountByDate = {};

    tasksData.forEach((task) => {
      const createdOn = task.createdOn?.toDate?.();
      if (createdOn) {
        const date = createdOn.toLocaleDateString("en-GB"); // Format: dd/mm/yyyy
        taskCountByDate[date] = (taskCountByDate[date] || 0) + 1;
      }
    });

    const totalTasks = tasksData.length;
    return Object.keys(taskCountByDate).map((date) => ({
      date,
      percentage: (taskCountByDate[date] / totalTasks) * 100,
    }));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (tasksData.length > 0) {
      const canvas = document.getElementById("lineChartCanvas");
      const ctx = canvas.getContext("2d");

      const dailyPercentages = getDailyTaskPercentages();
      const labels = dailyPercentages.map((item) => item.date);
      const workProgressData = dailyPercentages.map((item) => item.percentage);

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const margin = 45;
      const maxY = 100;

      const gradient = ctx.createLinearGradient(
        0,
        canvasHeight - margin,
        0,
        margin
      );
      gradient.addColorStop(0, "rgba(250, 139, 172, 0.4)");
      gradient.addColorStop(1, "rgba(250, 139, 172, 0)");

      const drawGradientFilledArea = (data, progress) => {
        ctx.beginPath();
        ctx.moveTo(margin, canvasHeight - margin);

        const endIndex = Math.floor(progress * data.length);
        data.slice(0, endIndex).forEach((value, index) => {
          const x =
            margin +
            (index * (canvasWidth - 2 * margin)) / (data.length - 1);
          const y =
            canvasHeight - margin - (value / maxY) * (canvasHeight - 2 * margin);
          ctx.lineTo(x, y);
        });

        ctx.lineTo(canvasWidth - margin, canvasHeight - margin);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
      };

      const drawLine = (data, progress) => {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#FA8BAC";
        ctx.beginPath();

        const endIndex = Math.floor(progress * data.length);
        data.slice(0, endIndex).forEach((value, index) => {
          const x =
            margin +
            (index * (canvasWidth - 2 * margin)) / (data.length - 1);
          const y =
            canvasHeight - margin - (value / maxY) * (canvasHeight - 2 * margin);
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevX =
              margin +
              ((index - 1) * (canvasWidth - 2 * margin)) / (data.length - 1);
            const prevY =
              canvasHeight - margin - (data[index - 1] / maxY) * (canvasHeight - 2 * margin);

            const controlPointX1 = (prevX + x) / 2;
            const controlPointY1 = prevY;
            const controlPointX2 = (prevX + x) / 2;
            const controlPointY2 = y;
            ctx.bezierCurveTo(
              controlPointX1,
              controlPointY1,
              controlPointX2,
              controlPointY2,
              x,
              y
            );
          }
        });
        ctx.stroke();
      };

      const drawGrid = () => {
        ctx.strokeStyle = "#ddd";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(margin, canvasHeight - margin);
        ctx.lineTo(margin, margin);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(margin, canvasHeight - margin);
        ctx.lineTo(canvasWidth - margin, canvasHeight - margin);
        ctx.stroke();

        ctx.beginPath();
        for (let i = 0; i <= maxY; i += maxY / 5) {
          const y =
            canvasHeight - margin - (i / maxY) * (canvasHeight - 2 * margin);
          ctx.moveTo(margin, y);
          ctx.lineTo(canvasWidth - margin, y);
        }
        ctx.stroke();

        ctx.fillStyle = "#333";
        ctx.font = "12px Arial";
        for (let i = 0; i <= maxY; i += maxY / 5) {
          const y =
            canvasHeight - margin - (i / maxY) * (canvasHeight - 2 * margin);
          ctx.fillText(`${i}%`, margin - 30, y + 4);
        }

        ctx.fillStyle = "#333";
        ctx.font = "12px Arial";
        for (let i = 0; i < labels.length; i++) {
          const x =
            margin + (i * (canvasWidth - 2 * margin)) / (labels.length - 1);
          ctx.fillText(labels[i], x - 15, canvasHeight - margin + 20);
        }
      };

      let animationProgress = 0;
      const animate = () => {
        animationProgress += 0.01;
        if (animationProgress > 1) animationProgress = 1;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        drawGrid();
        drawGradientFilledArea(workProgressData, animationProgress);
        drawLine(workProgressData, animationProgress);

        if (animationProgress < 1) requestAnimationFrame(animate);
      };

      animate();

      // Mouse move event for tooltips
      const handleMouseMove = (event) => {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        const closestDataPoint = workProgressData.reduce((closest, current, index) => {
          const x =
            margin + (index * (canvasWidth - 2 * margin)) / (labels.length - 1);
          const y =
            canvasHeight -
            margin -
            (current / maxY) * (canvasHeight - 2 * margin);

          const distance = Math.sqrt(
            Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2)
          );

          return distance < closest.distance
            ? { distance, index, x, y, date: labels[index], percentage: current }
            : closest;
        }, { distance: Infinity });

        if (closestDataPoint.distance < 10) {
          setTooltip({
            x: closestDataPoint.x,
            y: closestDataPoint.y,
            date: closestDataPoint.date,
            percentage: closestDataPoint.percentage,
          });
        } else {
          setTooltip(null);
        }
      };

      canvas.addEventListener("mousemove", handleMouseMove);

      return () => {
        canvas.removeEventListener("mousemove", handleMouseMove); // Cleanup event listener
        ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Cleanup canvas
      };
    }
  }, [tasksData]);

  return (
    <div className="relative">
    <div className="line-chart-container bg-white rounded-lg shadow-lg border-r-2 mt-4 px-5 pt-4 pb-4">
      <canvas
      
        id="lineChartCanvas"
        width={isMobile ? 300 : 350}
        height={isLaptop ? 400 : 310}
      />
      {tooltip && (
        <div
          className="tooltip"
          style={{
            position: "absolute",
            left: tooltip.x - 50,
            top: tooltip.y - 10,
            background: "#FA8BAC",
            padding: "5px",
            borderRadius: "4px",
            color: "#fff",
            fontSize: "12px",
            pointerEvents: "none",
          }}
        >
          <div>Date: {tooltip.date}</div>
          <div>Completion: {tooltip.percentage.toFixed(2)}%</div>
        </div>
      )}
    </div>
    </div>
  );
};

export default LineChartWithGradient;
