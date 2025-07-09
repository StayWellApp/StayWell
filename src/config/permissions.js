// staywellapp/staywell/StayWell-b674a0192561b2b27907bdae71b82cfa6713bb79/src/config/permissions.js
export const PERMISSION_CATEGORIES = [
    {
        id: 'properties',
        label: 'Properties',
        description: 'Permissions related to viewing and managing properties.',
        permissions: [
            { id: 'properties_view_all', label: 'View all properties in the account' },
            { id: 'properties_view_assigned', label: 'Can only view properties specifically assigned to them' },
            { id: 'properties_create_edit_delete', label: 'Create, edit, and delete properties' },
        ]
    },
    {
        id: 'tasks',
        label: 'Tasks',
        description: 'Permissions for handling tasks and assignments.',
        permissions: [
            { id: 'tasks_view_all', label: 'View all tasks for all properties' },
            { id: 'tasks_view_assigned', label: 'Can only view tasks specifically assigned to them' },
            { id: 'tasks_create_edit_delete', label: 'Create, edit, and delete any task' },
            { id: 'tasks_assign_others', label: 'Assign tasks to other team members' },
            { id: 'tasks_complete', label: 'Mark tasks as complete' }, // Added for cleaner/maintenance
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
            { id: 'checklists_complete', label: 'Complete checklists on properties' }, // Added for cleaner/maintenance
        ]
    },
    {
        id: 'inventory',
        label: 'Storage & Inventory',
        description: 'Permissions for viewing and managing inventory.',
        permissions: [
            { id: 'inventory_view', label: 'View storage locations and stock levels' },
            { id: 'inventory_update_stock_levels', label: 'Update stock levels and manage locations' },
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
            { id: 'roles_manage', label: 'Create and manage custom roles' }, // Ability to manage roles
        ]
    },
];

// Helper to create initial permission states from categories
export const INITIAL_PERMISSIONS_STATE = PERMISSION_CATEGORIES.reduce((acc, category) => {
    category.permissions.forEach(permission => {
        acc[permission.id] = false; // Default all to false
    });
    return acc;
}, {});


// Define standard built-in roles with their default permissions
// These permissions should be a subset/override of INITIAL_PERMISSIONS_STATE
export const STANDARD_ROLES = [
    {
        id: 'Owner',
        label: 'Owner',
        description: 'Has full administrative control and access to all features.',
        isDeletable: false, // Owner role cannot be deleted
        isEditable: true, // Owner's permissions can be viewed/edited (though often full access)
        // Default permissions for Owner - typically all true
        defaultPermissions: Object.keys(INITIAL_PERMISSIONS_STATE).reduce((acc, permId) => {
            acc[permId] = true;
            return acc;
        }, {}),
    },
    {
        id: 'Admin',
        label: 'Admin',
        description: 'Comprehensive administrative control, excluding critical owner-level actions like deleting the account or managing owner-specific settings.',
        isDeletable: false,
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
            'inventory_update_stock_levels': true,
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
        description: 'Manages properties, tasks, and team members for assigned properties. Cannot create/delete properties globally.',
        isDeletable: false,
        isEditable: true,
        defaultPermissions: {
            ...INITIAL_PERMISSIONS_STATE, // Start with all false
            'properties_view_assigned': true,
            'tasks_view_assigned': true,
            'tasks_create_edit_delete': true,
            'tasks_assign_others': true,
            'tasks_complete': true,
            'checklists_manage': true, // Can manage checklist templates
            'checklists_complete': true,
            'inventory_view': true,
            'inventory_update_stock_levels': true,
            'bookings_view_assigned': true,
        }
    },
    {
        id: 'Cleaner',
        label: 'Cleaner',
        description: 'Manages cleaning tasks and related inventory for assigned properties. Primarily completes tasks and updates stock.',
        isDeletable: false,
        isEditable: true,
        defaultPermissions: {
            ...INITIAL_PERMISSIONS_STATE, // Start with all false
            'properties_view_assigned': true,
            'tasks_view_assigned': true,
            'tasks_complete': true,
            'checklists_complete': true,
            'inventory_view': true,
            'inventory_update_stock_levels': true,
        }
    },
    {
        id: 'Maintenance',
        label: 'Maintenance',
        description: 'Manages maintenance tasks and related inventory for assigned properties. Primarily completes tasks and updates stock.',
        isDeletable: false,
        isEditable: true,
        defaultPermissions: {
            ...INITIAL_PERMISSIONS_STATE, // Start with all false
            'properties_view_assigned': true,
            'tasks_view_assigned': true,
            'tasks_complete': true,
            'checklists_complete': true,
            'inventory_view': true,
            'inventory_update_stock_levels': true,
        }
    }
];