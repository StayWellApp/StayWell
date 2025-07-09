// --- src/config/permissions.js ---

export const PERMISSION_CATEGORIES = [
    {
        id: 'properties',
        label: 'Properties',
        description: 'Permissions related to viewing and managing properties.',
        permissions: [
            { id: 'properties_view_all', label: 'View all properties in the account' },
            { id: 'properties_manage', label: 'Create, edit, and delete properties' },
        ]
    },
    {
        id: 'tasks',
        label: 'Tasks',
        description: 'Permissions for handling tasks and assignments.',
        permissions: [
            { id: 'tasks_view_all', label: 'View all tasks for all properties' },
            { id: 'tasks_view_assigned_only', label: 'Can only see tasks specifically assigned to them' },
            { id: 'tasks_manage', label: 'Create, edit, and delete any task' },
            { id: 'tasks_assign', label: 'Assign tasks to other team members' },
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
        id: 'templates',
        label: 'Checklist Templates',
        description: 'Permissions for creating and managing templates.',
        permissions: [
            { id: 'templates_manage', label: 'Create, edit, and delete checklist templates' },
        ]
    },
    {
        id: 'storage',
        label: 'Storage & Inventory',
        description: 'Permissions for viewing and managing inventory.',
        permissions: [
            { id: 'storage_view', label: 'View storage locations and stock levels' },
            { id: 'storage_manage', label: 'Update stock levels and manage locations' },
        ]
    }
];

// Helper to get a flat list of all permission IDs
export const ALL_PERMISSION_IDS = PERMISSION_CATEGORIES.flatMap(cat => cat.permissions.map(p => p.id));