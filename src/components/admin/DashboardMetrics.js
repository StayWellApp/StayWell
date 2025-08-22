import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Users, Building, Briefcase } from 'lucide-react';

const StatCard = ({ icon, title, value, color }) => {
    const colors = {
        blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300',
        green: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300',
        purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300',
    };
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center space-x-4">
            <div className={`p-3 rounded-full ${colors[color]}`}>{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            </div>
        </div>
    );
};

const DashboardMetrics = () => {
    const [stats, setStats] = useState({
        totalCustomers: 0,
        totalProperties: 0,
        totalTeamMembers: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Get total customers (users with role 'owner')
                const customersQuery = query(collection(db, "users"), where("role", "==", "owner"));
                const customersSnapshot = await getDocs(customersQuery);
                const totalCustomers = customersSnapshot.size;

                // Get total properties
                const propertiesSnapshot = await getDocs(collection(db, "properties"));
                const totalProperties = propertiesSnapshot.size;
                
                // Get total team members (users with role 'staff')
                const teamQuery = query(collection(db, "users"), where("role", "==", "staff"));
                const teamSnapshot = await getDocs(teamQuery);
                const totalTeamMembers = teamSnapshot.size;

                setStats({ totalCustomers, totalProperties, totalTeamMembers });
            } catch (error) {
                console.error("Error fetching dashboard metrics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><p>Loading metrics...</p></div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={<Users size={24} />} title="Total Customers" value={stats.totalCustomers} color="blue" />
            <StatCard icon={<Building size={24} />} title="Properties Managed" value={stats.totalProperties} color="green" />
            <StatCard icon={<Briefcase size={24} />} title="Total Team Members" value={stats.totalTeamMembers} color="purple" />
        </div>
    );
};

export default DashboardMetrics;