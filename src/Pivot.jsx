import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import { db } from './Firebase-Config';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import AddForm from './AddForm';
import { Button } from "@headlessui/react"; // or the correct library path
import { useParams } from 'react-router-dom';

// Responsive Styled Components
const TableContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: end;
  justify-content: center;
  margin: 20px;
  max-width: 1000px;
  width: 100%;
  padding: 20px;

  @media (max-width: 968px) {
    margin: 10px;
    max-width: 100%;
  }
`;

const TableTitle = styled.h2`
  margin-bottom: 20px;
  font-size: 2.5em;
  color: black;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 1.8em;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  width: 100%;
  display: flex;
  justify-content: center;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  color: #333;

  @media (max-width: 768px) {
    font-size: 0.9em;
  }
`;

const Th = styled.th`
  padding: 15px;
  background-color: #f4f4f4;
  border: 1px solid #ddd;
  font-weight: bold;
  position: relative;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #eaeaea;
  }
`;

const Td = styled.td`
  padding: 15px;
  border: 1px solid #ddd;
`;

const TotalRow = styled.tr`
  font-weight: bold;
  background-color: #f9f9f9;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #333;
  margin-left: 5px;

  &:hover {
    color: #007bff;
  }
`;

const Dropdown = styled.div`
  position: absolute;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 200px;
  padding: 10px;
  z-index: 1000;
  top: 40px;

  @media (max-width: 768px) {
    width: 150px;
  }
`;

const DropdownItem = styled.p`
  margin: 5px 0;
  cursor: pointer;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const AddButton = styled.button`
  background-color: #007bff;
  color: #fff;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.3s, transform 0.2s;
  margin-bottom: 25px;

  &:hover {
    background-color: #0056b3;
    transform: scale(1.05);
  }

  &:active {
    background-color: #004080;
  }
`;

