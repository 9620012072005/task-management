import React, { useState, useEffect } from "react";
import { CheckCircle, Settings, RemoveCircleOutline } from "@mui/icons-material";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./Firebase-Config"; // Firebase config file
import { useParams } from "react-router-dom";
import AddTask from "./AddTask";
import ProgressCircle from "./ProgressCircle";
import Calendar from "./DashboardCalendar";
import TaskSummaryGraph from "./Graph";
import C1 from "./C1";
import C2 from "./C2";
import { AvatarGroup, Avatar } from "@mui/material"; // Avatar components

import AddForm from "./AddForm";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

const TaskDashboard = () => {
  const { id, projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Fetch tasks from Firebase
  const fetchTasks = async () => {
    try {
      if (!id || !projectId) {
        console.error("Missing company ID or project ID");
        return;
      }

      const tasksCollection = collection(db, "companies", id, "projects", projectId, "tasks");
      const taskSnapshot = await getDocs(tasksCollection);
      const fetchedTasks = taskSnapshot.docs.map((doc) => {
        const data = doc.data();
        const progress =
          data.stage === "unstarted"
            ? 0
            : data.stage === "begin"
            ? 10
            : data.stage === "intermediate"
            ? 70
            : data.stage === "completed"
            ? 100
            : 0;

        return {
          id: doc.id,
          name: data.task || "No Task Name", // Fallback for missing task name
          assignees: Array.isArray(data.assignedTo) ? data.assignedTo : [],
          progress,
          status: data.stage || "Not Started", // Default to "Not Started"
        };
      });

      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Fetch users from Firebase
  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [id, projectId]);

  const getProgressColor = (progress) => {
    if (progress === 100) return "bg-gradient-to-r from-green-400 to-green-600";
    if (progress >= 60) return "bg-gradient-to-r from-yellow-400 to-yellow-600";
    return "bg-gradient-to-r from-red-400 to-red-600";
  };

  const getStatusIcon = (status) => {
    if (status === "completed") {
      return <CheckCircle className="absolute top-4 right-4 text-green-500 w-6 h-6" />;
    }
    if (status === "begin" || status === "intermediate") {
      return <Settings className="absolute top-4 right-4 text-yellow-500 w-6 h-6 animate-spin" />;
    }
    return <RemoveCircleOutline className="absolute top-4 right-4 text-gray-500 w-6 h-6" />;
  };

  const handleShowDetails = (task) => {
    setSelectedTask(task);
  };

  const handleShowProfileModal = (users) => {
    setSelectedUsers(users);
    setIsProfileModalOpen(true);
  };
 
  return (
    <div className="lg:flex w-full">
      <div className="lg:flex">
        
        <div className="flex flex-col w-full lg:flex-row h-screen bg-gray-100">
         

          {/* Main Content */}
          <div className="flex-1 ">
            {/* Top Bar */}
            <div className="lg:flex justify-between items-center ">
              <h2 className="text-3xl font-bold px-2 ">Task Management</h2>
              <div className="flex items-center space-x-4 px-2 py-2 ">
                {/* Add Task Button */}
                <button
                  onClick={() => setIsAddFormOpen(true)} // Open AddForm when clicked
                  className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 shadow-sm text-white px-4 py-2 rounded  "
                >
                  Add Task
                </button>
                
                <input
                  type="search"
                  placeholder="Search tasks"
                  className="px-4 py-2 border border-gray-300 rounded"
                />
               
                    {isAddFormOpen && (
              <AddForm 
              
                isOpen={isAddFormOpen} 
                closeModal={() => setIsAddFormOpen(false)} // Close the form when triggered
              />
                    )}
                  
              </div>
            </div>
            <AddTask />
  
            <div className="max-w-[950px] w-full -z-50">

              <Swiper
             
                slidesPerView={3}
                spaceBetween={5}
                loop={true}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: false,
                }}
                breakpoints={{
                  350: { slidesPerView: 1 },
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
                modules={[Autoplay]}
              >
                {tasks.map((task) => (
                  <SwiperSlide key={task.id} >
                    <div className="bg-white p-4 rounded-lg shadow-lg transition transform hover:scale-105 relative mx-3">
                      {/* Status Icon */}
                      {getStatusIcon(task.status)}
  
                      <div className="flex items-center mb-4 ">
                        <div className="flex -space-x-4">
                        {task.assignees.slice(0, 3).map((assignee, index) => {
  const matchedUser = users.find(user => user.name === assignee);
  return matchedUser ? (
    <Avatar
      key={index}
      src={matchedUser.avatarURL || ""}
      alt={matchedUser.name}
      sx={{ width: 30, height: 30 }}
      className="sm:w-10 sm:h-10"
    />
  ) : (
    <div key={index} className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold border-2 border-white">
      {assignee.substring(0, 1).toUpperCase()}
    </div>
  );
})}

                        </div>
                        <div className="ml-4">
                          <p className="font-semibold">
                            Assignees:{" "}
                            {task.assignees[0]}
                            {task.assignees.length > 1 && " ..."}
                          </p>
                          <p className="text-sm text-gray-500">{task.status}</p>
                        </div>
                      </div>
  
                      <h3 className="text-xl font-semibold mb-4">{task.name}</h3>
  
                      <div className="mb-4">
                        <div className="relative pt-1 mb-4">
                          <div className="flex mb-2 items-center justify-between">
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-100">
                              Progress
                            </span>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-100">
                              {task.progress}%
                            </span>
                          </div>
                          <div className="relative w-full">
                            <div
                              className={`${getProgressColor(task.progress)} h-2 rounded-full`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
  
                      <div className="flex justify-between items-center mt-4">
                        <button
                          className="bg-gradient-to-r from-green-400 to-green-600 text-white py-1 px-4 rounded-lg"
                          onClick={() => handleShowDetails(task)}
                        >
                          Details
                        </button>
                        <span className="text-gray-500 text-xs">{task.status}</span>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
  
            <div className="flex flex-col lg:flex-row">
              <C1 />
              <C2 />
            </div>
          </div>
  
          <div className="pt-8">
            <ProgressCircle />
            <Calendar />
            <TaskSummaryGraph />
          </div>
        </div>
  
        {/* Task Details Modal */}
        {selectedTask && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 max-w-lg mx-auto">
              <h3 className="text-2xl font-semibold mb-4">{selectedTask.name}</h3>
              <p>
                <strong>Status:</strong> {selectedTask.status}
              </p>
              <p>
                <strong>Progress:</strong> {selectedTask.progress}%
              </p>
              <p>
                <strong>Assigned to:</strong> {selectedTask.assignees.join(", ")}
              </p>
  
              {/* Task Actions (Edit/Delete) */}
              <div className="mt-4 flex justify-between"></div>
              
              {/* Profile Modal */}
              {isProfileModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                  <div className="bg-white p-8 rounded-lg shadow-lg w-1/3">
                    <h3 className="text-2xl font-semibold mb-4">Assignee Details</h3>
                    <div className="flex items-center space-x-4">
                      {selectedUsers.map((user, index) => (
                        <div key={index} className="flex items-center mb-4">
                          <AvatarGroup max={2} className="sm:flex-row sm:space-x-2">
                {task.assignedTo?.map((user, i) => (
                  <Avatar
                    key={i}
                    src={user.avatarUrl || ""}  // Use avatarUrl if available
                    alt={`Avatar ${i + 1}`}
                    sx={{ width: 30, height: 30 }}
                    className="sm:w-10 sm:h-10"
                  />
                ))}
              </AvatarGroup>
                          <div>
                            <p className="font-semibold">{user.assignedTo}</p>
                            <p className="text-sm">{user.phone}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      className="bg-red-500 text-white py-1 px-4 rounded-lg mt-4"
                      onClick={() => handleShowProfileModal(task.assignees)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
  
              {/* Close Button */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  }
  
  export default TaskDashboard;