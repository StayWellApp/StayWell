// src/components/admin/tabs/GoalsTab.js
import React from 'react';

const GoalsTab = ({ client }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold">Goals</h3>
      <p>Goals for {client.firstName} {client.lastName}.</p>
      {/* You can add more detailed goal information here */}
    </div>
  );
};

export default GoalsTab;