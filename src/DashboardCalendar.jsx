import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Avatar,
  Typography,
  Divider,
  AvatarGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaTimes, FaClipboardList } from 'react-icons/fa';
import { db } from './Firebase-Config'; // Import your Firebase configuration
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import "./App.css"

// Styled Components
const Container = styled.div`
  padding: 20px;
`;

// Calendar Component
const Calendar = () => {
  const { id, projectId } = useParams(); // Ensure companyId is passed
  const [currentDate, setCurrentDate] = useState(new Date()); // State to store current date
  const [tasks, setTasks] = useState([]); // State to store tasks
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [users, setUsers] = useState([]); // State to store users
  const [loading, setLoading] = useState(true); // Loading state

  // Function to get formatted date in YYYY-MM-DD format
  const getFormattedDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch users from Firebase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Fetch tasks for the selected date
  useEffect(() => {
    if (loading || !id || !projectId) return; // Wait until users are loaded

    const formattedDate = getFormattedDate(currentDate);
    const tasksCollection = collection(
      db,
      'companies',
      id,
      'projects',
      projectId,
      'tasks'
    );

    // Define start and end of the day
    const startOfDay = new Date(formattedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(formattedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const tasksQuery = query(
      tasksCollection,
      where('createdOn', '>=', Timestamp.fromDate(startOfDay)),
      where('createdOn', '<=', Timestamp.fromDate(endOfDay))
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const fetchedTasks = snapshot.docs.map((doc) => {
          const taskData = doc.data();

          // Resolve assignedTo and completedBy avatars
          if (taskData.assignedTo) {
            taskData.assignedTo = taskData.assignedTo.map((assignedUser) => {
              const matchedUser = users.find((user) => user.name === assignedUser);
              return matchedUser
                ? { name: assignedUser, avatarUrl: matchedUser.avatarURL }
                : { name: assignedUser, avatarUrl: null };
            });
          }

          if (taskData.completedBy) {
            taskData.completedBy = taskData.completedBy.map((completedUser) => {
              const matchedUser = users.find((user) => user.name === completedUser);
              return matchedUser
                ? { name: completedUser, avatarUrl: matchedUser.avatarURL }
                : { name: completedUser, avatarUrl: null };
            });
          }

          return { id: doc.id, ...taskData };
        });

        setTasks(fetchedTasks);
      },
      (error) => {
        console.error('Error fetching tasks: ', error);
      }
    );

    return () => {
      unsubscribe(); // Cleanup listener
    };
  }, [currentDate, users, loading, id, projectId]);

  // Function to change the current date (prev/next)
  const changeDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  // Handle task click to open dialog
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTask(null);
  };

  // Format today's date and get the previous and next day
  const currentMonth = currentDate.toLocaleString('default', { month: 'short' });
  const currentDay = currentDate.getDate();

  // Calculate previous and next day
  const prevDay = new Date(currentDate);
  prevDay.setDate(currentDate.getDate() - 1);

  const nextDay = new Date(currentDate);
  nextDay.setDate(currentDate.getDate() + 1);

  const prevMonth = prevDay.toLocaleString('default', { month: 'short' });
  const nextMonth = nextDay.toLocaleString('default', { month: 'short' });
const stageColors = {
  unstarted: "#f44336", // Red
  begin: "#2196f3", // Blue
  intermediate: "#ff9800", // Orange
  completed: "#4caf50", // Green
};

return (
  <CalendarContainer className="px-4 mr-7 sm:px-4 lg:px-8">
    {/* Header with current month and day */}
    <header className="bg-gradient-to-r from-teal-300 via-green-200 to-yellow-100 p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center">
        {/* Left Arrow Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => changeDay(-1)}
            className="transition-transform transform hover:scale-110 p-2 rounded-full bg-gray-800 hover:bg-gray-600 mb-2"
          >
            <FaArrowLeft className="text-white" />
          </button>
          {/* Previous Date with Transparency */}
          <div className="text-xl text-gray-500 opacity-60">
            {`${prevMonth} ${prevDay.getDate()}`}
          </div>
        </div>

        {/* Month & Day Container */}
        <div className="text-center flex flex-col items-center">
          <div
            className="text-3xl font-semibold text-gray-800 tracking-wide leading-tight"
            style={{ transition: "all 0.3s ease" }}
          >
            {currentMonth} {currentDay}
          </div>
        </div>

        {/* Right Arrow Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => changeDay(1)}
            className="transition-transform transform hover:scale-110 p-2 rounded-full bg-gray-800 hover:bg-gray-600 mb-2"
          >
            <FaArrowRight className="text-white" />
          </button>
          {/* Next Date with Transparency */}
          <div className="text-xl text-gray-500 opacity-60">
            {`${nextMonth} ${nextDay.getDate()}`}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="my-4 border-gray-300" />

      {/* Color Dots Container */}
      
      
    </header>

    {/* Task List with Vertical Bar Labels */}
    <TaskList className="max-h-[190px] overflow-y-auto custom-scrollbar p-2 sm:p-4">
      {tasks.length === 0 ? (
        <NoTasksMessage>No tasks available on this date</NoTasksMessage>
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            onClick={() => handleTaskClick(task)}
            className="flex gap-4 items-center"
          >
            {/* Vertical Bar */}
            <ColorLabelContainer
              stage={task.stage}
              className="w-1"
              style={{ backgroundColor: stageColors[task.stage] }}
            />

            {/* Task Details */}
            <TaskDetails className="flex-grow flex items-center justify-between">
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
            </TaskDetails>

            {/* Task Name and Assigned Info */}
            <TaskTextContainer className="flex-grow">
              <Typography variant="body2" fontWeight="bold">
                {task.task}
              </Typography>
              <Typography variant="caption">
                {task.stage === "completed"
                  ? `Completed by: ${task.assignedTo
                      .map((user) => user.name)
                      .join(", ")}`
                  : `Assigned to: ${task.assignedTo
                      .map((user) => user.name)
                      .join(", ")}`}
              </Typography>
            </TaskTextContainer>

            {/* Stage Icon */}
            <StageIcon>
              {task.stage === "unstarted" && (
                <FaTimes color={stageColors["unstarted"]} />
              )}
              {task.stage === "begin" && (
                <FaArrowRight color={stageColors["begin"]} />
              )}
              {task.stage === "intermediate" && (
                <FaClipboardList color={stageColors["intermediate"]} />
              )}
              {task.stage === "completed" && (
                <FaCheckCircle color={stageColors["completed"]} />
              )}
            </StageIcon>
          </TaskCard>
        ))
      )}
    </TaskList>

    {/* Dialog Modal */}
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle>
        <DialogCloseButton onClick={handleCloseDialog}>
          <FaTimes size={20} />
        </DialogCloseButton>
        {selectedTask && <Typography variant="h6">{selectedTask.task}</Typography>}
      </DialogTitle>
      <DialogContent>
        {selectedTask && (
          <>
            <Typography variant="body1">
              <strong>Stage:</strong> {selectedTask.stage}
            </Typography>
            <Typography variant="body2">
              <strong>Assigned to:</strong>{" "}
              {selectedTask.assignedTo.map((user) => user.name).join(", ")}
            </Typography>
            <AvatarGroup max={2} className="sm:flex-row sm:space-x-2">
              {selectedTask.assignedTo?.map((user, i) => (
                <Avatar
                  key={i}
                  src={user.avatarUrl || ""} // Use avatarUrl if available
                  alt={`Avatar ${i + 1}`}
                  sx={{ width: 30, height: 30 }}
                  className="sm:w-10 sm:h-10"
                />
              ))}
            </AvatarGroup>
          </>
        )}
      </DialogContent>
    </Dialog>
  </CalendarContainer>
);

}  
const ColorLabelContainer = styled.div`
  width: 3px;
  height: 100%;
  background-color: ${({ stage }) =>
    stage === 'unstarted' ? '#f44336' :
    stage === 'begin' ? 'blue' :
    stage === 'intermediate' ? '#ff9800' :
    stage === 'completed' ? '#4caf50' : 'transparent'};
  border-radius: 2px;
  position: absolute;
  margin-right: 10px;
  left: 0;
  top: 0;
`;

