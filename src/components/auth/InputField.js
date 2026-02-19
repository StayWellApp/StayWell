import React from 'react';

const InputField = React.memo(({ id, type, placeholder, value, onChange, icon: Icon }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <input id={id} name={id} type={type} required
            className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={placeholder} value={value} onChange={onChange}
        />
    </div>
));

export default InputField;
