import { type ComponentType } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  size?: "lg" | "md";
  centered?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  size = "lg",
  centered = false,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn(centered && "text-center", className)}>
      <h1
        className={cn(
          "font-bold text-slate-900 dark:text-white flex items-center gap-2",
          size === "lg" ? "text-2xl" : "text-xl",
          centered && "justify-center",
        )}
      >
        {Icon && <Icon className={cn("text-primary shrink-0", size === "lg" ? "h-5 w-5" : "h-5 w-5")} />}
        {title}
      </h1>
      {subtitle && (
        <p
          className={cn(
            "text-sm text-slate-600 dark:text-slate-300 font-medium mt-1",
            centered && "max-w-2xl mx-auto",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
