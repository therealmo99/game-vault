import { useState, type KeyboardEvent } from "react";
import { cn } from "../../lib/utils";

interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div role="tablist" className={cn("tabs", className)} aria-orientation="horizontal">
      {items.map((item, index) => (
        <button
          key={item.value}
          role="tab"
          aria-selected={value === item.value}
          aria-controls={`panel-${item.value}`}
          id={`tab-${item.value}`}
          tabIndex={value === item.value ? 0 : -1}
          disabled={item.disabled}
          className={cn("tab", value === item.value && "tab-active", item.disabled && "opacity-40 cursor-not-allowed")}
          onClick={() => !item.disabled && onChange(item.value)}
          onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
            if (item.disabled) return;
            let newIndex = index;
            if (e.key === "ArrowRight") newIndex = (index + 1) % items.length;
            if (e.key === "ArrowLeft") newIndex = (index - 1 + items.length) % items.length;
            if (e.key === "Home") newIndex = 0;
            if (e.key === "End") newIndex = items.length - 1;
            if (newIndex !== index) {
              e.preventDefault();
              onChange(items[newIndex].value);
            }
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

interface TabPanelProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ value, children, className }: TabPanelProps) {
  return <div role="tabpanel" id={`panel-${value}`} aria-labelledby={`tab-${value}`} className={className}>{children}</div>;
}