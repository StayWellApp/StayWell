import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react'; // For dropdown arrow

const CustomSelect = ({ options, value, onChange, placeholder = "Select an option", id, labelText }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);

    const selectedOption = options.find(option => option.value === value) || null;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={selectRef}>
            {labelText && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {labelText}
                </label>
            )}
            <button
                type="button"
                id={id}
                onClick={() => setIsOpen(!isOpen)}
                className="input-style flex items-center justify-between w-full cursor-pointer text-left"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="flex items-center">
                    {selectedOption?.flagClass && <span className={`${selectedOption.flagClass} fi-2x mr-2`}></span>} {/* Flag */}
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className={`transform transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>

            {isOpen && (
                <ul
                    role="listbox"
                    className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
                >
                    {options.map(option => (
                        <li
                            key={option.value}
                            role="option"
                            aria-selected={option.value === value}
                            onClick={() => handleSelect(option.value)}
                            className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center ${
                                option.value === value ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200' : 'text-gray-900 dark:text-gray-100'
                            }`}
                        >
                            {option.flagClass && <span className={`${option.flagClass} fi-2x mr-2`}></span>} {/* Flag */}
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CustomSelect;