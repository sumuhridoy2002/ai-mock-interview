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
          size === "lg" ? "text-3xl" : "text-2xl",
          centered && "justify-center",
        )}
      >
        {Icon && <Icon className="h-6 w-6 text-primary shrink-0" />}
        {title}
      </h1>
      {subtitle && (
        <p
          className={cn(
            "text-slate-600 dark:text-slate-300 font-medium mt-1",
            size === "md" && "text-sm",
            centered && "max-w-2xl mx-auto",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
