import React from 'react';

export const DashboardLayout = ({ onLogout, user, children }) => (
    <div className="w-full min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
            <h1 className="text-2xl font-bold text-blue-600">StayWellApp</h1>
            <div className="flex items-center"><span className="text-gray-600 mr-4">Welcome, {user.email}</span><button onClick={onLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">Logout</button></div>
        </header>
        <main className="flex-grow p-4 md:p-8">{children}</main>
    </div>
);

export const LoadingScreen = ({ message = "Loading..."}) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-600">{message}</p>
        </div>
    </div>
);