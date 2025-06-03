import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function PageHeader({
  title,
  description,
  titleClassName,
  descriptionClassName,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("py-12 text-center animate-fade-in", className)} {...props}>
      <h1
        className={cn(
          "text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl font-headline text-foreground",
          titleClassName
        )}
      >
        {title}
      </h1>
      {description && (
        <p
          className={cn(
            "mt-4 max-w-2xl mx-auto text-lg text-muted-foreground",
            descriptionClassName
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
