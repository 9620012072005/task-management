import React, { useEffect, useState } from "react";
import { Avatar, AvatarGroup, Box, Typography } from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { db } from "./Firebase-Config"; // Firebase config
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { Timestamp } from "firebase/firestore"; // Timestamp for Firebase date handling
import "./App.css";

const C1 = () => {
  const { id, projectId } = useParams(); // Destructure `id` and `projectId` from URL parameters
  const [tasks, setTasks] = useState([]); // Store task data
  const [users, setUsers] = useState([]); // Store user data
  const [uniquestagees, setUniquestagees] = useState([]); // Store unique stages
  const [loading, setLoading] = useState(true); // Handle loading state

  // Fetch users from Firebase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList); // Set users in state
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []); // Fetch users on component mount

  // Fetch tasks from Firebase in real-time with onSnapshot
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "companies", id, "projects", projectId, "tasks"),
      (snapshot) => {
        const fetchedData = snapshot.docs.map((doc) => {
          const { assignedTo, stage, task, createdOn, deadlineFrom, deadlineTo, customer } = doc.data();

          // Resolve assignedTo avatars with users data
          const assignedUsers = assignedTo?.map((assignedUserName) => {
            const matchedUser = users.find((user) => user.name === assignedUserName);
            return matchedUser ? { ...matchedUser, avatarUrl: matchedUser.avatarURL } : null;
          }).filter(Boolean); // Remove null values if the user is not found

          return {
            assignedTo: assignedUsers,
            stage,
            task,
            customer,
            createdOn: createdOn instanceof Timestamp ? createdOn.toDate() : new Date(createdOn),
            deadlineFrom: deadlineFrom instanceof Timestamp ? deadlineFrom.toDate() : new Date(deadlineFrom),
            deadlineTo: deadlineTo instanceof Timestamp ? deadlineTo.toDate() : new Date(deadlineTo),
          };
        });

        setTasks(fetchedData); // Set the fetched tasks in state

        // Get unique stages for task stages
        const stagees = [...new Set(fetchedData.map(item => item.stage))];
        setUniquestagees(stagees);
        setLoading(false); // Data has been fetched
      }
    );
    return () => unsubscribe(); // Clean up on unmount
  }, [id, projectId, users]); // Fetch tasks when `id`, `projectId` or `users` changes

  const getStageCounts = (assignee) => {
    const counts = {};
    uniquestagees.forEach((stage) => (counts[stage] = 0));
    tasks.forEach((item) => {
      if (item.assignedTo?.some(user => user.name === assignee)) {
        counts[item.stage] = (counts[item.stage] || 0) + 1;
      }
    });
    return counts;
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <div className="space-y-5 lg:w-[45%] pt-3 pb-4 mx-4">
      <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
        {/* Default box that displays even when no tasks are present */}
        {tasks.length === 0 ? (
          <div
            className="flex flex-col sm:flex-row items-center justify-center bg-white p-4 rounded-lg shadow-md w-full"
            style={{ minHeight: "150px" }}
          >
            <Typography
              variant="body1"
              className="text-gray-500 font-semibold"
            >
              No tasks available
            </Typography>
          </div>
        ) : (
          tasks.map((task, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg mt-4 shadow-md w-full lg:p-4 lg:rounded-md lg:mt-2 lg:shadow-sm"
            >
              {/* Task Name */}
              <div className="flex items-center space-x-4 w-full sm:w-1/4 md:w-1/3 lg:w-1/4">
                <Typography
                  variant="body1"
                  className="font-semibold text-md sm:text-lg lg:text-sm pr-8"
                >
                  {task.task}
                </Typography>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center justify-center w-full sm:w-1/4 md:w-1/3 lg:w-1/4">
                <Box
                  sx={{
                    width: "60%",
                    height: 8,
                    background: "linear-gradient(90deg, #00bfae 0%, #00d4ff 50%, #ff7b7b 100%)",
                    borderRadius: 5,
                  }}
                />
              </div>

              {/* Task Stage */}
              <div className="flex items-center justify-center w-full sm:w-1/4 md:w-1/3 lg:w-1/4">
                <Typography
                  variant="body2"
                  className="text-gray-500 text-sm lg:text-xs pr-10"
                >
                  {task.stage}
                </Typography>
              </div>

              {/* Assigned Users */}
              <div className="flex items-center justify-center w-full sm:w-1/4 md:w-1/3 lg:w-1/4 mt-2 sm:mt-0">
                <AvatarGroup max={2} className="sm:flex-row sm:space-x-2">
                  {task.assignedTo?.map((user, i) => (
                    <Avatar
                      key={i}
                      src={user.avatarUrl || ""} // Use avatarUrl if available
                      alt={`Avatar ${i + 1}`}
                      sx={{ width: 30, height: 30 }}
                      className="sm:w-10 sm:h-10"
                    />
                  ))}
                </AvatarGroup>
                <MoreVert />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default C1;
