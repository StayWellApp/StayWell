// src/components/property/PropertyAutomationView.js
// This new component allows managers to create and manage task automation rules for a property.

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
// --- CORRECTED LINE ---
import { doc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Bot, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const RuleEditor = ({ rule, onUpdate, onRemove, team, checklistTemplates }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const handleFieldChange = (field, value) => {
        onUpdate({ ...rule, [field]: value });
    };

    const handleTimelineChange = (field, value) => {
        const newTimeline = { ...(rule.timeline || {}), [field]: parseInt(value, 10) || 0 };
        onUpdate({ ...rule, timeline: newTimeline });
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border dark:border-gray-700 space-y-3">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">{rule.ruleName || 'New Rule'}</h4>
                <div className="flex items-center space-x-2">
                    <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 text-red-500 hover:text-red-400">
                        <Trash2 size={16} />
                    </button>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {isExpanded && (
                <div className="animate-fade-in-down space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rule Name</label>
                            <input type="text" value={rule.ruleName} onChange={e => handleFieldChange('ruleName', e.target.value)} className="mt-1 w-full input-style" placeholder="e.g., Standard Cleaning" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Type</label>
                            <select value={rule.taskType} onChange={e => handleFieldChange('taskType', e.target.value)} className="mt-1 w-full input-style">
                                <option value="Cleaning">Cleaning</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Inspection">Inspection</option>
                            </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Assignee</label>
                            <select value={rule.defaultAssignee} onChange={e => handleFieldChange('defaultAssignee', e.target.value)} className="mt-1 w-full input-style">
                                <option value="">Unassigned</option>
                                {team.map(member => <option key={member.id} value={member.id}>{member.email}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fallback Assignee</label>
                            <select value={rule.fallbackAssignee} onChange={e => handleFieldChange('fallbackAssignee', e.target.value)} className="mt-1 w-full input-style">
                                <option value="">None</option>
                                {team.map(member => <option key={member.id} value={member.id}>{member.email}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Checklist Template</label>
                        <select value={rule.checklistTemplateId} onChange={e => handleFieldChange('checklistTemplateId', e.target.value)} className="mt-1 w-full input-style">
                            <option value="">None</option>
                            {checklistTemplates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Timeline Trigger: After Check-Out</label>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Define when the task is due. E.g., Due 1 day after check-out.</p>
                        <div className="flex items-center space-x-2">
                             <input type="number" value={rule.timeline?.daysAfterCheckout || 0} onChange={e => handleTimelineChange('daysAfterCheckout', e.target.value)} className="w-24 input-style" />
                             <span className="text-sm text-gray-600 dark:text-gray-300">days after check-out</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export const AutomationView = ({ property }) => {
    const [rules, setRules] = useState([]);
    const [team, setTeam] = useState([]);
    const [checklistTemplates, setChecklistTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch rules
        const rulesDocRef = doc(db, 'automationRules', property.id);
        const unsubscribeRules = onSnapshot(rulesDocRef, (doc) => {
            if (doc.exists()) {
                setRules(doc.data().rules || []);
            } else {
                setRules([]);
            }
            setLoading(false);
        });

        // Fetch team (simplified version)
        const teamQuery = query(collection(db, 'users'), where('ownerId', '==', property.ownerId));
        const unsubscribeTeam = onSnapshot(teamQuery, (snapshot) => {
            setTeam(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        
        // Fetch checklist templates
        const templatesQuery = query(collection(db, 'checklistTemplates'), where('ownerId', '==', property.ownerId));
        const unsubscribeTemplates = onSnapshot(templatesQuery, (snapshot) => {
            setChecklistTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeRules();
            unsubscribeTeam();
            unsubscribeTemplates();
        };
    }, [property.id, property.ownerId]);

    const handleAddNewRule = () => {
        const newRule = {
            id: `rule_${Date.now()}`, // Simple unique ID
            ruleName: 'New Cleaning Rule',
            taskType: 'Cleaning',
            trigger: 'check-out',
            timeline: { daysAfterCheckout: 1 },
            defaultAssignee: '',
            fallbackAssignee: '',
            checklistTemplateId: '',
        };
        setRules([...rules, newRule]);
    };

    const handleUpdateRule = (index, updatedRule) => {
        const newRules = [...rules];
        newRules[index] = updatedRule;
        setRules(newRules);
    };

    const handleRemoveRule = (index) => {
        const newRules = rules.filter((_, i) => i !== index);
        setRules(newRules);
    };

    const handleSaveChanges = async () => {
        const toastId = toast.loading("Saving automation rules...");
        try {
            const rulesDocRef = doc(db, 'automationRules', property.id);
            await setDoc(rulesDocRef, { rules: rules });
            toast.update(toastId, { render: "Rules saved successfully!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            console.error("Error saving rules: ", error);
            toast.update(toastId, { render: "Failed to save rules.", type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                            <Bot size={20} className="mr-3 text-purple-500" /> Automation Rules Engine
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Define rules to automatically create tasks when a guest checks out.
                        </p>
                    </div>
                     <button onClick={handleSaveChanges} className="button-primary">Save Changes</button>
                </div>
               
                <div className="mt-6 space-y-4">
                    {loading ? <p>Loading rules...</p> : (
                        rules.map((rule, index) => (
                            <RuleEditor
                                key={rule.id || index}
                                rule={rule}
                                onUpdate={(updatedRule) => handleUpdateRule(index, updatedRule)}
                                onRemove={() => handleRemoveRule(index)}
                                team={team}
                                checklistTemplates={checklistTemplates}
                            />
                        ))
                    )}
                     <button onClick={handleAddNewRule} className="button-secondary w-full flex items-center justify-center">
                        <Plus size={16} className="mr-2"/> Add New Rule
                    </button>
                </div>
            </div>
        </div>
    );
};