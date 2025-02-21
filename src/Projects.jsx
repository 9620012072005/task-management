import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { db, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from './Firebase-Config'; // Firebase functions
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Icons for Edit and Delete
import { useNavigate, useParams } from 'react-router-dom'; // Use navigate and params for routing
import { TextField, Autocomplete} from '@mui/material'; // Material UI components for autocomplete and chip

const ProjectList = () => {
  const { id } = useParams(); // Get company id from URL params
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({ name: '', fromDate: '', toDate: '', users: [] });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null); // Track the project being edited
  const [clickedProjectId, setClickedProjectId] = useState(null); // Track the clicked project card
  const navigate = useNavigate(); // Navigation hook
  const [users, setUsers] = useState([]); // Users for the project
  const [assignedTo, setAssignedTo] = useState([]); // This holds selected assignees
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);  // State for showing confirmation dialog
  const [projectIdToDelete, setProjectIdToDelete] = useState(null); 


  // Fetch users from the company's 'users' subcollection
  useEffect(() => {
    const companyDocRef = doc(db, 'companies', id); // Reference to a specific company by its ID
    const unsubscribeUsers = onSnapshot(companyDocRef, (docSnapshot) => {
      const companyData = docSnapshot.data(); // Get the company data from the snapshot
  
      // Assuming the 'users' field contains an array of user names or user objects
      const usersList = companyData?.users || []; // If users are present in the 'users' field, use them
  
      console.log("Fetched users:", usersList); // Log the fetched users to confirm
      setUsers(usersList); // Set the users state with the fetched users
    });
  
    return () => unsubscribeUsers(); // Clean up the listener on unmount
  }, [id]);

  // Fetch projects from the company's 'projects' subcollection
  useEffect(() => {
    const projectCollectionRef = collection(db, 'companies', id, 'projects');
    const unsubscribeProjects = onSnapshot(projectCollectionRef, (snapshot) => {
      const projectList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectList); // Populate projects state with fetched projects
    });

    return () => unsubscribeProjects(); // Clean up the listener on unmount
  }, [id]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission (Add or Update Project)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.fromDate || !formData.toDate) {
      alert('Please fill all fields');
      return;
    }

    const updatedFormData = {
      ...formData,
      users: assignedTo.map(user => user.id || user), // Ensure you're sending only the IDs or user reference
    };

    if (editId) {
      // Update existing project
      try {
        const projectRef = doc(db, 'companies', id, 'projects', editId);
        await updateDoc(projectRef, updatedFormData);
        alert('Project updated successfully');
      } catch (error) {
        console.error('Error updating project: ', error);
      }
    } else {
      // Add new project under the company subcollection
      try {
        await addDoc(collection(db, 'companies', id, 'projects'), updatedFormData);
        alert('Project added successfully');
      } catch (error) {
        console.error('Error adding project: ', error);
      }
    }

    // Reset form and close dialog
    setFormData({ name: '', fromDate: '', toDate: '', users: [] });
    setAssignedTo([]); // Clear selected users
    setIsDialogOpen(false);
    setEditId(null);
  };



  // Navigate to Menu page on project card click
  const handleCardClick = (projectId) => {
    navigate(`/menu/${id}/${projectId}`);
  };

  // Open the form for editing a project
  const handleEdit = (project) => {
    setFormData({
      name: project.name,
      fromDate: project.fromDate,
      toDate: project.toDate,
      users: project.users || [], // Load users if available
    });
    setAssignedTo(project.users || []); // Populate the selected users (if any)
    setEditId(project.id);
    setIsDialogOpen(true);
  };

  // Handle the change in user selection (for Autocomplete)
  const handleUserChange = (event, newValue) => {
    setAssignedTo(newValue);  // Update users array with selected user objects
  };
  const handleDeleteClick = (projectId) => {
    // Show confirmation dialog
    setProjectIdToDelete(projectId);
    setShowConfirmDialog(true);
  };
  const handleDelete = async (projectId) => {
    try {
      // Reference to the specific project
      const projectRef = doc(db, 'companies', id, 'projects', projectId);
      await deleteDoc(projectRef); // Delete the project directly from its reference
      alert('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project: ', error);
      alert('Failed to delete project, please try again.');
    } finally {
      // Hide the confirmation dialog after the deletion attempt
      setShowConfirmDialog(false);
    }
  };
  

    
  
  const handleCancelDelete = () => {
    // Close confirmation dialog without deleting
    setShowConfirmDialog(false);
  };
  return (
    <Container>
      <BackButton onClick={() => navigate(`/`)}>Back</BackButton>
      
      <ProjectCardsContainer className="mt-10"> <AddProjectButton onClick={() => setIsDialogOpen(true)}
           className="w-full h-24 sm:w-auto px-8 py-4 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white font-semibold rounded-lg shadow-lg hover:from-yellow-500 hover:to-red-500 transition-all duration-300 ease-in-out transform hover:scale-105">Add Project</AddProjectButton>
        {/* Displaying the list of projects */}
        {projects.map((project) => (
          <ProjectCard key={project.id} onClick={() => handleCardClick(project.id)}>
            <ProjectCardHeader>
              <h3>{project.name}</h3>
              <EditDeleteContainer>
                <EditButton onClick={(e) => { e.stopPropagation(); handleEdit(project); }}>
                  <FaEdit /> {/* Edit Icon */}
                </EditButton>
                <DeleteButton onClick={(e) => { 
                  e.stopPropagation(); 
                  handleDeleteClick(project.id); // Show confirmation dialog
                }}>
                  <FaTrashAlt />
                </DeleteButton>
              </EditDeleteContainer>
            </ProjectCardHeader>
            <ProjectCardDetails>
              <ChipContainer>
                <Chip>{`From: ${new Date(project.fromDate).toLocaleString()}`}</Chip>
                <Chip>{`To: ${new Date(project.toDate).toLocaleString()}`}</Chip>
              </ChipContainer>
            </ProjectCardDetails>
          </ProjectCard>
        ))}

        {/* Add Project Button */}
       
      </ProjectCardsContainer>
 {/* Confirmation Dialog */}
 {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <div className="text-xl font-semibold mb-4">Confirm Deletion</div>
            <p className="mb-6">Are you sure you want to delete this project? This action cannot be undone.</p>
            <div className="flex justify-between">
              <button 
               className="px-6 py-2 bg-gradient-to-r from-gray-50 via-white to-slate-300 text-black font-semibold rounded-lg shadow-md hover:from-yellow-500 hover:to-red-500 transition-all duration-300 ease-in-out mt-4"
                onClick={handleCancelDelete}>
                Cancel
              </button>
              <button 
                className="px-6 py-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white font-semibold rounded-lg shadow-md hover:from-yellow-500 hover:to-red-500 transition-all duration-300 ease-in-out mt-4"
                onClick={() => handleDelete(projectIdToDelete)}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Dialog for Adding or Editing Project */}
      {isDialogOpen && (
        <DialogOverlay>
          <DialogBox>
            <h3>{editId ? 'Edit Project' : 'Add New Project'}</h3>
            <Form onSubmit={handleSubmit}>
              <FormField>
                <label htmlFor="name">Project Name</label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter project name"
                  required
                />
              </FormField>
              <FormField>
                <label htmlFor="fromDate">From Date</label>
                <Input
                  type="datetime-local"
                  id="fromDate"
                  name="fromDate"
                  value={formData.fromDate}
                  onChange={handleChange}
                  required
                />
              </FormField>
              <FormField>
                <label htmlFor="toDate">To Date</label>
                <Input
                  type="datetime-local"
                  id="toDate"
                  name="toDate"
                  value={formData.toDate}
                  onChange={handleChange}
                  required
                />
              </FormField>

              <FormGroup>
                <Label>Users</Label>
                <Autocomplete
                  multiple
                  options={users} // List of users fetched from Firestore
                  value={assignedTo} // Binding the selected users (assignedTo state)
                  onChange={handleUserChange}
                  getOptionLabel={(option) => option.name || option} // Ensure this matches the structure of users
                  isOptionEqualToValue={(option, value) =>  option === value} // Ensure correct comparison between option and value
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Users"
                      variant="outlined"
                      fullWidth
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id || option.name}>
                      {option.name || option} {/* Display the user name or string */}
                    </li>
                  )}
                />
              </FormGroup>

              <SubmitButton type="submit"
               className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white font-semibold rounded-lg shadow-md hover:from-yellow-500 hover:to-red-500 transition-all duration-300 ease-in-out mt-4">{editId ? 'Update Project' : 'Add Project'}</SubmitButton>
            </Form>
            <CloseButton onClick={() => setIsDialogOpen(false)}>Close</CloseButton>
          </DialogBox>
        </DialogOverlay>
      )}
    </Container>
  );
};
// Styled-components for styling
const Container = styled.div`
  width: 80%;
  margin: 0 auto;
  padding: 20px;
`;
const BackButton = styled.button`
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 10px 20px;
  margin-top: 10px;
  cursor: pointer;
  &:hover {
    background-color: #ddd;
  }
`;

