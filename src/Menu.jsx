import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PivotTable from "./pivot";
import Graph from "./taskGraph";
import Calendar from "./Calendar";
import Kanban from "./Kanban";
import List from "./List";
import Dashboard from "./Dashboard";
import {
  HomeIcon,
  TableCellsIcon,
  ChartBarSquareIcon,
  CalendarDaysIcon,
  Bars3Icon,
  ListBulletIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const Menu = () => {
  const [activeComponent, setActiveComponent] = useState("dashboard");
  const [isOpen, setIsOpen] = useState(false); // Toggle for sidebar
  const navigate = useNavigate();

  const renderComponent = () => {
    switch (activeComponent) {
      case "dashboard":
        return <Dashboard />;
      case "pivot":
        return <PivotTable />;
      case "kanban":
        return <Kanban />;
      case "list":
        return <List />;
      case "calendar":
        return <Calendar />;
      case "graph":
        return <Graph />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 🔹 Top Navbar */}
      <div className="bg-gray-800 text-white flex items-center justify-between p-4 shadow-md w-full">
        <h2 className="text-xl font-bold">Task Management</h2>
        <button onClick={() => setIsOpen(true)}>
          <Bars3Icon className="h-8 w-8 text-white" />
        </button>
      </div>

      {/* 🔹 Sidebar / Drawer */}
      <div
        className={`fixed inset-y-0 left-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 text-white p-6 w-64 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 z-50`}
      >
        {/* 🔹 Close Button */}
        <div className="flex justify-end">
          <button onClick={() => setIsOpen(false)}>
            <XMarkIcon className="h-8 w-8 text-white" />
          </button>
        </div>

        {/* Sidebar Header */}
        <h2 className="text-2xl font-bold mb-10 text-center">Task Manager</h2>

        {/* Navigation Items */}
        <ul className="space-y-4">
          <li onClick={() => { setActiveComponent("dashboard"); setIsOpen(false); }} className="hover:bg-gray-700 p-3 rounded flex items-center cursor-pointer">
            <HomeIcon className="h-6 w-6 mr-3 text-gray-300" />
            <span>Dashboard</span>
          </li>
          <li onClick={() => { setActiveComponent("pivot"); setIsOpen(false); }} className="hover:bg-gray-700 p-3 rounded flex items-center cursor-pointer">
            <TableCellsIcon className="h-6 w-6 mr-3 text-gray-300" />
            <span>Pivot Table</span>
          </li>
          <li onClick={() => { setActiveComponent("kanban"); setIsOpen(false); }} className="hover:bg-gray-700 p-3 rounded flex items-center cursor-pointer">
            <Bars3Icon className="h-6 w-6 mr-3 text-gray-300" />
            <span>Kanban</span>
          </li>
          <li onClick={() => { setActiveComponent("list"); setIsOpen(false); }} className="hover:bg-gray-700 p-3 rounded flex items-center cursor-pointer">
            <ListBulletIcon className="h-6 w-6 mr-3 text-gray-300" />
            <span>List</span>
          </li>
          <li onClick={() => { setActiveComponent("calendar"); setIsOpen(false); }} className="hover:bg-gray-700 p-3 rounded flex items-center cursor-pointer">
            <CalendarDaysIcon className="h-6 w-6 mr-3 text-gray-300" />
            <span>Calendar</span>
          </li>
          <li onClick={() => { setActiveComponent("graph"); setIsOpen(false); }} className="hover:bg-gray-700 p-3 rounded flex items-center cursor-pointer">
            <ChartBarSquareIcon className="h-6 w-6 mr-3 text-gray-300" />
            <span>Graph</span>
          </li>
        </ul>
      </div>

      {/* 🔹 Overlay for Mobile (Click to Close) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* 🔹 Main Content */}
      <div className="flex-1 bg-gray-100">{renderComponent()}</div>
    </div>
  );
};

export default Menu;