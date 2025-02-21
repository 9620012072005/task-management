import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { onSnapshot, collection, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from './Firebase-Config'; 
import { ToggleButton, ToggleButtonGroup, TextField, Button, Dialog, DialogActions, DialogContent, DialogTitle, Autocomplete, Alert } from '@mui/material';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TwitterPicker } from 'react-color'; 
import { useParams } from 'react-router-dom';
const localizer = momentLocalizer(moment);

const TaskStatus = {
  UNSTARTED: 'unstarted',
  BEGIN: 'begin',
  INTERMEDIATE: 'intermediate',
  COMPLETED: 'completed',
  TEST: 'test',
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [task, setTask] = useState('');
  const [assignedTo, setAssignedTo] = useState([]);
  const [customer, setCustomer] = useState('');
  const [createdOn, setCreatedOn] = useState(null);
  const [deadlineFrom, setDeadlineFrom] = useState(null);
  const [deadlineTo, setDeadlineTo] = useState(null);
  const [stage, setStage] = useState(TaskStatus.UNSTARTED);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [assignedToOptions, setAssignedToOptions] = useState([]);
  const [alert, setAlert] = useState({ open: false, message: '' });
  const [taskColor, setTaskColor] = useState('#2196F3'); 
  const {id, projectId } = useParams();
  useEffect(() => {
    const unsubscribeTasks = onSnapshot(collection(db, 'companies',id, 'projects',projectId,'tasks'), (snapshot) => {
      const tasksArray = snapshot.docs.map(doc => {
        const data = doc.data();
        let start = data.deadlineFrom instanceof Timestamp ? data.deadlineFrom.toDate() : new Date(data.deadlineFrom);
        let end = data.deadlineTo instanceof Timestamp ? data.deadlineTo.toDate() : new Date(data.deadlineTo);
        
        return {
          id: doc.id,
          ...data,
          deadlineFrom: start,
          deadlineTo: end,
        };
      });
      setTasks(tasksArray);
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'assignee'), (snapshot) => {
      const usersArray = snapshot.docs.map(doc => doc.data().name);
      setAssignedToOptions(usersArray);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeUsers();
    };
  }, []);

  const events = tasks.map((task) => ({
    title: task.task,
    start: task.deadlineFrom || new Date(),
    end: task.deadlineTo || new Date(),
    tooltip: `Assigned to: ${task.assignedTo}\nCustomer: ${task.customer}\nStage: ${task.stage}`,
    id: task.id,
    status: task.stage,
    color: task.color || '#2196F3', 
  }));

  const handleSelectSlot = () => {
    clearForm();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
  
    const isDuplicate = tasks.some(existingTask => {
      const existingStart = new Date(existingTask.deadlineFrom);
      const existingEnd = new Date(existingTask.deadlineTo);
  
      return assignedTo.includes(existingTask.assignedTo) && (
        (deadlineFrom >= existingStart && deadlineFrom <= existingEnd) || 
        (deadlineTo >= existingStart && deadlineTo <= existingEnd) || 
        (deadlineFrom <= existingStart && deadlineTo >= existingEnd) 
      );
    });
  
    if (isDuplicate) {
      const conflictingTask = tasks.find(existingTask => assignedTo.includes(existingTask.assignedTo));
      const conflictingAssignee = conflictingTask ? conflictingTask.assignedTo : 'another assignee';
      const conflictingStart = conflictingTask ? conflictingTask.deadlineFrom.toString() : 'unknown start time';
      const conflictingEnd = conflictingTask ? conflictingTask.deadlineTo.toString() : 'unknown end time';
  
      setAlert({
        open: true,
        message: `The task overlaps with an existing task assigned to "${conflictingAssignee}" from ${conflictingStart} to ${conflictingEnd}.`,
      });
      return;
    }
  
    try {
      const createdOnTimestamp = Timestamp.now(); 
      const deadlineFromTimestamp = deadlineFrom ? Timestamp.fromDate(deadlineFrom) : null; 
      const deadlineToTimestamp = deadlineTo ? Timestamp.fromDate(deadlineTo) : null; 
  
      const assignedToArray = assignedTo; 
  
      if (editingTaskId) {
        const taskRef = doc(db, 'companies',id, 'projects',projectId,'tasks', editingTaskId);
        await updateDoc(taskRef, {
          task,
          assignedTo: assignedToString,
          customer,
          deadlineFrom: deadlineFromTimestamp,
          deadlineTo: deadlineToTimestamp,
          stage: stage || TaskStatus.UNSTARTED,
          color: taskColor, 
        });
      } else {
        await addDoc(collection(db, 'companies',id, 'projects',projectId,'tasks'), {
          task,
          assignedTo: assignedToArray,
          customer,
          createdOn: createdOnTimestamp,  
          deadlineFrom: deadlineFromTimestamp,
          deadlineTo: deadlineToTimestamp,
          stage: stage || TaskStatus.UNSTARTED,
          color: taskColor, 
        });
      }
  
      clearForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("An error occurred while saving the task. Please try again.");
    }
};
  
  const clearForm = () => {
    setTask('');
    setAssignedTo([]);
    setCustomer('');
    setDeadlineFrom(null);
    setDeadlineTo(null);
    setStage(TaskStatus.UNSTARTED);
    setEditingTaskId(null);
    setTaskColor('#2196F3'); 
    setAlert({ open: false, message: '' }); 
  };

  const handleEditTask = (event) => {
    setTask(event.title || '');
    setAssignedTo(event.assignedTo ? event.assignedTo.split(', ') : []);
    setCustomer(event.customer || '');
    setCreatedOn(event.createdOn ? event.createdOn.toDate() : new Date());
    setDeadlineFrom(event.deadlineFrom ? event.deadlineFrom.toDate() : new Date());
    setDeadlineTo(event.deadlineTo ? event.deadlineTo.toDate() : new Date());
    setStage(event.status || TaskStatus.UNSTARTED);
    setTaskColor(event.color || '#2196F3'); 
    setEditingTaskId(event.id);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error("Error deleting document: ", error);
      alert("An error occurred while deleting the task. Please try again.");
    }
  };

  const handleCloseAlert = () => {
    setAlert({ open: false, message: '' });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <div className="main-container">
        <h1 className="text-4xl text-center font-bold mb-10">Task Calendar</h1>
        <div className="calendar-layout">
          <div className="calendar-container">
            <Calendar
              localizer={localizer}
              events={events}
              style={{ height: 850, padding: '20px' }}
              views={['month', 'day', 'week']}
              defaultView="month"
              selectable
              onSelectSlot={handleSelectSlot}
              tooltipAccessor={event => event.tooltip}
              eventPropGetter={(event) => ({
                className: 'calendar-event',
                style: { backgroundColor: event.color }, 
              })}
              onSelectEvent={handleEditTask}
            />
          </div>
        </div>
        <DndProvider backend={HTML5Backend}>
          <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <DialogTitle  className="text-center text-black">{editingTaskId ? 'Edit Task' : 'Add a New Task'}</DialogTitle>
            <DialogContent>
              {alert.open && (
                <Alert severity="warning" onClose={handleCloseAlert}>
                  {alert.message}
                </Alert>
              )}
              <form onSubmit={handleSubmit}>
                <ToggleButtonGroup
                  value={stage}
                  exclusive
                  onChange={(e, newStage) => setStage(newStage)}
                  aria-label="Task Stage"
                   className="flex space-x-0 mt-3"
                >
                  <ToggleButton value={TaskStatus.UNSTARTED}>Unstarted</ToggleButton>
                  <ToggleButton value={TaskStatus.BEGIN}>Begin</ToggleButton>
                  <ToggleButton value={TaskStatus.INTERMEDIATE}>Intermediate</ToggleButton>
                  <ToggleButton value={TaskStatus.COMPLETED}>Completed</ToggleButton>
                  <ToggleButton value={TaskStatus.TEST}>Test</ToggleButton>
                </ToggleButtonGroup>

                <TextField 
                  fullWidth 
                  label="Title" 
                  value={task} 
                  onChange={(e) => setTask(e.target.value)} 
                  required 
                  margin="normal"
                />
                
                <Autocomplete
                  multiple
                  freeSolo
                  options={assignedToOptions}
                  value={assignedTo} 
                  onChange={(event, newValue) => {
                    setAssignedTo(newValue);
                    newValue.forEach(value => {
                      if (!assignedToOptions.includes(value)) {
                        setAssignedToOptions(prevOptions => [...prevOptions, value]);
                      }
                    });
                  }} 
                  renderInput={(params) => <TextField {...params} label="Assigned To" placeholder="Add assignee" />}
                  sx={{ width: '550px', marginBottom: '3px', marginTop: '10px' }}
                />
                <TextField 
                  fullWidth 
                  label="Customer" 
                  value={customer} 
                  onChange={(e) => setCustomer(e.target.value)} 
                  required 
                  margin="normal"
                />
                
                <div>
                  <DateTimePicker
                    sx={{ marginTop: '15px' }}
                    label="Start"
                    value={deadlineFrom ? moment(deadlineFrom) : null}
                    onChange={(newValue) => {
                      setDeadlineFrom(newValue ? newValue.toDate() : null);
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                    disablePast
                  />

                  <DateTimePicker
                    sx={{ marginTop: '15px', marginLeft: '7px' }}
                    label="End"
                    value={deadlineTo ? moment(deadlineTo) : null}
                    onChange={(newValue) => {
                      setDeadlineTo(newValue ? newValue.toDate() : null);
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                    disablePast
                  />
                </div>

                 {/* Color Picker */}
                 <div style={{ margin: '20px 0' }}>
                  <span>Pick a color:</span>
                  <TwitterPicker
                    className='mt-3'
                    color={taskColor}
                    onChangeComplete={(color) => setTaskColor(color.hex)}
                  />
                </div>

                <DialogActions>
                  <Button onClick={() => setIsModalOpen(false)}>Discard</Button>
                  <Button type="submit">{editingTaskId ? 'Update Task' : 'Add Task'}</Button>
                </DialogActions>
              </form>
            </DialogContent>
          </Dialog>
        </DndProvider>
      </div>
    </LocalizationProvider>
  );
}

export default App;