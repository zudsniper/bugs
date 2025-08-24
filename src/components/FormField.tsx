import React from 'react';
import { Field } from '../types';

interface FormFieldProps {
  field: Field;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function FormField({ field, value, onChange, error }: FormFieldProps) {
  const commonProps = {
    id: field.key,
    value: value || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
      onChange(e.target.value),
    placeholder: field.placeholder,
    required: field.required,
    className: `${getFieldClass(field.type)} ${error ? 'br-error' : ''}`
  };

  const renderField = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={4}
            style={{ minHeight: '80px', resize: 'vertical' }}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            {field.placeholder && (
              <option value="" disabled>
                {field.placeholder}
              </option>
            )}
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
              required={field.required}
            />
            <span>{field.label}</span>
          </label>
        );

      case 'file':
        return (
          <input
            type="file"
            {...commonProps}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              // Handle file upload logic here if needed
              onChange(files.map(f => f.name).join(', '));
            }}
            multiple
          />
        );

      case 'number':
        return (
          <input
            type="number"
            {...commonProps}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            {...commonProps}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            {...commonProps}
          />
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            {...commonProps}
            pattern={field.validation?.pattern?.source}
          />
        );
    }
  };

  // For checkbox fields, we don't need the label wrapper
  if (field.type === 'checkbox') {
    return (
      <div className="br-form-group">
        {renderField()}
        {error && <div className="br-error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="br-form-group">
      <label htmlFor={field.key} className="br-label">
        {field.label}
        {field.required && <span className="br-required"> *</span>}
      </label>
      {renderField()}
      {error && <div className="br-error">{error}</div>}
      {field.validation?.message && !error && (
        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
          {field.validation.message}
        </div>
      )}
    </div>
  );
}

function getFieldClass(type: Field['type']): string {
  switch (type) {
    case 'textarea':
      return 'br-textarea';
    case 'select':
      return 'br-select';
    default:
      return 'br-input';
  }
}