const TaskTable = () => {
  const {id,projectId}=useParams();
  const [data, setData] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [taskDropdownOpen, setTaskDropdownOpen] = useState({});
  const [viewType, setViewType] = useState('Task');
  const [showCreatedOn, setShowCreatedOn] = useState(false);
  const [showDeadlineFrom, setshowDeadlineFrom] = useState(false);
  const [showDeadlineTo, setshowDeadlineTo] = useState(false);
  const [uniquestagees, setUniquestagees] = useState([]);
  const [showCustomer, setshowCustomer] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'companies',id,'projects',projectId,'tasks'), (snapshot) => {
      const fetchedData = snapshot.docs.map((doc) => {
        const { assignedTo, stage, task, createdOn, deadlineFrom, deadlineTo, customer } = doc.data();
        return {
          assignedTo,
          stage,
          task,
          customer: customer instanceof String ? customer.toString() : customer,
          createdOn: createdOn instanceof Timestamp ? createdOn.toDate() : new Date(createdOn),
          deadlineFrom: deadlineFrom instanceof Timestamp ? deadlineFrom.toDate() : new Date(deadlineFrom),
          deadlineTo: deadlineTo instanceof Timestamp ? deadlineTo.toDate() : new Date(deadlineTo),
        };
      });
      setData(fetchedData);

      const stagees = [...new Set(fetchedData.map(item => item.stage))];
      setUniquestagees(stagees);
    });
    return () => unsubscribe();
  }, []);

  const getstageCounts = (assignee) => {
    const counts = {};
    uniquestagees.forEach((stage) => (counts[stage] = 0));
    data.forEach((item) => {
      if (item.assignedTo === assignee) {
        counts[item.stage] = (counts[item.stage] || 0) + 1;
      }
    });
    return counts;
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const toggleTaskDropdown = (assignee) => {
    setTaskDropdownOpen((prev) => ({
      ...prev,
      [assignee]: !prev[assignee],
    }));
  };

  const displayData = viewType === 'Assignee'
    ? [...new Set(data.map((item) => item.assignedTo))]
    : data;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <AddForm isOpen={isAddFormOpen} closeModal={() => setIsAddFormOpen(false)} />
      <TableContainer>
        <TableTitle className="pr-96">Pivot Table</TableTitle>
        <AddButton onClick={() => setIsAddFormOpen(true)}>
          <PlusCircleIcon style={{ width: '20px', height: '20px' }} />
          Add Task
        </AddButton>
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th rowSpan={2}>
                  <IconButton onClick={toggleDropdown}>
                    {dropdownOpen ? (
                      <MinusCircleIcon style={{ width: '20px', height: '20px' }} />
                    ) : (
                      <PlusCircleIcon style={{ width: '20px', height: '20px' }} />
                    )}
                  </IconButton>
                  {viewType}
                  {dropdownOpen && (
                    <Dropdown style={{ marginTop: '14px' }}>
                      <DropdownItem onClick={() => { setViewType('Task'); toggleDropdown(); }}>Task</DropdownItem>
                      <DropdownItem onClick={() => { setViewType('Assignee'); toggleDropdown(); }}>Assignee</DropdownItem>
                      <DropdownItem onClick={() => { setshowCustomer(!showCustomer); toggleDropdown(); }}>
                        {showCustomer ? 'Hide Customer ' : 'Customer'}
                      </DropdownItem>
                      <DropdownItem onClick={() => { setShowCreatedOn(!showCreatedOn); toggleDropdown(); }}>
                        {showCreatedOn ? 'Hide Created On' : 'Created On'}
                      </DropdownItem>
                      <DropdownItem onClick={() => { setshowDeadlineFrom(!showDeadlineFrom); toggleDropdown(); }}>
                        {showDeadlineFrom ? 'Hide Deadline From' : 'Deadline From'}
                      </DropdownItem>
                      <DropdownItem onClick={() => { setshowDeadlineTo(!showDeadlineTo); toggleDropdown(); }}>
                        {showDeadlineTo ? 'Hide Deadline To' : 'Deadline To'}
                      </DropdownItem>
                    </Dropdown>
                  )}
                </Th>
                <Th colSpan={uniquestagees.length}>Stage</Th>
                <Th rowSpan={2}>Total</Th>
              </tr>
              <tr>
                {uniquestagees.map((stage, index) => (
                  <Th key={index}>{stage.charAt(0).toUpperCase() + stage.slice(1)}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, index) => (
                <React.Fragment key={index}>
                  <tr>
                    <Td>
                      {viewType === 'Assignee' ? (
                        <>
                          {row}
                          <IconButton onClick={() => toggleTaskDropdown(row)}>
                            {taskDropdownOpen[row] ? (
                              <MinusCircleIcon style={{ width: '20px', height: '20px' }} />
                            ) : (
                              <PlusCircleIcon style={{ width: '20px', height: '20px' }} />
                            )}
                          </IconButton>
                        </>
                      ) : (
                        <>
                          {row.task}
                          {showCustomer && (
                            <span style={{ display: 'block', marginTop: '5px', fontSize: '0.85em' }}>
                              Customer: {row.customer ? (row.customer).toLocaleString() : 'N/A'}
                            </span>
                          )}
                          {showCreatedOn && (
                            <span style={{ display: 'block', marginTop: '5px', fontSize: '0.85em' }}>
                              Created On: {row.createdOn ? new Date(row.createdOn).toLocaleString() : 'N/A'}
                            </span>
                          )}
                          {showDeadlineFrom && (
                            <span style={{ display: 'block', marginTop: '5px', fontSize: '0.85em' }}>
                              Deadline From: {row.deadlineFrom ? new Date(row.deadlineFrom).toLocaleString() : 'N/A'}
                            </span>
                          )}
                          {showDeadlineTo && (
                            <span style={{ display: 'block', marginTop: '5px', fontSize: '0.85em' }}>
                              Deadline To: {row.deadlineTo ? new Date(row.deadlineTo).toLocaleString() : 'N/A'}
                            </span>
                          )}
                        </>
                      )}
                    </Td>
                    {uniquestagees.map((stage) => {
                      const stageCount =
                        viewType === 'Assignee' ? getstageCounts(row)[stage] : row.stage === stage ? 1 : 0;
                      return <Td key={stage}>{stageCount}</Td>;
                    })}
                    <Td>{viewType === 'Assignee' ? Object.values(getstageCounts(row)).reduce((a, b) => a + b, 0) : 1}</Td>
                  </tr>
                  {viewType === 'Assignee' && taskDropdownOpen[row] && (
                    data
                      .filter((item) => item.assignedTo === row)
                      .map((taskItem, taskIndex) => (
                        <tr key={taskIndex}>
                          <Td style={{ paddingLeft: '30px' }}>
                            {taskItem.task}
                            {showCustomer && (
                              <span style={{ display: 'block', marginTop: '5px', fontSize: '0.85em' }}>
                                Customer: {taskItem.customer ? (taskItem.customer).toLocaleString() : 'N/A'}
                              </span>
                            )}
                            {showCreatedOn && (
                              <span style={{ display: 'block', marginTop: '5px', fontSize: '0.85em' }}>
                                Created On: {taskItem.createdOn ? new Date(taskItem.createdOn).toLocaleString() : 'N/A'}
                              </span>
                            )}
                            {showDeadlineFrom && (
                              <span style={{ display: 'block', marginTop: '5px', fontSize: '0.85em' }}>
                                Deadline From: {taskItem.deadlineFrom ? new Date(taskItem.deadlineFrom).toLocaleString() : 'N/A'}
                              </span>
                            )}
                            {showDeadlineTo && (
                              <span style={{ display: 'block', marginTop: '5px', fontSize: '0.85em' }}>
                                Deadline To: {taskItem.deadlineTo ? new Date(taskItem.deadlineTo).toLocaleString() : 'N/A'}
                              </span>
                            )}
                          </Td>
                          {uniquestagees.map((stage) => (
                            <Td key={stage}>
                              {taskItem.stage === stage ? 1 : 0}
                            </Td>
                          ))}
                          <Td></Td> {/* Leave total cell empty for task rows */}
                        </tr>
                      ))
                  )}
                </React.Fragment>
              ))}
              <TotalRow>
                <Td>Total</Td>
                {uniquestagees.map((stage) => (
                  <Td key={stage}>{data.filter((item) => item.stage === stage).length}</Td>
                ))}
                <Td>{data.length}</Td>
              </TotalRow>
            </tbody>
          </Table>
        </TableWrapper>
      </TableContainer>
    </div>
  );
};

export default TaskTable;
