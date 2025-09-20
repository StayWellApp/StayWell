
// src/components/admin/ClientDetailView.js
// Enhanced Overview Tab with Modern Dashboard UI

import React, { useState, useEffect } from "react";
import { db } from "../../../firebase";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/router";
import GoalsTab from "./GoalsTab";
import AppointmentsTab from "./AppointmentsTab";
import ActivityTab from "./ActivityTab";

const ClientDetailView = () => {
  const router = useRouter();
  const { id } = router.query;
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

  // Sample data fallback (in case not in Firestore)
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
              <div className="space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Goals Progress */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Goals Progress</h3>
                    <div className="text-2xl font-bold text-blue-900 mb-1">
                      {Math.round(
                        mockGoals.reduce((acc, g) => acc + g.progress, 0) / mockGoals.length
                      )}
                      %
                    </div>
                    <p className="text-sm text-blue-700">{mockGoals.length} active goals</p>
                  </div>

                  {/* Upcoming Appointments */}
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 border border-teal-100">
                    <h3 className="text-sm font-medium text-teal-800 mb-2">Appointments</h3>
                    <div className="text-2xl font-bold text-teal-900 mb-1">
                      {mockAppointments.filter((a) => a.status === "Scheduled").length}
                    </div>
                    <p className="text-sm text-teal-700">upcoming sessions</p>
                  </div>

                  {/* Mood Average */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
                    <h3 className="text-sm font-medium text-purple-800 mb-2">Mood (Avg)</h3>
                    <div className="text-2xl font-bold text-purple-900 mb-1">{healthMetrics.moodAvg}/5</div>
                    <p className="text-sm text-purple-700">past 30 days</p>
                  </div>

                  {/* Sleep Average */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-100">
                    <h3 className="text-sm font-medium text-amber-800 mb-2">Sleep (Avg)</h3>
                    <div className="text-2xl font-bold text-amber-900 mb-1">{healthMetrics.sleepAvg}h</div>
                    <p className="text-sm text-amber-700">per night</p>
                  </div>
                </div>

                {/* Goals Progress List */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Progress</h3>
                  <div className="space-y-4">
                    {mockGoals.map((goal) => (
                      <div key={goal.id} className="flex flex-col space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-800">{goal.title}</span>
                          <span className="font-medium text-gray-900">{goal.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {recentActivities.slice(0, 5).map((activity, idx) => (
                      <div key={idx} className="flex items-center space-x-3 text-sm text-gray-700">
                        <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                        <span>
                          {activity.action}{" "}
                          <span className="text-gray-500">
                            ({new Date(activity.timestamp).toLocaleDateString()})
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other Tabs (Unchanged) */}
            {activeTab === "goals" && <GoalsTab client={client} />}
            {activeTab === "appointments" && <AppointmentsTab client={client} />}
            {activeTab === "activity" && <ActivityTab client={client} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailView;