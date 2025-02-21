import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";


// Import components
import Menu from "./Menu";
import ProjectList from "./Projects";
import CompanyList from "./Company";
import TaskTable from "./Pivot"; 
import TaskGraph from "./taskGraph";
import Kanban from "./Kanban";

// import Useravatarupload from "./users/Useravatarupload";
import AddUserForm from "./users";


const App = () => {
  return (
   
    <DndProvider backend={HTML5Backend}>
      <Router>
        <div className="app-container">
          
          {/* Define your routes */}
          <Routes>
            {/* Route for Company List - default landing page */}
            <Route path="/" element={<CompanyList />} />

            {/* Route for Menu, with company ID and project ID as parameters */}
            <Route path="/menu/:id/:projectId" element={<Menu />} />

            {/* Route for Projects, with company ID as a parameter */}
            <Route path="/projects/:id" element={<ProjectList />} />

            {/* Route for Gantt chart */}
           
            

            {/* Optional: Routes for other pages */}
            <Route path="/pivot" element={<Pivot />} />
            <Route path="/graph" element={<TaskGraph />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/users" element={<AddUserForm />} />
         
          </Routes>
        </div>
      </Router>
    </DndProvider>
    
  );
};

export default App;
