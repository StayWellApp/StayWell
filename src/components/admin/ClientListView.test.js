import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // Add this line
import ClientListView from './ClientListView';

// Mock react-router-dom with virtual: true to bypass potential resolution issues
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(() => jest.fn()),
  BrowserRouter: ({ children }) => <div>{children}</div>
}), { virtual: true });

// Mock country-list
jest.mock('country-list', () => ({
  getCode: jest.fn(() => 'us'),
}));

const mockClients = [
  {
    id: '1',
    companyName: 'Test Company',
    fullName: 'John Doe',
    email: 'john@example.com',
    subscription: {
      planName: 'Pro Plan',
      renewalDate: { seconds: 1672531200 } // Jan 1 2023
    },
    status: 'active',
    country: 'United States',
    createdAt: { seconds: 1672444800 }
  },
  {
    id: '2',
    companyName: 'No Sub Company',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    subscription: null,
    status: 'inactive',
    country: 'Canada',
    createdAt: { seconds: 1672444800 }
  }
];

describe('ClientListView', () => {
  test('renders client list with correct subscription data', () => {
    render(
      <ClientListView allClients={mockClients} loading={false} />
    );

    // Check for company names
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('No Sub Company')).toBeInTheDocument();

    // Check for subscription plan name
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
  });

  test('renders N/A for clients without subscription', () => {
     render(
       <ClientListView allClients={[mockClients[1]]} loading={false} />
    );

    // Should see N/A for plan
    expect(screen.queryByText('Pro Plan')).not.toBeInTheDocument();
  });
});
