
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskDetailModal } from './TaskViews';
import {
    getFirestore,
    collection,
    query,
    onSnapshot,
    orderBy,
    doc,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';

// Mock dependencies
jest.mock('../firebase-config', () => ({
  db: {},
  storage: {}
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn()
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(),
    update: jest.fn()
  }
}));

// Auto-mock firestore
jest.mock('firebase/firestore');

describe('TaskDetailModal', () => {
  const mockTask = {
    id: 'task-123',
    taskName: 'Test Task',
    description: 'Test Description',
    status: 'Pending',
    priority: 'Medium',
    checklistItems: [],
    scheduledDate: '2023-10-27',
    assignedToEmail: 'user1@example.com'
  };

  const mockTeam = [
    { id: 'user-1', uid: 'uid-1', email: 'user1@example.com' }
  ];

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    query.mockReturnValue({ type: 'query' });
    collection.mockReturnValue({ type: 'collection' });
  });

  it('renders task details and fetches comments', async () => {
    const mockUnsubscribe = jest.fn();
    onSnapshot.mockImplementation((query, callback) => {
        const snapshot = {
            docs: [
                { id: '1', data: () => ({ text: 'First comment', createdAt: { seconds: 100 }, author: 'User A' }) },
                { id: '2', data: () => ({ text: 'Second comment', createdAt: { seconds: 200 }, author: 'User B' }) }
            ]
        };
        callback(snapshot);
        return mockUnsubscribe;
    });

    render(<TaskDetailModal task={mockTask} team={mockTeam} onClose={mockOnClose} />);

    // Check basic rendering
    expect(screen.getByText('Test Task')).toBeInTheDocument();

    // Check if comments are fetched
    await waitFor(() => {
        expect(collection).toHaveBeenCalledWith(expect.anything(), 'tasks/task-123/comments');
        expect(query).toHaveBeenCalled();
        expect(onSnapshot).toHaveBeenCalled();
    });

    // Check if comments are displayed
    await waitFor(() => {
      expect(screen.getByText('First comment')).toBeInTheDocument();
      expect(screen.getByText('Second comment')).toBeInTheDocument();
    });
  });

  it('uses orderBy to sort comments by createdAt desc', async () => {
    onSnapshot.mockReturnValue(jest.fn()); // Just needed to prevent crash
    orderBy.mockReturnValue({ type: 'orderBy' });

    render(<TaskDetailModal task={mockTask} team={mockTeam} onClose={mockOnClose} />);

    await waitFor(() => {
        expect(query).toHaveBeenCalled();
    });

    // Verify orderBy IS called
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');

    // Verify query is called with the orderBy constraint
    expect(query).toHaveBeenCalledWith(
        expect.anything(), // collection ref
        { type: 'orderBy' }
    );
  });
});
