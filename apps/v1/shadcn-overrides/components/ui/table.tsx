"use client";

import { cn } from "@/shadcn/lib/utils";
import React from "react";

// Propsに noWrapper と containerClassName を追加
interface TableProps extends React.ComponentProps<"table"> {
  noWrapper?: boolean;
  containerClassName?: string;
}

function Table({
  className,
  noWrapper,
  containerClassName,
  ...props
}: TableProps) {
  const tableElement = (
    <table
      data-slot="table"
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  );

  if (noWrapper) {
    return tableElement;
  }

  return (
    <div
      data-slot="table-container"
      className={cn("relative w-full overflow-x-auto", containerClassName)}
    >
      {tableElement}
    </div>
  );
}

export * from "@/shadcn/components/ui/table";
export { Table };
