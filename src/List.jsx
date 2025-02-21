import React, { useState, useEffect } from "react";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { styled } from "@mui/material/styles";
import { Star, StarBorder, AccessTime } from "@mui/icons-material";
import { Circle, Error, Cancel, Check } from "@mui/icons-material";
import { collection, onSnapshot, doc, setDoc, addDoc, Timestamp } from "firebase/firestore";
import { db } from "./Firebase-Config";
import { format } from "date-fns";
import { useParams } from "react-router-dom";
import { TwitterPicker } from "react-color";
// Styled Components
const AccordionRoot = styled(Accordion)(({ theme }) => ({
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  transition: "background-color 0.3s ease",
  "&:hover": {
    backgroundColor: theme.palette.grey[100],
  },
}));

const AccordionSummaryStyled = styled(AccordionSummary)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: "#0B3B59",
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  "&:hover": {
    backgroundColor: "#115D8C",
  },
}));

const TaskCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
  marginBottom: theme.spacing(2),
  transition: "transform 0.2s",
  "&:hover": {
    transform: "scale(1.01)",
  },
}));

// Function to check if a task overlaps based on assignees and their deadlines
// Function to check if a task overlaps based on assignees and their deadlines
const isDuplicate = (newTask, tasks, currentTaskId) => {
  for (let task of tasks) {
    // Skip the check if the task being edited is the same as the current task
    if (task.id === currentTaskId) {
      continue;
    }

    const isAssigneeOverlapping = task.assignedTo.some((assignee) =>
      newTask.assignedTo.includes(assignee) &&
      ((newTask.deadlineFrom <= task.deadlineTo && newTask.deadlineTo >= task.deadlineFrom) ||
      (newTask.deadlineFrom >= task.deadlineFrom && newTask.deadlineTo <= task.deadlineTo))
    );
    
    if (isAssigneeOverlapping) {
      return task; // Return the conflicting task if found
    }
  }
  return null; // No overlap found
};



