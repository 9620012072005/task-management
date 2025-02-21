import React, { useState, useEffect } from "react";
import {
  Button,
  Box,
  Typography,
  TextField,
  Paper,
  IconButton,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  ListItemIcon,
} from "@mui/material";
import {
  StarBorder,
  Star,
  Delete,
  AccessTime,
  Cancel,
  Error,
  Check,
  Circle,
} from "@mui/icons-material";
import { useDrag, useDrop } from "react-dnd";
import { db } from "./Firebase-Config"; // Adjust the import path as needed
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { TwitterPicker } from "react-color";
import { useParams } from "react-router-dom";
const Kanban = () => {
  const [columns, setColumns] = useState([
    { id: "unstarted", title: "UNSTARTED" },
    { id: "begin", title: "BEGIN" },
    { id: "intermediate", title: "INTERMEDIATE" },
    { id: "completed", title: "COMPLETED" },
  ]);
  const [newTasks, setNewTasks] = useState({});
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const {id, projectId } = useParams();
  // Fetch users (assignees) from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "assignee"), (snapshot) => {
      const assignees = snapshot.docs.map((doc) => doc.data().name);
      setUsers(assignees);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'companies', id, 'projects',projectId,'tasks'), (snapshot) => {
      setTasks(
        snapshot.docs.map((doc) => {
          const taskData = doc.data();
          return {
            id: doc.id,
            ...taskData,
            color: taskData.color || "#FFFFFF", 
            createdOn:
              taskData.createdOn instanceof Timestamp
                ? taskData.createdOn.toDate()
                : new Date(taskData.createdOn),
            deadlineFrom:
              taskData.deadlineFrom instanceof Timestamp
                ? taskData.deadlineFrom.toDate()
                : new Date(taskData.deadlineFrom),
            deadlineTo:
              taskData.deadlineTo instanceof Timestamp
                ? taskData.deadlineTo.toDate()
                : new Date(taskData.deadlineTo),
          };
        })
      );
    });

    return () => unsubscribe();
  }, []);

  const handleAddTask = async (stage) => {
    const taskText = newTasks[stage]?.trim();
    if (!taskText) return; // If no task text, don't add the task

    setLoading(true);
    const taskData = {
      assignedTo: [],
      customer: "",
      createdOn: new Date(),
      task: taskText,
      stage,
      priority: false,
      status: "",
      color: "",
      deadlineFrom: null,
      deadlineTo: null,
    };

    setTasks((prevTasks) => [...prevTasks, taskData]);

    try {
      await setDoc(doc(collection(db, "tasks")), taskData);
      setNewTasks((prev) => ({ ...prev, [stage]: "" }));
    } catch (error) {
      console.error("Error adding task:", error);

      setTasks((prevTasks) =>
        prevTasks.filter((task) => task.task !== taskText)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTaskDrop = async (taskId, newStage) => {
    try {
      await setDoc(
        doc(db, 'companies', id, 'projects',projectId,'tasks',taskId),
        { stage: newStage },
        { merge: true }
      );
    } catch (error) {
      console.error("Error moving task:", error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'companies',id, 'projects',projectId,'tasks',taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <div style={{ background: "#f4f6f8", height: "100vh" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          padding: "4px",
        }}
      >
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            newTaskValue={newTasks[column.id] || ""}
            onInputChange={(e) =>
              setNewTasks((prev) => ({ ...prev, [column.id]: e.target.value }))
            }
            onAddTask={() => handleAddTask(column.id)}
            onTaskDrop={handleTaskDrop}
            onDeleteTask={handleDeleteTask}
            loading={loading}
            taskCount={tasks.filter((task) => task.stage === column.id).length}
            tasks={tasks}
            users={users}
          />
        ))}
      </div>
    </div>
  );
};

const Column = ({
  column,
  newTaskValue,
  onInputChange,
  onAddTask,
  onTaskDrop,
  onDeleteTask,
  loading,
  taskCount,
  tasks,
  users,
}) => {
  const [{ isOver }, dropRef] = useDrop({
    accept: "task",
    drop: (item) => onTaskDrop(item.id, column.id),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  return (
    <Box
      ref={dropRef}
      p={2}
      width="20%"
      height="100vh"
      display="flex"
      flexDirection="column"
      style={{
        minWidth: "250px",
        backgroundColor: isOver ? "#e0f7fa" : "#f4f6f8",
        borderRadius: "8px",
      }}
    >
      <Typography
        variant="h6"
        mb={1}
        style={{ textAlign: "center", fontWeight: "bold" }}
      >
        {column.title}
      </Typography>
      <Typography
        variant="caption"
        style={{ textAlign: "center", marginBottom: "8px" }}
      >
        {taskCount} task{taskCount !== 1 && "s"}
      </Typography>
      <Box display="flex" mt={1}>
        <TextField
          value={newTaskValue}
          onChange={onInputChange}
          placeholder="Add task"
          variant="outlined"
          size="small"
          fullWidth
        />
        <Button
          onClick={onAddTask}
          variant="contained"
          sx={{ ml: 1, background: "#0B3B59" }}
          disabled={loading}
        >
          {loading ? "Adding..." : "Add"}
        </Button>
      </Box>
      <Box mt={2} style={{ flexGrow: 1, overflowY: "auto" }}>
        <TasksList
          stage={column.id}
          tasks={tasks}
          onTaskDrop={onTaskDrop}
          onDeleteTask={onDeleteTask}
          users={users}
        />
      </Box>
    </Box>
  );
};

const TasksList = ({ stage, tasks, onTaskDrop, onDeleteTask, users }) => {
  const filteredTasks = tasks.filter((task) => task.stage === stage);

  return (
    <Box mt={2}>
      {filteredTasks.length > 0 ? (
        filteredTasks.map((task) => (
          <DraggableTask
            key={task.id}
            task={task}
            onTaskDrop={onTaskDrop}
            onDeleteTask={onDeleteTask}
            users={users}
            tasks={tasks}

          />
        ))
      ) : (
        <Typography
          variant="body2"
          color="textSecondary"
          style={{ textAlign: "center", marginTop: "10px" }}
        >
          No tasks available.
        </Typography>
      )}
    </Box>
  );
};

const DraggableTask = ({ task, onTaskDrop, onDeleteTask, users, tasks }) => {
  const [isStarred, setIsStarred] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignedTo, setAssignedTo] = useState(task.assignedTo || []);
  const [customer, setCustomerName] = useState(task.customer || "");
  const [deadlineFrom, setDeadlineFrom] = useState(task.deadlineFrom || "");
  const [deadlineTo, setDeadlineTo] = useState(task.deadlineTo || "");
  const [anchorEl, setAnchorEl] = useState(null);
  const [color, setColor] = useState(task.color || "#FFFFFF");
  const handleDialogClose = () => setDialogOpen(false);
  const {companyId, projectId } = useParams();
  const handleChangeComplete = async (color) => {
    setColor(color.hex); // Update the color state

    try {
      // Update the color in Firestore for the current task
      await setDoc(
        doc(db, 'companies', companyId, 'projects',projectId,'tasks',task.id),
        { color: color.hex }, // Update only the color field
        { merge: true } // Merge to avoid overwriting other fields
      );
    } catch (error) {
      console.error("Error updating color:", error);
    }
  };

  const [{ isDragging }, drag] = useDrag({
    type: "task",
    item: { id: task.id, stage: task.stage },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = async (newStatus) => {
    setStatus(newStatus);
    setAnchorEl(null);
    await setDoc(
      doc(db, 'companies', companyId, 'projects',projectId,'tasks',task.id),
      { status: newStatus },
      { merge: true }
    );
  };

  const handleStarClick = async () => {
    const newPriority = !isStarred;
    setIsStarred(newPriority); 

    await setDoc(
      doc(db, 'companies', companyId, 'projects',projectId,'tasks',task.id),
      { priority: newPriority },
      { merge: true }
    );
  };

  const handleSubmit = async () => {
    try {
      const assignedToNames = Array.isArray(assignedTo)
        ? assignedTo.map((user) =>
            typeof user === "string" ? user : user.name
          )
        : [];
  
      const newTask = {
        assignedTo: assignedToNames,
        customer: customer,
        deadlineFrom: new Date(deadlineFrom),
        deadlineTo: new Date(deadlineTo),
      };
  
      // Check for duplicates based on assigned users and deadlines
      const conflictingTask = isDuplicate(newTask, tasks, task.id); // Pass the current task ID
  
      if (conflictingTask) {
        const existingTaskTitle = conflictingTask.task || "No title";
        const existingAssignees = conflictingTask.assignedTo.join(", ");
        const existingDeadlineFrom = formatDateTime(
          conflictingTask.deadlineFrom
        );
        const existingDeadlineTo = formatDateTime(conflictingTask.deadlineTo);
  
        // Dynamic alert message
        alert(`Task overlaps with an existing assignee's task during the same time frame.
          \nExisting Task: ${existingTaskTitle}
          \nAssignee(s): ${existingAssignees}
          \nDeadline: ${existingDeadlineFrom} - ${existingDeadlineTo}`);
  
        return; // Stop submission if there's a conflict
      }
  
      // If no conflict, update Firestore with the new task details
      await setDoc(
        doc(db, 'companies', companyId, 'projects',projectId,'tasks',task.id),
        {
          assignedTo: assignedToNames,
          customer: customer,
          deadlineFrom: deadlineFrom,
          deadlineTo: deadlineTo,
        },
        { merge: true }
      );
  
      handleDialogClose();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case "In Progress":
        return <Circle sx={{ color: "#F2F2F2" }} />;
      case "Changes Requested":
        return <Error sx={{ color: "orange" }} />;
      case "Approved":
        return <Circle sx={{ color: "green" }} />;
      case "Cancelled":
        return <Cancel color="error" />;
      case "Done":
        return <Check sx={{ color: "#008000" }} />;
      default:
        return <Circle color="disabled" />;
    }
  };
 
  return (
    <Paper
      ref={drag}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: "10px", // slightly rounded edges for a modern look
        backgroundColor: color || "#FFFFFF", // Dynamically set the background color
        opacity: isDragging ? 0.7 : 1,
        cursor: isDragging ? "grabbing" : "pointer",
        transition: "all 0.3s ease", // smooth transitions
      }}
    >
      <Paper
        ref={drag}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: "10px", // slightly rounded edges for a modern look
          backgroundColor: "#FFFFFF",
          opacity: isDragging ? 0.7 : 1,
          cursor: isDragging ? "grabbing" : "pointer",
          transition: "all 0.3s ease", // smooth transitions
        }}
      >
        {/* Header Section - Task Name and Priority */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
            {task.task}
          </Typography>

          {/* Priority Button */}
          <Tooltip title={"Priority: High"} arrow>
            <IconButton size="small" onClick={handleStarClick}>
              {isStarred ? (
                <Star sx={{ color: "gold" }} fontSize="small" />
              ) : (
                <StarBorder fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          {/* Status Dropdown */}
          <Tooltip title="Change Status" arrow>
            <IconButton onClick={handleClick}>
              {getStatusIcon(status)}
            </IconButton>
          </Tooltip>

          {/* Delete Task Button */}
          <Tooltip title="Delete Task" arrow>
            <IconButton edge="end" onClick={() => onDeleteTask(task.id)}>
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Status Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => handleClose("")}
        >
          {[
            "In Progress",
            "Changes Requested",
            "Approved",
            "Cancelled",
            "Done",
          ].map((statusOption) => (
            <MenuItem
              key={statusOption}
              onClick={() => handleClose(statusOption)}
            >
              <ListItemIcon>{getStatusIcon(statusOption)}</ListItemIcon>
              {statusOption}
            </MenuItem>
          ))}
        </Menu>

        {/* Assigned To Avatar */}
        <Box display="flex" alignItems="center" mt={1}>
          <Tooltip title={assignedTo} arrow>
            <Avatar
              sx={{
                bgcolor: "#f44336",
                width: 30,
                height: 30,
                fontSize: "14px",
                marginLeft: "8px",
              }}
            >
              {assignedTo[0] ? assignedTo[0].charAt(0).toUpperCase() : ""}
            </Avatar>
          </Tooltip>
        </Box>

        {/* Deadline and Edit Button */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          my={2}
        >
          <Typography variant="body2" color="textSecondary">
            {formatDateTime(task.deadlineFrom)} -{" "}
            {formatDateTime(task.deadlineTo)}
          </Typography>

          
        </Box>

        <Box 
         display="flex"
         justifyContent="space-between"
         alignItems="center"
         my={2}
         >
        <TwitterPicker
          marginTop="15px"
          color={color}
          onChangeComplete={handleChangeComplete}
        />
        <Tooltip title="Edit Task Time">
            <IconButton onClick={() => setDialogOpen(true)} size="small">
            <AccessTime fontSize="large" />
            </IconButton>
          </Tooltip>
        </Box>
    
        {/* Edit Task Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogContent>
            <TextField
              label="Task Name"
              fullWidth
              value={task.task}
              onChange={(e) => (task.task = e.target.value)}
              sx={{ my: 2 }}
            />
            <Autocomplete
              multiple
              options={users}
              value={assignedTo}
              onChange={(_, newValue) => setAssignedTo(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Assignees" />
              )}
            />
            <TextField
              label="Customer"
              fullWidth
              value={customer}
              onChange={(e) => setCustomerName(e.target.value)}
              sx={{ my: 2 }}
            />
            <TextField
              label="Deadline From"
              type="datetime-local"
              fullWidth
              value={deadlineFrom}
              onChange={(e) => setDeadlineFrom(e.target.value)}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Deadline To"
              type="datetime-local"
              fullWidth
              value={deadlineTo}
              onChange={(e) => setDeadlineTo(e.target.value)}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDialogOpen(false)}
              variant="outlined"
              color="error"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Paper>
  );
};

const formatDateTime = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(date));
};

const isDuplicate = (newTask, tasks, taskId) => {
  for (let task of tasks) {
    // Skip the current task if its ID matches the one being edited
    if (task.id === taskId) {
      continue;
    }

    const isAssigneeOverlapping = task.assignedTo.some(
      (assignee) =>
        newTask.assignedTo.includes(assignee) &&
        ((newTask.deadlineFrom <= task.deadlineTo &&
          newTask.deadlineTo >= task.deadlineFrom) ||
          (newTask.deadlineFrom >= task.deadlineFrom &&
            newTask.deadlineTo <= task.deadlineTo))
    );

    if (isAssigneeOverlapping) {
      return task; // Return the conflicting task if found
    }
  }
  return null; // No overlap found
};


export default Kanban;
