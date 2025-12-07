"use client";

import { ReactNode } from "react";
import Pagination, { PaginationProps } from "./Pagination";

export interface DataTableProps {
  children: ReactNode;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  pagination?: PaginationProps;
  footer?: ReactNode;
}

export default function DataTable({
  children,
  emptyMessage = "No data found",
  emptyIcon,
  pagination,
  footer,
}: DataTableProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
      <div className="overflow-x-auto">{children}</div>
      {pagination && <Pagination {...pagination} />}
      {footer && !pagination && (
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">{footer}</div>
      )}
    </div>
  );
}

export function DataTableEmpty({
  message,
  icon,
  colSpan,
}: {
  message: string;
  icon?: ReactNode;
  colSpan: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
        {icon && <div className="flex justify-center mb-4">{icon}</div>}
        <p>{message}</p>
      </td>
    </tr>
  );
}
