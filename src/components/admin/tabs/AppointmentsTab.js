// src/components/admin/tabs/AppointmentsTab.js
import React from 'react';

const AppointmentsTab = ({ client }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold">Appointments</h3>
      <p>Appointments for {client.firstName} {client.lastName}.</p>
      {/* You can add more detailed appointment information here */}
    </div>
  );
};

export default AppointmentsTab;