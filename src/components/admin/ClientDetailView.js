// src/components/admin/ClientDetailView.js
// Updated with correct import paths and fallbacks

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../firebase-config";
import { useAuth } from "../Auth"; // Corrected import path

// Assumes these components are in a 'tabs' folder inside the 'admin' folder
import GoalsTab from "./tabs/GoalsTab";
import AppointmentsTab from "./tabs/AppointmentsTab";
import ActivityTab from "./tabs/ActivityTab";

const ClientDetailView = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchClient = async () => {
      if (!id) return;
      try {
        const clientDoc = await db.collection("users").doc(id).get();
        if (clientDoc.exists) {
          setClient({ id: clientDoc.id, ...clientDoc.data() });
        } else {
          console.error("Client not found");
        }
      } catch (error) {
        console.error("Error fetching client:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading client data...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Client not found.</p>
      </div>
    );
  }

  // Mock data fallbacks
  const mockGoals = client.goals || [
    { id: 1, title: "Improve Sleep Quality", progress: 65, target: 100 },
    { id: 2, title: "Increase Daily Steps", progress: 80, target: 100 },
    { id: 3, title: "Reduce Stress Levels", progress: 45, target: 100 },
  ];

  const mockAppointments = client.appointments || [
    { id: 1, date: "2025-04-06", type: "Therapy Session", status: "Scheduled" },
    { id: 2, date: "2025-04-03", type: "Check-in Call", status: "Completed" },
  ];

  const healthMetrics = client.healthMetrics || {
    moodAvg: 4.2,
    sleepAvg: 6.8,
    stepsAvg: 7200,
    waterAvg: 2.1,
  };

  const recentActivities = client.recentActivity || [
    { action: "Updated journal entry", timestamp: "2025-04-04T08:30:00Z" },
    { action: "Completed mindfulness exercise", timestamp: "2025-04-03T19:15:00Z" },
    { action: "Logged water intake", timestamp: "2025-04-03T14:20:00Z" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white text-xl font-bold">
                {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {client.firstName} {client.lastName}
                </h1>
                <p className="text-gray-600">{client.email}</p>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                    client.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : client.status === "Inactive"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {client.status || "Unknown"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Login</p>
              <p className="font-medium text-gray-900">
                {client.lastLogin
                  ? new Date(client.lastLogin).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {["overview", "goals", "appointments", "activity"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 capitalize font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 p-6 rounded-lg">
                                <h3 className="text-sm font-medium text-blue-800">Overall Goal Progress</h3>
                                <p className="text-3xl font-bold text-blue-900 mt-2">
                                    {Math.round(mockGoals.reduce((acc, g) => acc + g.progress, 0) / mockGoals.length)}%
                                </p>
                            </div>
                            <div className="bg-teal-50 p-6 rounded-lg">
                                <h3 className="text-sm font-medium text-teal-800">Upcoming Appointments</h3>
                                <p className="text-3xl font-bold text-teal-900 mt-2">
                                    {mockAppointments.filter(a => a.status === "Scheduled").length}
                                </p>
                            </div>
                        </div>

                        {/* Goal Progress */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Progress</h3>
                            <div className="space-y-4">
                                {mockGoals.map((goal) => (
                                <div key={goal.id}>
                                    <div className="flex justify-between mb-1">
                                    <span className="text-base font-medium text-gray-700">{goal.title}</span>
                                    <span className="text-sm font-medium text-gray-700">{goal.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${goal.progress}%` }}></div>
                                    </div>
                                </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                            <ul className="divide-y divide-gray-200">
                                {recentActivities.map((activity, idx) => (
                                <li key={idx} className="py-3">
                                    <p className="text-sm text-gray-800">{activity.action}</p>
                                    <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                                </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Client Info */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600"><strong>Email:</strong> {client.email}</p>
                                <p className="text-sm text-gray-600"><strong>Phone:</strong> {client.phone || 'N/A'}</p>
                                <p className="text-sm text-gray-600"><strong>Member Since:</strong> {client.memberSince ? new Date(client.memberSince).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>

                        {/* Health Metrics */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Metrics (Avg)</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="flex justify-between text-sm text-gray-600">Mood <span>{healthMetrics.moodAvg}/5</span></p>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className="bg-purple-500 h-1.5 rounded-full" style={{width: `${(healthMetrics.moodAvg/5)*100}%`}}></div></div>
                                </div>
                                <div>
                                    <p className="flex justify-between text-sm text-gray-600">Sleep <span>{healthMetrics.sleepAvg}h</span></p>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className="bg-indigo-500 h-1.5 rounded-full" style={{width: `${(healthMetrics.sleepAvg/10)*100}%`}}></div></div>
                                </div>
                                <div>
                                    <p className="flex justify-between text-sm text-gray-600">Steps <span>{healthMetrics.stepsAvg}</span></p>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className="bg-green-500 h-1.5 rounded-full" style={{width: `${(healthMetrics.stepsAvg/10000)*100}%`}}></div></div>
                                </div>
                                <div>
                                    <p className="flex justify-between text-sm text-gray-600">Water <span>{healthMetrics.waterAvg}L</span></p>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className="bg-cyan-500 h-1.5 rounded-full" style={{width: `${(healthMetrics.waterAvg/4)*100}%`}}></div></div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Notes</h3>
                            <textarea className="w-full p-2 border border-gray-300 rounded-md" rows="4" placeholder="Add a note..."></textarea>
                            <button className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">Save Note</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs with Error Boundaries (fallback messages if components missing) */}
            {activeTab === "goals" && (
              <React.Suspense fallback={<p>Loading goals...</p>}>
                <GoalsTab client={client} />
              </React.Suspense>
            )}
            {activeTab === "appointments" && (
              <React.Suspense fallback={<p>Loading appointments...</p>}>
                <AppointmentsTab client={client} />
              </React.Suspense>
            )}
            {activeTab === "activity" && (
              <React.Suspense fallback={<p>Loading activity...</p>}>
                <ActivityTab client={client} />
              </React.Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailView;