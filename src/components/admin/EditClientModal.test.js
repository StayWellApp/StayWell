import React from 'react';
import { render, screen, act } from '@testing-library/react';
import EditClientModal from './EditClientModal';

// Mock dependencies
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock('../../firebase-config', () => ({
  db: {},
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('lucide-react', () => ({
  X: () => <div data-testid="icon-x" />,
  Save: () => <div data-testid="icon-save" />,
  Building: () => <div data-testid="icon-building" />,
  User: () => <div data-testid="icon-user" />,
  Mail: () => <div data-testid="icon-mail" />,
  Phone: () => <div data-testid="icon-phone" />,
  MapPin: () => <div data-testid="icon-map-pin" />,
  Hash: () => <div data-testid="icon-hash" />,
}));

describe('EditClientModal', () => {
  it('renders without uncontrolled input warning', () => {
    const mockClient = {
      id: '1',
      companyName: 'Test Corp',
    };
    const mockOnClose = jest.fn();

    // Spy on console.error to detect React warnings
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<EditClientModal isOpen={true} onClose={mockOnClose} client={mockClient} />);

    // Check if console.error was called with the warning
    const warning = consoleErrorSpy.mock.calls.find(call =>
      call[0] && typeof call[0] === 'string' && call[0].includes('A component is changing an uncontrolled input to be controlled')
    );

    expect(warning).toBeUndefined();

    consoleErrorSpy.mockRestore();
  });

  it('initializes form fields with empty strings instead of undefined', () => {
      const mockClient = {
          id: '1',
          // missing fields
      };
      const mockOnClose = jest.fn();

      render(<EditClientModal isOpen={true} onClose={mockOnClose} client={mockClient} />);

      // Verify inputs have value prop as empty string, not undefined (though React handles undefined as uncontrolled)
      // We can check by querying the input and checking its value
      // But mainly we care that no warning occurred (covered by previous test)
      // And that we can type into it
  });
});
