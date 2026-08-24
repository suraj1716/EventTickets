// resources/js/Components/App/ui/RadioGroup.tsx
//
// Consolidates the horizontal pill-radio pattern first built for Contact.tsx's
// "Preferred Contact Method" field. Reusable anywhere a form needs a small,
// single-select choice among 2-4 options (shipping method, payment method,
// delivery preference, etc.) instead of a full <Select>.
//
// Usage:
//   <RadioGroup
//     name="preferredContact"
//     options={[{ value: "email", label: "email" }, { value: "phone", label: "phone" }]}
//     value={data.preferredContact}
//     onChange={(v) => setData("preferredContact", v)}
//   />

import React from "react";

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function RadioGroup({
  name,
  options,
  value,
  onChange,
}: RadioGroupProps) {
  return (
    <div className="radio-group">
      {options.map((opt) => (
        <div className="radio-option" key={opt.value}>
          <input
            type="radio"
            id={`${name}-${opt.value}`}
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <label htmlFor={`${name}-${opt.value}`}>{opt.label}</label>
        </div>
      ))}
    </div>
  );
}
