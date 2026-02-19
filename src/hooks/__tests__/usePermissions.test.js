import { renderHook, act } from '@testing-library/react';
import { usePermissions } from '../usePermissions';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Mock dependencies
jest.mock('../../firebase-config', () => ({
  db: {},
}));

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

  test('should return loading false and empty permissions when user is null', () => {
    const { result } = renderHook(() => usePermissions(null));

    expect(result.current.loadingPermissions).toBe(false);
    expect(result.current.hasPermission('any')).toBe(false);
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  test('should return all permissions true for owner', () => {
    const userData = { uid: 'owner123', ownerId: 'owner123', role: 'owner' };
    const { result } = renderHook(() => usePermissions(userData));

    expect(result.current.loadingPermissions).toBe(false);
    expect(result.current.hasPermission('any_permission')).toBe(true);
    expect(result.current.hasPermission('another_permission')).toBe(true);
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  test('should fetch permissions for custom role and return correct values', () => {
    const userData = { uid: 'user123', ownerId: 'owner123', role: 'editor' };

    // Mock snapshot data
    const mockPermissions = { can_edit: true, can_delete: false };
    const mockSnapshot = {
      empty: false,
      docs: [
        {
          data: () => ({ permissions: mockPermissions }),
        },
      ],
    };

    onSnapshot.mockImplementation((query, callback) => {
      callback(mockSnapshot);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => usePermissions(userData));

    expect(collection).toHaveBeenCalledWith(expect.anything(), 'customRoles');
    expect(where).toHaveBeenCalledWith('ownerId', '==', userData.ownerId);
    expect(where).toHaveBeenCalledWith('roleName', '==', userData.role);
    expect(onSnapshot).toHaveBeenCalled();

    expect(result.current.loadingPermissions).toBe(false);
    expect(result.current.hasPermission('can_edit')).toBe(true);
    expect(result.current.hasPermission('can_delete')).toBe(false);
    expect(result.current.hasPermission('non_existent')).toBe(false);
  });

  test('should handle empty permissions when role not found', () => {
    const userData = { uid: 'user123', ownerId: 'owner123', role: 'unknown' };

    // Mock empty snapshot
    const mockSnapshot = {
      empty: true,
      docs: [],
    };

    onSnapshot.mockImplementation((query, callback) => {
      callback(mockSnapshot);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => usePermissions(userData));

    expect(result.current.loadingPermissions).toBe(false);
    expect(result.current.hasPermission('any')).toBe(false);
  });

  test('should update permissions when snapshot updates', () => {
    const userData = { uid: 'user123', ownerId: 'owner123', role: 'editor' };

    let snapshotCallback;
    onSnapshot.mockImplementation((query, callback) => {
      snapshotCallback = callback;
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => usePermissions(userData));

    // Initial state (loading)
    expect(result.current.loadingPermissions).toBe(true);

    // Update with permissions
    act(() => {
      snapshotCallback({
        empty: false,
        docs: [{ data: () => ({ permissions: { can_view: true } }) }],
      });
    });

    expect(result.current.loadingPermissions).toBe(false);
    expect(result.current.hasPermission('can_view')).toBe(true);

    // Update with different permissions
    act(() => {
      snapshotCallback({
        empty: false,
        docs: [{ data: () => ({ permissions: { can_view: false, can_edit: true } }) }],
      });
    });

    expect(result.current.hasPermission('can_view')).toBe(false);
    expect(result.current.hasPermission('can_edit')).toBe(true);
  });

  test('should unsubscribe when unmounted', () => {
    const userData = { uid: 'user123', ownerId: 'owner123', role: 'editor' };
    const { unmount } = renderHook(() => usePermissions(userData));

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
