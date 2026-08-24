// resources/js/Components/App/ui/Select.tsx
//
// Wraps the ".select-wrapper > select" pattern that Contact.tsx repeated
// four times (reason, department, category, product). Any future page with
// a themed dropdown (filters, checkout shipping method, etc.) should reach
// for this instead of hand-rolling the wrapper div again.
//
// Usage:
//   <Select
//     id="reason"
//     value={data.reason}
//     onChange={(v) => setData("reason", v)}
//     placeholder="Select reason"
//     options={contactReasons}
//     required
//   />

import React from "react";

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  style?: React.CSSProperties;
}

export default function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
  required,
  style,
}: SelectProps) {
  return (
    <div className="select-wrapper">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={style}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
