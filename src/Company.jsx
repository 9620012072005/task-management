import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { db, collection, addDoc, doc, updateDoc, deleteDoc, getDocs, setDoc, onSnapshot } from './Firebase-Config';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { Chip } from '@mui/material';

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [companyProjects, setCompanyProjects] = useState({});
  const navigate = useNavigate();
  const [assignees, setAssignees] = useState([]);
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);  // State for showing confirmation dialog
  const [companyIdToDelete, setCompanyIdToDelete] = useState(null);  // Store companyId to delete

  // Fetch companies with real-time updates
  useEffect(() => {
    const companyCollection = collection(db, 'companies');
    const unsubscribe = onSnapshot(companyCollection, (snapshot) => {
      const companyList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCompanies(companyList);
    });
    return () => unsubscribe();
  }, []);

  // Fetch users (assignees) from the 'users' collection
  useEffect(() => {
    const unsubscribeAssignees = onSnapshot(collection(db, 'users'), (snapshot) => {
      const assigneeList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setAssignees(assigneeList);
    });
    return () => unsubscribeAssignees();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Submit form (Add or Update Company)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      alert('Please fill all fields');
      return;
    }

    try {
      // Prepare the data to be saved
      const companyData = {
        name: formData.name,
        address: formData.address,
        users: users.map(user => user.name), // Store user IDs in Firestore
      };

      if (editCompany) {
        // Update the existing company data
        handleUpdateCompany(editCompany.id, companyData);
        
      } else {
        // Add a new company
        const companyRef = doc(db, 'companies', formData.name); // Using the name as the document ID
        await setDoc(companyRef, companyData);
        alert('Company added successfully');
      }
    } catch (error) {
      console.error('Error processing company: ', error);
      alert('Something went wrong, please try again.');
    }

    // Reset form state
    setFormData({ name: '', address: '' });
    setUsers([]);
    setIsDialogOpen(false);
    setEditCompany(null);
  };

  // Update company data
  const handleUpdateCompany = async (companyId, companyData) => {
    try {
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, companyData);
      alert('Company updated successfully!');
    } catch (error) {
      console.error('Error updating company:', error);
      alert('Failed to update company.');
    }
  };
  const handleDeleteClick = (companyId) => {
    // Show confirmation dialog
    setCompanyIdToDelete(companyId);
    setShowConfirmDialog(true);
  };
  // Delete a company
  const handleDelete = async (companyId) => {
    try {
      // Delete related projects first
      const projectCollectionRef = collection(db, 'companies', companyId, 'projects');
      const projectSnapshot = await getDocs(projectCollectionRef);
      projectSnapshot.forEach(async (projectDoc) => {
        await deleteDoc(projectDoc.ref);
      });

      // Delete the company
      const companyRef = doc(db, 'companies', companyId);
      await deleteDoc(companyRef);
      alert('Company deleted successfully');
    } catch (error) {
      console.error('Error deleting company: ', error);
      alert('Failed to delete company, please try again.');
    } finally {
      // Hide the confirmation dialog after deletion attempt
      setShowConfirmDialog(false);
    }
  };

  const handleCancelDelete = () => {
    // Close confirmation dialog without deleting
    setShowConfirmDialog(false);
  };

  // Navigate to Projects page
  const handleCardClick = (company) => {
    navigate(`/projects/${company.id}`);
  };

  // Open form for editing a company
  const handleEdit = (company) => {
    setFormData({
      name: company.name,
      address: company.address,
    });

    // Fetch users based on the stored IDs
    const assignedUsers = assignees.filter(user => company.users.includes(user.id));
    setUsers(assignedUsers);  // Correctly filter assigned users
    setEditCompany(company);
    setIsDialogOpen(true);
  };

  // Handle the change in user selection (for Autocomplete)
  const handleUserChange = (event, newValue) => {
    setUsers(newValue);  // Update users array with selected user objects
  };

  // Add a new user
  const handleAddUser = async () => {
    if (!newUserName) {
      alert('Please provide a name for the new user');
      return;
    }

    const newUser = { name: newUserName };
    try {
      const userRef = await addDoc(collection(db, 'users'), newUser);
      alert('User added successfully!');
      setNewUserName('');
      setIsUserModalOpen(false);
    } catch (error) {
      console.error('Error adding user: ', error);
      alert('Failed to add user, please try again.');
    }
  };
  const handleAddUserClick = () => {
    navigate('/users');  // Navigate to the Add User page
  };
  return (
    <Container>
      
      <CompanyCardsContainer className="mt-10">
          {/* Stylish Add Company Button */}
          <div className="flex justify-center mt-6">
          <AddCompanyButton 
            onClick={() => setIsDialogOpen(true)} 
            className="w-full h-24 sm:w-auto px-8 py-4 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white font-semibold rounded-lg shadow-lg hover:from-yellow-500 hover:to-red-500 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Add Company
          </AddCompanyButton>
        </div>
        {companies.map((company) => (
          <CompanyCard 
          className='w-[400px] h-[100px]'
          key={company.id} onClick={() => navigate(`/projects/${company.id}`)}>
            <CompanyCardHeader>
              <h3>{company.name}</h3>
              <EditDeleteContainer className="ml-20">
                <EditButton onClick={(e) => { e.stopPropagation(); handleEdit(company); }}>
                  <FaEdit />
                </EditButton>
                <DeleteButton onClick={(e) => { 
                  e.stopPropagation(); 
                  handleDeleteClick(company.id); // Show confirmation dialog
                }}>
                  <FaTrashAlt />
                </DeleteButton>
              </EditDeleteContainer>
            </CompanyCardHeader>
            <CompanyCardDetails>
              <AddressText>{company.address}</AddressText>
            </CompanyCardDetails>
          </CompanyCard>
        ))}
      
      </CompanyCardsContainer>
  
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0  bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <div className="text-xl font-semibold mb-4">Confirm Deletion</div>
            <p className="mb-6">Are you sure you want to delete this company? This action cannot be undone.</p>
            <div className="flex justify-between">
              <button 
                 className="px-6 py-2 bg-gradient-to-r from-gray-50 via-white to-slate-300 text-black font-semibold rounded-lg shadow-md hover:from-yellow-500 hover:to-red-500 transition-all duration-300 ease-in-out mt-4"
                onClick={handleCancelDelete}>
                Cancel
              </button>
              <button 
                className="px-6 py-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white font-semibold rounded-lg shadow-md hover:from-yellow-500 hover:to-red-500 transition-all duration-300 ease-in-out mt-4"
                onClick={() => handleDelete(companyIdToDelete)}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
  
    {/* Company Form Dialog */}
{isDialogOpen && (
  <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <DialogBox className="bg-white rounded-lg shadow-xl p-8 w-full sm:w-96">
      <h3 className="text-xl font-semibold mb-6 text-center">{editCompany ? 'Edit Company' : 'Add New Company'}</h3>
      <Form onSubmit={handleSubmit}>
        <FormField className="mb-4">
          <label htmlFor="name" className="block text-sm font-semibold mb-2">Company Name</label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter company name"
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
          />
        </FormField>
        <FormField className="mb-4">
          <label htmlFor="address" className="block text-sm font-semibold mb-2">Company Address</label>
          <Input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter company address"
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
          />
        </FormField>
        <FormGroup className="mb-6">
          <Label className="block text-sm font-semibold mb-2">Users</Label>
          <Autocomplete
            multiple
            options={assignees}
            getOptionLabel={(option) => option.name}
            value={users}
            onChange={handleUserChange}
            renderInput={(params) => (
              <TextField {...params} label="Select Users" variant="outlined" className="w-full" />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option) => (
              <li {...props} className="py-1 px-2">
                <Chip label={option.name} className="text-sm" />
              </li>
            )}
          />
          <Button
            sx={{ marginTop: '20px' }}
            fullWidth
            variant="contained"
            color="secondary"
            onClick={handleAddUserClick}
            className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white font-semibold rounded-lg shadow-md hover:from-yellow-500 hover:to-red-500 transition-all duration-300 ease-in-out mt-4"
          >
            Add User
          </Button>
        </FormGroup>
        <SubmitButton
          type="submit"
          className="w-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white font-semibold rounded-lg py-3 mb-4 shadow-md hover:from-yellow-500 hover:to-red-500 transition-all duration-300 ease-in-out"
        >
          {editCompany ? 'Update Company' : 'Add Company'}
        </SubmitButton>
      </Form>
      <CloseButton
        onClick={() => setIsDialogOpen(false)}
        className="w-full bg-gray-300 text-gray-800 rounded-lg py-3 mt-4 hover:bg-gray-400 transition-all duration-300 ease-in-out"
      >
        Close
      </CloseButton>
    </DialogBox>
  </DialogOverlay>
)}

    
    </Container>
  );
}  
const Container = styled.div`
  width: 80%;
  margin: 0 auto;
  padding: 20px;
`;

const AddCompanyButton = styled.button`
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

const CompanyCardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
  align-items: center;
  
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

const AddressText = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 10px;
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

const CompanyCard = styled.div`
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

const CompanyCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CompanyCardDetails = styled.div`
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

export default CompanyList;
