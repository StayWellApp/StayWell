// src/components/admin/tabs/ActivityTab.js
import React from 'react';

const ActivityTab = ({ client }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold">Activity</h3>
      <p>Activity for {client.firstName} {client.lastName}.</p>
      {/* You can add more detailed activity information here */}
    </div>
  );
};

export default ActivityTab;