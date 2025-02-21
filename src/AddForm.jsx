import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Dialog } from '@headlessui/react';
import { db } from './Firebase-Config';
import { addDoc, collection, Timestamp, onSnapshot,doc } from 'firebase/firestore';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import { SketchPicker, TwitterPicker } from 'react-color';
import { useParams } from 'react-router-dom';

// Keyframe for fade-in animation
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Styled components for modal layout
const Modal = styled(Dialog.Panel)`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0px 12px 24px rgba(0, 0, 0, 0.2);
  padding: 25px;
  max-width: 450px;
  width: 100%;
  animation: ${fadeIn} 0.3s ease;
  position: relative;
`;

const Title = styled.h2`
  font-size: 1.75em;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ddd;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #007bff;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ddd;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #007bff;
  }
`;

const Button = styled.button`
  background-color: #007bff;
  color: #ffffff;
  padding: 12px 18px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  margin-top: 20px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;

const SuccessText = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #28a745;
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const ErrorText = styled.div`
  color: red;
  text-align: center;
  margin-bottom: 10px;
`;
const AddForm = ({ isOpen, closeModal }) => {
  const { id, projectId } = useParams();
  const [task, setTask] = useState('');
  const [stage, setStage] = useState('unstarted');
  const [assignedTo, setAssignedTo] = useState([]); // This holds selected assignees
  const [customer, setCustomer] = useState('');
  const [deadlineFromDate, setDeadlineFromDate] = useState('');
  const [deadlineFromTime, setDeadlineFromTime] = useState('');
  const [deadlineToDate, setDeadlineToDate] = useState('');
  const [deadlineToTime, setDeadlineToTime] = useState('');
  const [assignees, setAssignees] = useState([]); // For storing assignee data
  const [users, setUsers] = useState([]); // For storing users from projects
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [newAssigneeName, setNewAssigneeName] = useState('');
  const [assignedProject, setAssignedProject] = useState(null); // Store project dates
  const [projectDocRef, setProjectDocRef] = useState(null);

  const handleColorChange = (color) => {
    setColor(color.hex);
    setIsColorPickerOpen(false);
  };

  useEffect(() => {
    const companyDocRef = doc(db, 'companies', id, 'projects', projectId,);
    const unsubscribeProject = onSnapshot(companyDocRef, (docSnapshot) => {
      const projectData = docSnapshot.data();
      const usersList = projectData?.users || [];
      setUsers(usersList); // Set the users state with the fetched users
    });

    const unsubscribeProjectDetails = onSnapshot(doc(db, 'companies', id, 'projects', projectId), (docSnap) => {
      if (docSnap.exists()) {
        const projectData = docSnap.data();
        setAssignedProject({
          From: new Date(projectData.fromDate),
          To: new Date(projectData.toDate),
        });
      }
    });

    return () => {
      unsubscribeProject();
      unsubscribeProjectDetails();
    };
  }, [id, projectId]);

  useEffect(() => {
    const unsubscribeTasks = onSnapshot(collection(db, 'companies', id, 'projects', projectId, 'tasks'), (snapshot) => {
      const taskData = snapshot.docs.map((doc) => doc.data());
      setAssignees((prevAssignees) => {
        return prevAssignees.map((assignee) => {
          const taskWithDeadline = taskData.find(
            (task) => task.assignedTo.includes(assignee.name) && task.deadlineTo
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
        });
      });
    });

    return () => unsubscribeTasks();
  }, [id, projectId]);

  const checkAssigneeDeadline = (selectedAssignees, newDeadlineFrom, newDeadlineTo, assignedProject) => {
    let conflictMessage = '';

    if (!assignedProject || !assignedProject.From || !assignedProject.To) {
      setErrorMessage("Project does not have valid date range.");
      return true;
    }

    const projectFromDate = assignedProject.From;
    const projectToDate = assignedProject.To;

    if (newDeadlineFrom < projectFromDate || newDeadlineTo > projectToDate) {
      setErrorMessage(`Task deadline must be within the project's date range (from ${projectFromDate.toLocaleString()} to ${projectToDate.toLocaleString()}).`);
      return true;
    }

    for (let assignee of selectedAssignees) {
      const assignedTask = assignees.find((task) => task.name === assignee.name);

      if (assignedTask && assignedTask.deadlineFrom && assignedTask.deadlineTo) {
        const existingDeadlineFrom = new Date(assignedTask.deadlineFrom);
        const existingDeadlineTo = new Date(assignedTask.deadlineTo);

        if (
          (newDeadlineFrom >= existingDeadlineFrom && newDeadlineFrom <= existingDeadlineTo) ||
          (newDeadlineTo >= existingDeadlineFrom && newDeadlineTo <= existingDeadlineTo) ||
          (newDeadlineFrom <= existingDeadlineFrom && newDeadlineTo >= existingDeadlineTo)
        ) {
          conflictMessage = `${assignee.name} is already scheduled in a task with a deadline from ${existingDeadlineFrom.toLocaleString()} to ${existingDeadlineTo.toLocaleString()}. Your new schedule (from ${newDeadlineFrom.toLocaleString()} to ${newDeadlineTo.toLocaleString()}) conflicts with the existing task.`;
          break;
        }
      }
    }

    if (conflictMessage) {
      setErrorMessage(conflictMessage);
      return true;
    }

    setErrorMessage('');
    return false;
  };

  const handleAddAssignee = async () => {
    if (!newAssigneeName.trim()) {
      setErrorMessage('Assignee name cannot be empty.');
      return;
    }

    try {
      const newAssignee = {
        name: newAssigneeName.trim(),
        deadlineFrom: null,
        deadlineTo: null,
      };

      const assigneeRef = await addDoc(collection(db, 'assignee'), newAssignee);
      setNewAssigneeName('');
      setIsAssigneeModalOpen(false);
      setAssignees((prevAssignees) => [
        ...prevAssignees,
        { ...newAssignee, id: assigneeRef.id },
      ]);
    } catch (error) {
      console.error('Error adding assignee:', error);
      setErrorMessage('Error adding assignee, please try again.');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
  
    // Ensure required fields are not empty or undefined
    if (assignedTo.length === 0) {
      setErrorMessage('Please select at least one assignee.');
      return;
    }
  
    const deadlineFrom = new Date(`${deadlineFromDate}T${deadlineFromTime}`);
    if (isNaN(deadlineFrom)) {
      setErrorMessage('Invalid "From" date or time.');
      return;
    }
  
    const deadlineTo = new Date(`${deadlineToDate}T${deadlineToTime}`);
    if (isNaN(deadlineTo)) {
      setErrorMessage('Invalid "To" date or time.');
      return;
    }
  
    if (deadlineTo < deadlineFrom) {
      setErrorMessage('"To" deadline cannot be before the "From" deadline.');
      return;
    }
  
    if (!assignedProject) {
      setErrorMessage('No valid project found.');
      return;
    }
  
    const isConflict = checkAssigneeDeadline(assignedTo, deadlineFrom, deadlineTo, assignedProject);
    if (isConflict) return;
  
    // Log the data being sent to Firestore for debugging
    console.log({
      task,
      stage,
      assignedTo: assignedTo.map((user) => user.name || user), // Store only selected assignees
      customer,
      deadlineFrom: Timestamp.fromDate(deadlineFrom),
      deadlineTo: Timestamp.fromDate(deadlineTo),
      createdOn: Timestamp.now(),
      color,
    });
  
    // Ensure all fields are defined before sending to Firestore
    try {
      const taskRef = await addDoc(collection(db, 'companies', id, 'projects', projectId, 'tasks'), {
        task: task || '', // Default to empty string if task is undefined
        stage: stage || 'unstarted', // Default to 'unstarted' if stage is undefined
        assignedTo: assignedTo.map((user) => user.name || user), // Store only selected assignees here
        customer: customer || '', // Default to empty string if customer is undefined
        deadlineFrom: Timestamp.fromDate(deadlineFrom),
        deadlineTo: Timestamp.fromDate(deadlineTo),
        createdOn: Timestamp.now(),
        color: color || '#ffffff', // Default to white if color is undefined
      });
  
      setSuccessMessage(true);
      resetForm();
    } catch (error) {
      console.error('Error adding task:', error);
      setErrorMessage('Error adding task, please try again.');
    }
  };
  
  const handleAssigneeSelection = (selectedUsers) => {
    setAssignedTo(selectedUsers); // Store selected users only
  };
  
  const resetForm = () => {
    setTask('');
    setStage('unstarted');
    setAssignedTo([]);
    setCustomer('');
    setDeadlineFromDate('');
    setDeadlineFromTime('');
    setDeadlineToDate('');
    setDeadlineToTime('');
    setErrorMessage('');
  };

  return (
    <>
      <Dialog open={isOpen} onClose={closeModal}>
        <div className="fixed inset-0 bg-black/30 " aria-hidden="true"></div>
        <div className="fixed inset-0 flex items-center justify-center p-4 z-30">
        <div
      className="relative w-[33%] max-h-[90vh] bg-white rounded-lg shadow-lg overflow-y-auto"
      style={{
        scrollbarWidth: "none", // Hide scrollbar for Firefox
        msOverflowStyle: "none", // Hide scrollbar for IE/Edge
      }}
    >
          <Modal>
            <Title>Add New Task</Title>
            {successMessage && (
              <SuccessText>
                <CheckCircleIcon style={{ width: '20px', height: '20px' }} />
                Task successfully added!
              </SuccessText>
            )}
            {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
            <form onSubmit={handleAddTask}>
              <FormGroup>
                <Label>Task</Label>
                <Input
                  type="text"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Stage</Label>
                <Select value={stage} onChange={(e) => setStage(e.target.value)} required>
                  <option value="unstarted">Unstarted</option>
                  <option value="begin">Begin</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="completed">Completed</option>
                </Select>
              </FormGroup>
              <FormGroup>
  <Label>Assigned To</Label>
  <Autocomplete
    multiple
    options={users} // List of users fetched from Firestore
    value={assignedTo} // State to manage selected assignees
    onChange={(event, newValue) => {
      // Update state with selected assignees only
      const selectedAssignees = newValue.map((assignee) => assignee.id || assignee);

      // Set the state to reflect only selected assignees
      setAssignedTo(selectedAssignees);

      // Save selected assignees to the database
      saveSelectedAssignees(selectedAssignees);
    }}
    getOptionLabel={(option) => option.name || option} // Display name of the user in dropdown
    isOptionEqualToValue={(option, value) => option.id === value} // Prevent default selection of all options
    renderInput={(params) => (
      <TextField {...params} label="Select Assignees" variant="outlined" />
    )}
    renderTags={(value, getTagProps) =>
      value.map((id, index) => {
        const user = users.find((u) => u.id === id); // Find the user details for the chip
        return (
          <Chip
            key={index}
            label={user?.name || id} // Display name or id
            {...getTagProps({ index })}
            style={{ margin: 2 }}
          />
        );
      })
    }
    renderOption={(props, option) => (
      <li {...props} key={option.id || option}>
        {option.name || option}
      </li>
    )}
  />
</FormGroup>



              <FormGroup>
                <Label>Customer</Label>
                <Input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>From Date and Time</Label>
                <Input
                  type="datetime-local"
                  value={deadlineFromDate && deadlineFromTime ? `${deadlineFromDate}T${deadlineFromTime}` : ''}
                  onChange={(e) => {
                    const [date, time] = e.target.value.split('T');
                    setDeadlineFromDate(date);
                    setDeadlineFromTime(time);
                  }}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>To Date and Time</Label>
                <Input
                  type="datetime-local"
                  value={deadlineToDate && deadlineToTime ? `${deadlineToDate}T${deadlineToTime}` : ''}
                  onChange={(e) => {
                    const [date, time] = e.target.value.split('T');
                    setDeadlineToDate(date);
                    setDeadlineToTime(time);
                  }}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Select Task Color</Label>
                <Button type="button" onClick={() => setIsColorPickerOpen(true)}>
                  Select Color
                </Button>
              </FormGroup>

              <Button type="submit">Add Task</Button>
            </form>
          </Modal>
        </div>
      </div>

      </Dialog>

      <Dialog open={isColorPickerOpen} onClose={() => setIsColorPickerOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true"></div>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Modal>
            <Title>Select Color</Title>
            <TwitterPicker color={color} onChange={handleColorChange} />
          </Modal>
        </div>
        
      </Dialog>

      <Dialog open={isAssigneeModalOpen} onClose={() => setIsAssigneeModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true"></div>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Modal>
          <div
      className="max-h-[80vh] overflow-y-auto"
      style={{
        scrollbarWidth: "none", // Hide scrollbar for Firefox
        msOverflowStyle: "none", // Hide scrollbar for IE/Edge
      }}
    >
            <Title>Add New Assignee</Title>
            {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
            <FormGroup>
              <Label>Assignee Name</Label>
              <Input
                type="text"
                value={newAssigneeName}
                onChange={(e) => setNewAssigneeName(e.target.value)}
                required
              />
            </FormGroup>
            <Button onClick={handleAddAssignee} style={{ marginTop: '10px' }}>
              Add Assignee
            </Button>
            </div>

          </Modal>
          
        </div>
        
      </Dialog>
    </>
    
  );
};

export default AddForm;
