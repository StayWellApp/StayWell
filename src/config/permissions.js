// --- src/config/permissions.js ---

export const PERMISSION_CATEGORIES = [
    {
        id: 'properties',
        label: 'Properties',
        description: 'Permissions related to viewing and managing properties.',
        permissions: [
            { id: 'properties_view_all', label: 'View all properties in the account' },
            { id: 'properties_view_assigned', label: 'Can only view properties specifically assigned to them' }, // Added for clarity
            { id: 'properties_create_edit_delete', label: 'Create, edit, and delete properties' },
        ]
    },
    {
        id: 'tasks',
        label: 'Tasks',
        description: 'Permissions for handling tasks and assignments.',
        permissions: [
            { id: 'tasks_view_all', label: 'View all tasks for all properties' },
            { id: 'tasks_view_assigned', label: 'Can only view tasks specifically assigned to them' }, // Changed from _assigned_only for consistency
            { id: 'tasks_create_edit_delete', label: 'Create, edit, and delete any task' },
            { id: 'tasks_assign_others', label: 'Assign tasks to other team members' },
            { id: 'tasks_complete', label: 'Mark tasks as complete' },
        ]
    },
    {
        id: 'team',
        label: 'Team Management',
        description: 'Permissions for inviting and managing team members.',
        permissions: [
            { id: 'team_manage', label: 'Invite new members, remove members, and change roles' },
        ]
    },
    {
        id: 'checklists',
        label: 'Checklist Templates',
        description: 'Permissions for creating and managing templates.',
        permissions: [
            { id: 'checklists_manage', label: 'Create, edit, and delete checklist templates' },
            { id: 'checklists_complete', label: 'Complete checklists on properties' },
        ]
    },
    {
        id: 'inventory', // Changed from 'storage' for more general use
        label: 'Inventory & Supplies',
        description: 'Permissions for viewing and managing inventory and supplies.',
        permissions: [
            { id: 'inventory_view', label: 'View storage locations and stock levels' },
            { id: 'inventory_manage', label: 'Update stock levels and manage locations' }, // Renamed from storage_manage
        ]
    },
    {
        id: 'bookings',
        label: 'Bookings',
        description: 'Permissions for managing property bookings.',
        permissions: [
            { id: 'bookings_manage', label: 'Create, edit, and delete bookings' },
            { id: 'bookings_view_all', label: 'View all bookings' },
            { id: 'bookings_view_assigned', label: 'View bookings for assigned properties' },
        ]
    },
    {
        id: 'reports',
        label: 'Reports',
        description: 'Permissions for accessing and generating reports.',
        permissions: [
            { id: 'reports_view', label: 'View performance and operational reports' },
        ]
    },
    {
        id: 'settings',
        label: 'Account Settings',
        description: 'Permissions for managing account-wide settings.',
        permissions: [
            { id: 'settings_manage', label: 'Access and modify general account settings' },
            { id: 'roles_manage', label: 'Create and manage custom roles and their permissions' },
        ]
    },
];

// Helper to create initial permission states from categories
// Ensures all permission IDs from PERMISSION_CATEGORIES are present, defaulted to false
export const INITIAL_PERMISSIONS_STATE = PERMISSION_CATEGORIES.reduce((acc, category) => {
    category.permissions.forEach(permission => {
        acc[permission.id] = false;
    });
    return acc;
}, {});

// Define standard built-in roles with their default permissions
// These roles cannot be deleted, but their permissions can be customized by the owner.
export const STANDARD_ROLES = [
    {
        id: 'Owner',
        label: 'Owner',
        description: 'Has full administrative control and access to all features. This role cannot be deleted.',
        isDeletable: false,
        isEditable: true, // Permissions can be viewed/edited by owner, but defaults are all true
        defaultPermissions: Object.keys(INITIAL_PERMISSIONS_STATE).reduce((acc, permId) => {
            acc[permId] = true; // Owner has all permissions by default
            return acc;
        }, {}),
    },
    {
        id: 'Admin',
        label: 'Admin',
        description: 'Comprehensive administrative control, excluding critical owner-level actions. Can manage properties, tasks, team, and custom roles.',
        isDeletable: false, // Standard Admin role cannot be deleted
        isEditable: true,
        defaultPermissions: {
            ...INITIAL_PERMISSIONS_STATE, // Start with all false
            'properties_view_all': true,
            'properties_create_edit_delete': true,
            'tasks_view_all': true,
            'tasks_create_edit_delete': true,
            'tasks_assign_others': true,
            'tasks_complete': true,
            'team_manage': true,
            'checklists_manage': true,
            'checklists_complete': true,
            'inventory_view': true,
            'inventory_manage': true, // Admin can manage all inventory
            'bookings_manage': true,
            'bookings_view_all': true,
            'bookings_view_assigned': true,
            'reports_view': true,
            'settings_manage': true,
            'roles_manage': true, // Admins can manage custom roles
        }
    },
    {
        id: 'Manager',
        label: 'Manager',
        description: 'Manages properties, tasks, and can assign team members for assigned properties. Cannot create/delete properties globally or manage team members.',
        isDeletable: false,
        isEditable: true,
        defaultPermissions: {
            ...INITIAL_PERMISSIONS_STATE, // Start with all false
            'properties_view_assigned': true, // Can only view assigned
            'tasks_view_assigned': true,
            'tasks_create_edit_delete': true,
            'tasks_assign_others': true,
            'tasks_complete': true,
            'checklists_manage': true, // Managers can manage checklist templates
            'checklists_complete': true,
            'inventory_view': true,
            'inventory_manage': true, // Managers can manage inventory for assigned properties
            'bookings_view_assigned': true,
            'reports_view': true, // Managers might see reports for assigned
        }
    },
    {
        id: 'Cleaner',
        label: 'Cleaner',
        description: 'Primarily handles cleaning tasks and updates inventory for assigned properties. Can mark tasks and checklist items complete.',
        isDeletable: false,
        isEditable: true,
        defaultPermissions: {
            ...INITIAL_PERMISSIONS_STATE, // Start with all false
            'properties_view_assigned': true,
            'tasks_view_assigned': true,
            'tasks_complete': true,
            'checklists_complete': true,
            'inventory_view': true,
            'inventory_manage': false, // Cleaners might view/update stock, but not manage locations
            'inventory_update_stock_levels': true, // Specific permission for updating stock
        }
    },
    {
        id: 'Maintenance',
        label: 'Maintenance',
        description: 'Handles maintenance tasks and related inventory for assigned properties. Can mark tasks and checklist items complete.',
        isDeletable: false,
        isEditable: true,
        defaultPermissions: {
            ...INITIAL_PERMISSIONS_STATE, // Start with all false
            'properties_view_assigned': true,
            'tasks_view_assigned': true,
            'tasks_complete': true,
            'checklists_complete': true,
            'inventory_view': true,
            'inventory_manage': false, // Maintenance might view/update stock, but not manage locations
            'inventory_update_stock_levels': true, // Specific permission for updating stock
        }
    }
];