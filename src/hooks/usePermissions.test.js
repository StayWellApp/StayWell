import { renderHook, waitFor } from '@testing-library/react';
import { usePermissions } from './usePermissions';
import { db } from '../firebase-config';
import { onSnapshot, collection, query, where } from 'firebase/firestore';

// Mock Firebase Config
jest.mock('../firebase-config', () => ({
  db: { type: 'mockDB' },
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
}));

describe('usePermissions Hook', () => {
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    onSnapshot.mockReturnValue(mockUnsubscribe);
  });

  test('should return loading false when userData is null', () => {
    const { result } = renderHook(() => usePermissions(null));
    expect(result.current.loadingPermissions).toBe(false);
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  test('should grant all permissions to owner', () => {
    const ownerData = { uid: 'user123', ownerId: 'user123', role: 'owner' };
    const { result } = renderHook(() => usePermissions(ownerData));

    expect(result.current.loadingPermissions).toBe(false);
    expect(result.current.hasPermission('any_permission')).toBe(true);
    expect(result.current.hasPermission('another_one')).toBe(true);
    // Owner check should bypass Firestore query
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  test('should fetch permissions for non-owner role', async () => {
    const userData = { uid: 'user456', ownerId: 'user123', role: 'editor' };
    const mockPermissions = { canEdit: true, canDelete: false };

    // Mock onSnapshot implementation to simulate data return
    onSnapshot.mockImplementation((query, callback) => {
      callback({
        empty: false,
        docs: [{ data: () => ({ permissions: mockPermissions }) }],
      });
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => usePermissions(userData));

    await waitFor(() => expect(result.current.loadingPermissions).toBe(false));

    expect(result.current.hasPermission('canEdit')).toBe(true);
    expect(result.current.hasPermission('canDelete')).toBe(false);
    expect(result.current.hasPermission('nonExistent')).toBe(false);

    expect(collection).toHaveBeenCalledWith(db, 'customRoles');
    expect(where).toHaveBeenCalledWith('ownerId', '==', userData.ownerId);
    expect(where).toHaveBeenCalledWith('roleName', '==', userData.role);
    expect(query).toHaveBeenCalled();
    expect(onSnapshot).toHaveBeenCalled();
  });

  test('should handle case where no role is found', async () => {
    const userData = { uid: 'user789', ownerId: 'user123', role: 'unknown' };

    // Mock onSnapshot implementation to simulate empty result
    onSnapshot.mockImplementation((query, callback) => {
      callback({
        empty: true,
        docs: [],
      });
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => usePermissions(userData));

    await waitFor(() => expect(result.current.loadingPermissions).toBe(false));

    expect(result.current.hasPermission('anyPermission')).toBe(false);
  });

  test('should cleanup subscription on unmount', () => {
    const userData = { uid: 'user456', ownerId: 'user123', role: 'editor' };

    const { unmount } = renderHook(() => usePermissions(userData));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
