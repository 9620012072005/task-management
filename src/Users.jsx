import React, { useState } from 'react';
import { db, collection, addDoc, storage, } from './Firebase-Config'; // Import Firestore and Storage functions
import { toast } from 'react-hot-toast';
import { Avatar, TextField, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Button } from '@mui/material';
import styled from 'styled-components';
import defaultavatarfemale from './assets/images/femaleicon.png';
import defaultavatarmale from './assets/images/maleicon.png';
import defaultavatarbusiness from './assets/images/businessicon.png';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// Styled Components
const DialogOverlay = styled.div`
  background: rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const DialogBox = styled.div`
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const FormField = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
`;

const SubmitButton = styled(Button)`
  background-color: #007bff;
  color: white;
  width: 100%;
  padding: 12px;
  border-radius: 5px;

  &:hover {
    background-color: #0056b3;
  }
`;

const CloseButton = styled(Button)`
  background-color: #f44336;
  color: white;
  width: 100%;
  padding: 12px;
  border-radius: 5px;
  margin-top: 10px;

  &:hover {
    background-color: #d32f2f;
  }
`;

const AvatarWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 15px;
`;

const AddUserForm = ({ open, onClose, onUserAdded }) => {
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState('');
  const [aurl, setAurl] = useState(defaultavatarbusiness); // Default avatar URL
  const [gender, setGender] = useState('');
  const [imageFile, setImageFile] = useState(null); // State for the selected image file

  const navigate = useNavigate();

  // Handle gender change to update avatar
  const handleGenderChange = (event) => {
    setGender(event.target.value);
    if (event.target.value === 'male') {
      setAurl(defaultavatarmale);
    } else if (event.target.value === 'female') {
      setAurl(defaultavatarfemale);
    } else {
      setAurl(defaultavatarbusiness);
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file); // Save the file to state
      const reader = new FileReader();
      reader.onloadend = () => {
        setAurl(reader.result); // Preview the selected image
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!userName || !role || !dateOfJoining) {
      toast.error('Please fill all the fields.');
      return;
    }

    try {
      let imageUrl = aurl; // Default avatar URL

      // Upload the selected image to Firebase Storage (if a file is selected)
      if (imageFile) {
        const storageRef = ref(storage, `users/${userName}_${Date.now()}`); // Create a unique path for the image
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref); // Get the URL of the uploaded image
      }

      // Add user data to Firestore
      const newUser = {
        name: userName,
        role: role,
        dateOfJoining: dateOfJoining,
        avatarURL: imageUrl, // Use the uploaded image URL
      };

      const userCollectionRef = collection(db, 'users');
      await addDoc(userCollectionRef, newUser);

      // Show success toast
      toast.success('User added successfully!');

      // Reset form fields
      setUserName('');
      setRole('');
      setDateOfJoining('');
      setAurl(defaultavatarbusiness);
      setImageFile(null);

      if (onUserAdded && typeof onUserAdded === 'function') {
        onUserAdded();
      }

      // Close the modal
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1000);
      }

      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Error adding user: ', error);
      toast.error('Failed to add user. Please try again.');
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    navigate('/');
  };

  return (
    <DialogOverlay open={open}>
      <DialogBox>
        <h3>Add New User</h3>
        <form onSubmit={handleAddUser}>
          {/* Name */}
          <FormField>
            <label htmlFor="userName">Name</label>
            <TextField
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter user name"
              fullWidth
              required
            />
          </FormField>

          {/* Role */}
          <FormField>
            <label htmlFor="role">Role</label>
            <TextField
              type="text"
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Enter role"
              fullWidth
              required
            />
          </FormField>

          {/* Date of Joining */}
          <FormField>
            <label htmlFor="dateOfJoining">Date of Joining</label>
            <TextField
              type="date"
              id="dateOfJoining"
              value={dateOfJoining}
              onChange={(e) => setDateOfJoining(e.target.value)}
              fullWidth
              required
            />
          </FormField>

          {/* Gender Selection */}
          <FormField>
            <FormControl component="fieldset">
              <FormLabel component="legend">Gender</FormLabel>
              <RadioGroup
                row
                aria-label="gender"
                name="gender"
                value={gender}
                onChange={handleGenderChange}
              >
                <FormControlLabel value="male" control={<Radio />} label="Male" />
                <FormControlLabel value="female" control={<Radio />} label="Female" />
                <FormControlLabel value="others" control={<Radio />} label="Others" />
              </RadioGroup>
            </FormControl>
          </FormField>

          {/* Avatar Display */}
          <AvatarWrapper>
            <Avatar src={aurl} sx={{ width: 100, height: 100 }} alt="User Avatar" />
          </AvatarWrapper>

          {/* Avatar Upload */}
          <FormField>
            <label htmlFor="avatar">Upload Avatar (Optional)</label>
            <input
              type="file"
              id="avatar"
              onChange={handleFileChange}
              style={{ marginTop: '10px' }}
            />
          </FormField>

          {/* Submit Button */}
          <SubmitButton type="submit" variant="contained">Add User</SubmitButton>
        </form>

        {/* Close Button */}
        <CloseButton variant="contained" onClick={handleClose}>Close</CloseButton>
      </DialogBox>
    </DialogOverlay>
  );
};

export default AddUserForm;