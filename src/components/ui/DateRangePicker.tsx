"use client";

import * as Popover from "@radix-ui/react-popover";
import { useEffect, useMemo, useState } from "react";
import Input from "./Input";
import Button from "./Button";
import { Calendar } from "lucide-react";

export type DateRange = { start?: string; end?: string };

function formatDisplay(range: DateRange) {
  const fmt = new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const parse = (s?: string) => (s ? new Date(s + "T00:00:00") : undefined);
  const s = parse(range.start);
  const e = parse(range.end);
  if (s && e) return `${fmt.format(s)} - ${fmt.format(e)}`;
  if (s) return fmt.format(s);
  if (e) return fmt.format(e);
  return "Select date range";
}

export default function DateRangePicker({
  value,
  onChange,
  defaultRange,
  className,
}: {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  defaultRange?: DateRange;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<DateRange>(defaultRange ?? {});
  const [temp, setTemp] = useState<DateRange>(value ?? defaultRange ?? {});

  // Sync temp when opening or when value changes
  useEffect(() => {
    if (open) {
      setTemp(value ?? internalValue);
    }
  }, [open, value, internalValue]);

  const effectiveValue = value ?? internalValue;
  const display = useMemo(() => formatDisplay(effectiveValue), [effectiveValue]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" aria-label="Choose date range" className="relative group">
          <Input asChild className={`w-72 ${className ?? ""}`}>
            <span className={`inline-flex items-center w-full h-10 px-3 pr-8 text-left ${!effectiveValue.start && !effectiveValue.end ? "text-gray-500" : ""}`}>
              <span className="flex-1 truncate">{display}</span>
            </span>
          </Input>
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-hover:text-primary transition-colors" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Content className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg data-[side=bottom]:mt-2 w-[340px] z-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase text-gray-500 mb-1.5 block" htmlFor="range-start">Start date</label>
            <Input
              id="range-start"
              type="date"
              value={temp.start ?? ""}
              onChange={(e) => setTemp((r) => ({ ...r, start: e.target.value || undefined }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-gray-500 mb-1.5 block" htmlFor="range-end">End date</label>
            <Input
              id="range-end"
              type="date"
              value={temp.end ?? ""}
              onChange={(e) => setTemp((r) => ({ ...r, end: e.target.value || undefined }))}
              className="w-full"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" className="h-8 px-3 text-sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            type="button"
            className="h-8 px-3 text-sm bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
            onClick={() => {
              setInternalValue(temp);
              onChange?.(temp);
              setOpen(false);
            }}
          >
            Apply Filters
          </Button>
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
