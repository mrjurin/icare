"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

type SearchableSelectOption = {
  value: string | number;
  label: string;
  description?: string;
};

type SearchableSelectProps = {
  options: SearchableSelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
  name?: string;
  id?: string;
};

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  required = false,
  disabled = false,
  className = "",
  emptyMessage = "No options found",
  name,
  id,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.description?.toLowerCase().includes(query) ||
        String(opt.value).toLowerCase().includes(query)
    );
  }, [options, search]);

  // Get selected option display text
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  // Focus search input when popover opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else if (!open) {
      setSearch("");
    }
  }, [open]);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setOpen(false);
    setSearch("");
  };

  // For form validation, we need a hidden select element
  const hasValue = value !== null && value !== undefined && value !== 0 && value !== "";
  
  return (
    <>
      {required && (
        <select
          name={name}
          id={id}
          required={required}
          value={hasValue ? value : ""}
          onChange={() => {}} // Controlled by SearchableSelect
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
      <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={`w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between ${
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-gray-400 dark:hover:border-gray-600"
            } ${!hasValue && required ? "border-red-300 dark:border-red-700" : ""} ${className}`}
          >
          <span className={selectedOption ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="size-4 text-gray-400 shrink-0 ml-2" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-[200] w-[var(--radix-popover-trigger-width)] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark shadow-lg"
          sideOffset={4}
          align="start"
          style={{ maxHeight: '300px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            searchInputRef.current?.focus();
          }}
          onEscapeKeyDown={() => {
            setOpen(false);
          }}
          onPointerDownOutside={(e) => {
            // Don't close if clicking inside the popover
            const target = e.target as HTMLElement;
            if (target.closest('[data-radix-popover-content]')) {
              e.preventDefault();
            }
          }}
        >
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-3 flex-shrink-0">
            <Search className="size-4 text-gray-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              className="flex-1 h-10 px-2 text-sm bg-transparent outline-none placeholder:text-gray-400 text-gray-900 dark:text-white"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
            />
          </div>
          <div 
            className="overflow-y-auto p-1"
            style={{ flex: '1 1 auto', minHeight: 0, maxHeight: '100%' }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = String(option.value) === String(value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {option.description}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="size-4 text-primary shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
    </>
  );
}
