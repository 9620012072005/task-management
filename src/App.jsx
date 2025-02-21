import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Import components
import Menu from "./Menu";
import ProjectList from "./Projects";
import CompanyList from "./Company";
import TaskTable from "./Pivot"; // Make sure this file exists
import TaskGraph from "./TaskGraph";
import Kanban from "./Kanban";
import AddUserForm from "./Users";

const App = () => {
  return (
    <Router>
      <DndProvider backend={HTML5Backend}>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<CompanyList />} />
            <Route path="/menu/:id/:projectId" element={<Menu />} />
            <Route path="/projects/:id" element={<ProjectList />} />
            <Route path="/pivot" element={<TaskTable />} />
            <Route path="/graph" element={<TaskGraph />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/users" element={<AddUserForm />} />
          </Routes>
        </div>
      </DndProvider>
    </Router>
  );
};

export default App;
