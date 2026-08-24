// resources/js/Components/Form/InputGroup.tsx
import React from 'react';

interface InputGroupProps {
    label: string;
    name: string;
    value: string;
    type?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

export const InputGroup: React.FC<InputGroupProps> = ({
    label,
    name,
    value,
    type = 'text',
    onChange,
    required = false
}) => (
    <div className="mb-4">
        <label htmlFor={name} className="block font-medium mb-1">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className="w-full px-3 py-2 border rounded-md"
        />
    </div>
);
