// src/components/admin/tabs/DocumentsTab.js
import React from 'react';
import { DocumentPlusIcon, FolderIcon } from '@heroicons/react/24/outline';

const DocumentsTab = () => {
    // Mock data for documents - in a real app, you'd fetch this.
    const documents = [
        { id: 1, name: 'Management Agreement.pdf', date: '2025-01-15', size: '1.2MB' },
        { id: 2, name: 'Property Insurance Policy.pdf', date: '2025-02-01', size: '3.4MB' },
        { id: 3, name: 'Client Onboarding Form.docx', date: '2025-01-14', size: '450KB' },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Client Documents</h3>
                <button className="button-primary flex items-center gap-2">
                    <DocumentPlusIcon className="w-5 h-5" />
                    Upload Document
                </button>
            </div>
            <div className="mt-4">
                <ul className="space-y-3">
                    {documents.map(doc => (
                        <li key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center gap-3">
                                <FolderIcon className="w-6 h-6 text-gray-500" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{doc.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Uploaded on {doc.date}
                                    </p>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{doc.size}</div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DocumentsTab;