const CalendarContainer = styled.div`
  width: 100%; /* Default width (small screens) */
  max-width: 100%; /* Ensure full width on smaller screens */
 
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-top: 10px;

  /* Adjust width for laptop view (1024px to 1280px) */
  @media (min-width: 1024px) and (max-width: 1280px) {
    width: 75%; /* Set width to 75% on laptop-sized screens */
  }

  /* Full width for desktop (1280px and larger screens) */
  @media (min-width: 1280px) {
    width: 100%; /* Full width for larger desktop screens */
  }
`;

  const Header = styled.div`
    margin-bottom: 30px;
  `;
  
  const DateNavigation = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  
  const MonthDayContainer = styled.div`
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    .gradient-text {
      background: linear-gradient(135deg, #ff7e5f, #feb47b);
      -webkit-background-clip: text;
      color: transparent;
    }
  `;
  
  const ColorDotsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
`;
  const StageDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${(props) => {
    switch (props.stage) {
      case 'unstarted':
        return '#f44336'; // red
      case 'begin':
        return 'blue'; // blue
      case 'intermediate':
        return '#ff9800'; // orange
      case 'completed':
        return '#4caf50'; // green
      default:
        return '#3EACF6'; // default blue
    }
  }};
`;
const StageLabel = styled.span`
  font-size: 12px;
  color: #333;
  margin-left: 8px;
  margin-right: 16px;
  display: flex;
  align-items: center;
`;
  const TaskList = styled.div`
    display: flex;
    flex-direction: column;
  `;
  const NoTasksMessage = styled.div`
  text-align: center;
  font-size: 18px;
  color: #888;
  margin-top: 20px;
`;

