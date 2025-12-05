"use client";

import * as Popover from "@radix-ui/react-popover";
import { useMemo, useState } from "react";
import Input from "./Input";
import Button from "./Button";
import { Calendar } from "lucide-react";

type Range = { start?: string; end?: string };

function formatDisplay(range: Range) {
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
  defaultRange,
  className,
}: {
  defaultRange?: Range;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<Range>(defaultRange ?? {});
  const [value, setValue] = useState<Range>(defaultRange ?? {});

  const display = useMemo(() => formatDisplay(value), [value]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" aria-label="Choose date range" className="relative">
          <Input asChild className={`w-72 ${className ?? ""}`}>
            <span className="inline-flex items-center w-full h-10 px-3 pr-8 text-left">
              <span className="flex-1 truncate">{display}</span>
            </span>
          </Input>
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Content className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg data-[side=bottom]:mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="range-start">Start date</label>
            <Input id="range-start" type="date" value={temp.start ?? ""} onChange={(e) => setTemp((r) => ({ ...r, start: e.target.value }))} className="mt-1 w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="range-end">End date</label>
            <Input id="range-end" type="date" value={temp.end ?? ""} onChange={(e) => setTemp((r) => ({ ...r, end: e.target.value }))} className="mt-1 w-full" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" className="h-9 px-3 text-sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            type="button"
            className="h-9 px-3 text-sm"
            onClick={() => {
              setValue(temp);
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
