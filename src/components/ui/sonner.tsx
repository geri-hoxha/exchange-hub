import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const isDark = document.documentElement.classList.contains("dark");

  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      position="top-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-popover group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl dark:group-[.toaster]:bg-secondary [&[data-type=success]_[data-icon]]:text-success [&[data-type=error]_[data-icon]]:text-destructive group-[.toaster]:text-sm group-[.toaster]:px-5 group-[.toaster]:py-4 group-[.toaster]:min-h-[56px]",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