const TaskCard = styled.div`
position: relative;
display: flex;
align-items: center;
padding: 10px;
margin: 10px 0;
border: 1px solid #e0e0e0;
border-radius: 8px;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
background-color: #fff;
cursor: pointer;
transition: transform 0.2s;

&:hover {
      transform: scale(1.05);
    }
`;

  const TaskStageBar = styled.div`
    width: 10px;
    background-color: ${(props) => {
      switch (props.stage) {
        case 'assigned':
          return '#ff9800'; // orange
        case 'completed':
          return '#4caf50'; // green
        case 'unstarted':
          return '#f44336'; // red
          case 'begin':
            return 'blue'; // red
            case 'intermediate':
            return '#ff9800'; // red
        default:
          return '#3EACF6'; // blue
      }
    }};
    border-radius: 5px;
  `;
  
  const TaskDetails = styled.div`
    display: flex;
    flex-direction: column;
    margin-left: 15px;
  `;
  
  const TaskTextContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-grow: 1; /* Ensures this container takes up the remaining space */
  `;
  
  const TaskText = styled.div`
    font-size: 14px;
    font-weight: 500;
    margin-top: 5px;
  `;
  
  const StageIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px; /* Adjust the size of the icons */
  margin-left: 8px;
`;

  
  const DialogCloseButton = styled(IconButton)`
    position: absolute;
    top: 10px;
    right: 10px;
    color: gray;
  `;
  
  const ProfileDetails = styled.div`
    display: flex;
    margin-bottom: 15px;
  `;
  
  const ProfileImage = styled.img`
    width: 40px;
    height: 40px;
    border-radius: 50%;
  `;
  
  const ProfileInfo = styled.div`
    margin-left: 10px;
  `;
  
  export default Calendar;
  