const Task = ({ task, tasks }) => {
  const {
  
    assignedTo = [],
    task: title = "No Title",
    customer = "",
    createdOn = new Date(),
    deadlineFrom = "",
    deadlineTo = "",
    priority = false,
    stage = "Unassigned",
    status = "",
  } = task;

  const [isStarred, setIsStarred] = useState(priority);
  const [assignedToState, setAssignedToState] = useState(Array.isArray(assignedTo) ? assignedTo : []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customerState, setCustomerState] = useState(customer);
  const [deadlineFromState, setDeadlineFromState] = useState(deadlineFrom);
  const [deadlineToState, setDeadlineToState] = useState(deadlineTo);
  const [assignees, setAssignees] = useState([]);
  const [newAssignee, setNewAssignee] = useState("");
  const [showNewAssigneeInput, setShowNewAssigneeInput] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const {id, projectId } = useParams();
  const [color, setColor] = useState(task.color || "#FFFFFF");
  const handleChangeComplete = async (color) => {
    setColor(color.hex); // Update the color state

    try {
      // Update the color in Firestore for the current task
      await setDoc(
        doc(db, 'companies', id, 'projects',projectId,'tasks',task.id),
        { color: color.hex }, // Update only the color field
        { merge: true } // Merge to avoid overwriting other fields
      );
    } catch (error) {
      console.error("Error updating color:", error);
    }
  };
  const formatDateTime = (timestamp) => {
    const parsedDate = new Date(timestamp);
    return !isNaN(parsedDate.getTime()) ? format(parsedDate, "MM/dd/yyyy hh:mm a") : "No date selected";
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
        return <Circle sx={{ color: "#F2F2F2" }} />;
    }
  };

  const handleStarClick = async () => {
    setIsStarred((prev) => !prev);
    const taskRef = doc(db, 'companies',id, 'projects',projectId,'tasks', id);
    await setDoc(taskRef, { priority: !isStarred }, { merge: true });
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleAssignedToChange = (e, newValue) => {
    setAssignedToState(newValue); // Update the assignee list
  };

  const handleDeadlineFromChange = (e) => {
    setDeadlineFromState(e.target.value);
  };

  const handleDeadlineToChange = (e) => {
    setDeadlineToState(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      const assignedToNames = Array.isArray(assignedToState) ? assignedToState.map((user) => typeof user === "string" ? user : user.name) : [];
      
      const newTask = {
        assignedTo: assignedToNames,
        customer: customerState,
        deadlineFrom: new Date(deadlineFromState),
        deadlineTo: new Date(deadlineToState),
      };
  
      // Check for duplicates based on assigned users and deadlines
      const conflictingTask = isDuplicate(newTask, tasks, id); // Pass current task ID to bypass check for the task itself
      
      if (conflictingTask) {
        const existingTaskTitle = conflictingTask.task || "No title";
        const existingAssignees = conflictingTask.assignedTo.join(", ");
        const existingDeadlineFrom = formatDateTime(conflictingTask.deadlineFrom);
        const existingDeadlineTo = formatDateTime(conflictingTask.deadlineTo);
        
        // Dynamic alert message
        alert(`Task overlaps with an existing assignee's task during the same time frame.
        \nExisting Task: ${existingTaskTitle}
        \nAssignee(s): ${existingAssignees}
        \nDeadline: ${existingDeadlineFrom} - ${existingDeadlineTo}`);
        
        return;
      }
  
      // Proceed to save the task
      await setDoc(doc(db, 'companies', id, 'projects',projectId,'tasks', id), {
        assignedTo: assignedToNames,
        customer: customerState,
        deadlineFrom: Timestamp.fromDate(new Date(deadlineFromState)),
        deadlineTo: Timestamp.fromDate(new Date(deadlineToState)),
      }, { merge: true });
      handleDialogClose();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };
  
  

  const handleAddAssignee = async () => {
    if (newAssignee.trim()) {
      const userRef = collection(db, "assignee");
      await addDoc(userRef, { name: newAssignee.trim() });
      setShowNewAssigneeInput(false);
      setNewAssignee("");
    }
  };

  const handleOpenStatusMenu = (event) => {
    setAnchorEl(event.currentTarget); // Set the anchorEl to the current target (menu button)
  };

  const handleCloseStatusMenu = (statusOption) => {
    setAnchorEl(null); // Close the menu
    if (statusOption) {
      const taskRef = doc(db, 'companies', id, 'projects',projectId,'tasks', id);
      setDoc(taskRef, { status: statusOption }, { merge: true });
    }
  };

  useEffect(() => {
    // Fetching assignees list from the Firestore
    const unsubscribe = onSnapshot(collection(db, "assignee"), (snapshot) => {
      setAssignees(snapshot.docs.map((doc) => doc.data().name));
    });

    return () => unsubscribe();
  }, []);

  return (
<TaskCard style={{ border: `4px solid ${color}` }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" >
        
        <Box flexGrow={1}>
          <Typography variant="h6" style={{ fontWeight: "600" }}>
            {title}
          </Typography>
          <Box display="flex" alignItems="center">
            {Array.isArray(assignedToState) && assignedToState.length > 0 && (
              <Typography variant="caption" color="textSecondary" marginRight="20px">
                Assigned to: {assignedToState.join(", ")}
              </Typography>
            )}
            <Typography variant="caption" color="textSecondary" marginRight="20px">
              {customerState && `Customer: ${customerState}`}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {formatDateTime(deadlineFromState)} - {formatDateTime(deadlineToState)}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
        <TwitterPicker
          margin="15px"
          color={color}
          onChangeComplete={handleChangeComplete}
        />
          <Tooltip title={"Priority: High"} arrow>
            <IconButton size="small" onClick={handleStarClick}>
              {isStarred ? <Star sx={{ color: "gold" }} fontSize="small" /> : <StarBorder fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title={"Schedule"} arrow>
            <AccessTime fontSize="small" color="disabled" onClick={handleDialogOpen} />
          </Tooltip>
          <Avatar sx={{ bgcolor: "#f44336", width: 28, height: 28, fontSize: "small", marginLeft: "6px" }}>
            {assignedToState[0] ? assignedToState[0].charAt(0).toUpperCase() : ""}
          </Avatar>
          <div>
            <Tooltip title="Change Status" arrow>
              <IconButton onClick={handleOpenStatusMenu}>
                {getStatusIcon(status)}
              </IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => handleCloseStatusMenu(null)}>
              {["In Progress", "Changes Requested", "Approved", "Cancelled", "Done"].map((statusOption) => (
                <MenuItem key={statusOption} onClick={() => handleCloseStatusMenu(statusOption)}>
                  <ListItemIcon>{getStatusIcon(statusOption)}</ListItemIcon>
                  {statusOption}
                </MenuItem>
              ))}
            </Menu>

          </div>
        </Box>
      </Box>

      {/* Task Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Task Details</DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple
            value={Array.isArray(assignedToState) ? assignedToState : []}
            onChange={handleAssignedToChange}
            options={Array.isArray(assignees) ? assignees : []}
            renderInput={(params) => <TextField {...params} label="Assigned To" fullWidth />}
            freeSolo
          />

          <Button fullWidth onClick={() => setShowNewAssigneeInput(true)} variant="outlined" color="primary">
            + Add New Assignee
          </Button>

          {showNewAssigneeInput && (
            <Box display="flex" justifyContent="space-between" marginTop={2}>
              <TextField value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} label="New User" fullWidth />
              <Button onClick={handleAddAssignee} variant="contained" color="primary">+</Button>
            </Box>
          )}

          <TextField
            label="Customer Name"
            value={customerState}
            onChange={(e) => setCustomerState(e.target.value)}
            fullWidth
            margin="normal"
          />

          <TextField
            type="datetime-local"
            label="Deadline From"
            value={deadlineFromState}
            onChange={handleDeadlineFromChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            margin="normal"
          />

          <TextField
            type="datetime-local"
            label="Deadline To"
            value={deadlineToState}
            onChange={handleDeadlineToChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="error" variant="outlined">Cancel</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </TaskCard>
  );
};

const TaskList = () => {
  const [columns, setColumns] = useState([
    { id: "unstarted", title: "UNSTARTED" },
    { id: "begin", title: "BEGIN" },
    { id: "intermediate", title: "INTERMEDIATE" },
    { id: "completed", title: "COMPLETED" },
  ]);
  const [tasks, setTasks] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const {id, projectId } = useParams();
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'companies', id, 'projects',projectId,'tasks'), (snapshot) => {
      const taskData = snapshot.docs.map((doc) => {
        const task = doc.data();
        const formattedTask = {
          id: doc.id,
          ...task,
          createdOn:
            task.createdOn instanceof Timestamp
              ? task.createdOn.toDate()
              : new Date(task.createdOn),
          deadlineFrom:
            task.deadlineFrom instanceof Timestamp
              ? task.deadlineFrom.toDate()
              : new Date(task.deadlineFrom),
          deadlineTo:
            task.deadlineTo instanceof Timestamp
              ? task.deadlineTo.toDate()
              : new Date(task.deadlineTo),
        };

        return formattedTask;
      });

      setTasks(taskData);

      setAssignees((prevAssignees) =>
        prevAssignees.map((assignee) => {
          const taskWithDeadline = taskData.find((task) =>
            task.assignedTo.includes(assignee.name) && task.deadlineTo
          );
          if (taskWithDeadline) {
            assignee.deadlineFrom = taskWithDeadline.deadlineFrom instanceof Timestamp
              ? taskWithDeadline.deadlineFrom.toDate()
              : taskWithDeadline.deadlineFrom;
            assignee.deadlineTo = taskWithDeadline.deadlineTo instanceof Timestamp
              ? taskWithDeadline.deadlineTo.toDate()
              : taskWithDeadline.deadlineTo;
          }
          return assignee;
        })
      );
    });

    return () => unsubscribe();
  }, []);

  return (
    <Box padding={3} bgcolor="" borderRadius="1rem" boxShadow={2}>
      {columns.map((column) => (
        <AccordionRoot key={column.id}>
          <AccordionSummaryStyled expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}>
            <Typography variant="subtitle1" style={{ color: "#fff" }}>{column.title}</Typography>
            <Typography variant="caption" style={{ color: "#fff" }}>
              ({tasks.filter((task) => task.stage === column.id).length})
            </Typography>
          </AccordionSummaryStyled>
          <AccordionDetails>
            {tasks
              .filter((task) => task.stage === column.id)
              .map((task) => (
                <Task key={task.id} task={task} tasks={tasks} />
              ))}
          </AccordionDetails>
    
        </AccordionRoot>
      ))}
    </Box>
  );
};

export default TaskList;  