import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StaffDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserName(currentUser.displayName || 'Staff Member');
      
      const propertiesQuery = query(
        collection(db, 'properties'),
        where('assignedStaff', 'array-contains', currentUser.uid)
      );

      const unsubscribeProperties = onSnapshot(propertiesQuery, (snapshot) => {
        const props = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProperties(props);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching properties: ", error);
        setLoading(false);
      });

      const tasksQuery = query(
        collection(db, 'tasks'),
        where('assignedTo', '==', currentUser.uid)
      );

      const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
        const taskData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(taskData);
      });

      return () => {
        unsubscribeProperties();
        unsubscribeTasks();
      };
    }
  }, []);

  const taskStatusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(taskStatusCounts).map(status => ({
    name: status,
    count: taskStatusCounts[status],
  }));

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome, {userName}!</h1>
      <p className="text-gray-600 mb-8">Here's a summary of your assigned properties and tasks.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Assigned Properties</h2>
          <p className="text-4xl font-bold text-blue-600">{properties.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Pending Tasks</h2>
          <p className="text-4xl font-bold text-yellow-500">{taskStatusCounts['Pending'] || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Completed Tasks</h2>
          <p className="text-4xl font-bold text-green-500">{taskStatusCounts['Completed'] || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Your Properties</h2>
          {properties.length > 0 ? (
            <ul className="space-y-4">
              {properties.map(property => (
                <li key={property.id} className="p-4 border rounded-md hover:bg-gray-50">
                  <Link to={`/property/${property.id}/tasks`} className="font-semibold text-blue-600 hover:underline">
                    {property.propertyName}
                  </Link>
                  <p className="text-sm text-gray-500">{property.address}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>You have not been assigned to any properties yet.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Task Status Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;