"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import Input from "@/components/ui/Input";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { type EditableField } from "@/lib/types/page-builder";

interface FormFieldProps {
  field: EditableField;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export default function FormField({ field, value, onChange, disabled = false }: FormFieldProps) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (newValue: any) => {
    setError(null);
    
    // Validate the field
    if (field.required && (newValue === '' || newValue === null || newValue === undefined)) {
      setError(`${field.label} is required`);
    } else if (field.type === 'text' && field.maxLength && newValue && newValue.length > field.maxLength) {
      setError(`${field.label} must be ${field.maxLength} characters or less`);
    } else if (field.type === 'number' && newValue !== '' && newValue !== null) {
      const numValue = Number(newValue);
      if (isNaN(numValue)) {
        setError(`${field.label} must be a valid number`);
      } else if (field.min !== undefined && numValue < field.min) {
        setError(`${field.label} must be at least ${field.min}`);
      } else if (field.max !== undefined && numValue > field.max) {
        setError(`${field.label} must be at most ${field.max}`);
      }
    } else if (field.type === 'url' && newValue && newValue.trim()) {
      try {
        new URL(newValue);
      } catch {
        setError(`${field.label} must be a valid URL`);
      }
    }
    
    onChange(newValue);
  };

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            maxLength={field.maxLength}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            maxLength={field.maxLength}
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
        );

      case 'richtext':
        return (
          <RichTextEditor
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            disabled={disabled}
            namespace={`field-${field.key}`}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            min={field.min}
            max={field.max}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder || 'https://example.com'}
            disabled={disabled}
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Enable {field.label}
            </span>
          </label>
        );

      case 'image':
        return (
          <div className="space-y-3">
            <Input
              type="url"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Image URL or upload an image"
              disabled={disabled}
            />
            {value && (
              <div className="relative">
                <img
                  src={value}
                  alt="Preview"
                  className="w-full max-w-xs h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter an image URL or upload functionality will be added later
            </p>
          </div>
        );

      case 'color':
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              className="w-12 h-10 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Input
              type="text"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="#000000"
              disabled={disabled}
              className="flex-1"
            />
          </div>
        );

      case 'accordion-items':
        return <AccordionItemsField value={value} onChange={handleChange} disabled={disabled} />;

      case 'statistics-items':
        return <StatisticsItemsField value={value} onChange={handleChange} disabled={disabled} />;

      case 'team-members':
        return <TeamMembersField value={value} onChange={handleChange} disabled={disabled} />;

      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {field.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {field.description}
        </p>
      )}
      
      {renderField()}
      
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

// Specialized field components

function AccordionItemsField({ value, onChange, disabled }: { value: any; onChange: (value: any) => void; disabled: boolean }) {
  const items = Array.isArray(value) ? value : [];

  const addItem = () => {
    onChange([...items, { title: '', content: '' }]);
  };

  const updateItem = (index: number, field: string, newValue: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: newValue };
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-3">
      {items.map((item: any, index: number) => (
        <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Item {index + 1}
            </span>
            <button
              onClick={() => removeItem(index)}
              disabled={disabled}
              className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <Input
            placeholder="Title"
            value={item.title || ''}
            onChange={(e) => updateItem(index, 'title', e.target.value)}
            disabled={disabled}
          />
          <textarea
            placeholder="Content"
            value={item.content || ''}
            onChange={(e) => updateItem(index, 'content', e.target.value)}
            disabled={disabled}
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      ))}
      <button
        onClick={addItem}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/5 disabled:opacity-50"
      >
        <Plus className="size-4" />
        Add Item
      </button>
    </div>
  );
}

function StatisticsItemsField({ value, onChange, disabled }: { value: any; onChange: (value: any) => void; disabled: boolean }) {
  const items = Array.isArray(value) ? value : [];

  const addItem = () => {
    onChange([...items, { value: '', label: '', icon: '' }]);
  };

  const updateItem = (index: number, field: string, newValue: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: newValue };
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-3">
      {items.map((item: any, index: number) => (
        <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Statistic {index + 1}
            </span>
            <button
              onClick={() => removeItem(index)}
              disabled={disabled}
              className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Value (e.g., 100+)"
              value={item.value || ''}
              onChange={(e) => updateItem(index, 'value', e.target.value)}
              disabled={disabled}
            />
            <Input
              placeholder="Label"
              value={item.label || ''}
              onChange={(e) => updateItem(index, 'label', e.target.value)}
              disabled={disabled}
            />
          </div>
          <Input
            placeholder="Icon (emoji or icon name)"
            value={item.icon || ''}
            onChange={(e) => updateItem(index, 'icon', e.target.value)}
            disabled={disabled}
          />
        </div>
      ))}
      <button
        onClick={addItem}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/5 disabled:opacity-50"
      >
        <Plus className="size-4" />
        Add Statistic
      </button>
    </div>
  );
}

function TeamMembersField({ value, onChange, disabled }: { value: any; onChange: (value: any) => void; disabled: boolean }) {
  const items = Array.isArray(value) ? value : [];

  const addItem = () => {
    onChange([...items, { name: '', role: '', bio: '', image: '', email: '' }]);
  };

  const updateItem = (index: number, field: string, newValue: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: newValue };
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-3">
      {items.map((item: any, index: number) => (
        <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Team Member {index + 1}
            </span>
            <button
              onClick={() => removeItem(index)}
              disabled={disabled}
              className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Name"
              value={item.name || ''}
              onChange={(e) => updateItem(index, 'name', e.target.value)}
              disabled={disabled}
            />
            <Input
              placeholder="Role"
              value={item.role || ''}
              onChange={(e) => updateItem(index, 'role', e.target.value)}
              disabled={disabled}
            />
          </div>
          <Input
            placeholder="Image URL"
            value={item.image || ''}
            onChange={(e) => updateItem(index, 'image', e.target.value)}
            disabled={disabled}
          />
          <Input
            placeholder="Email"
            value={item.email || ''}
            onChange={(e) => updateItem(index, 'email', e.target.value)}
            disabled={disabled}
          />
          <textarea
            placeholder="Bio"
            value={item.bio || ''}
            onChange={(e) => updateItem(index, 'bio', e.target.value)}
            disabled={disabled}
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      ))}
      <button
        onClick={addItem}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/5 disabled:opacity-50"
      >
        <Plus className="size-4" />
        Add Team Member
      </button>
    </div>
  );
}