const AddProjectButton = styled.button`
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  cursor: pointer;
  margin-bottom: 20px;
  font-size: 16px;
  border-radius: 5px;

  &:hover {
    background-color: #45a049;
  }
`;

const ProjectCardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
  align-items: center;
`;

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const DialogBox = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  
  label {
    font-size: 16px;
    color: #333;
    margin-bottom: 5px;
  }

  input {
    padding: 10px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 5px;
    outline: none;

    &:focus {
      border-color: #4caf50;
    }
  }
`;

const Input = styled.input`
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 5px;
  outline: none;

  &:focus {
    border-color: #4caf50;
  }
`;

const SubmitButton = styled.button`
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  border-radius: 5px;

  &:hover {
    background-color: #45a049;
  }
`;

const ChipContainer = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
`;


const Chip = styled.div`
  background-color: #e0e0e0;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  color: #555;
`;
const userChip = styled.div`
  background-color: #e0e0e0;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  color: #555;
`;
const CloseButton = styled.button`
  padding: 5px 10px;
  background-color: #ccc;
  color: black;
  border: none;
  cursor: pointer;
  margin-top: 10px;
  font-size: 14px;
  border-radius: 5px;

  &:hover {
    background-color: #aaa;
  }
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
const ProjectCard = styled.div`
  background-color: #f1f1f1;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    background-color: #e0e0e0;
  }
`;

const ProjectCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ProjectCardDetails = styled.div`
  display: block;
  margin-top: 10px;
`;

const EditDeleteContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const EditButton = styled.button`
  background-color: transparent;
  border: none;
  color: #4caf50;
  font-size: 20px;
  cursor: pointer;

  &:hover {
    color: #45a049;
  }
`;

const DeleteButton = styled.button`
  background-color: transparent;
  border: none;
  color: #f44336;
  font-size: 20px;
  cursor: pointer;

  &:hover {
    color: #d32f2f;
  }
`;

const DetailsButton = styled.button`
  margin-top: 10px;
  background-color: #4caf50;
  color: white;
  padding: 8px 15px;
  font-size: 14px;
  border-radius: 5px;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #45a049;
  }
`;

export default ProjectList;
