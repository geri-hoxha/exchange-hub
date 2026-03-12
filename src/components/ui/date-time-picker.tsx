import { useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const parseDateValue = (value: string): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const DateTimePicker = ({ value, onChange, placeholder = "Pick a date" }: DateTimePickerProps) => {
  const parsedDate = useMemo(() => parseDateValue(value), [value]);
  const formattedTime = parsedDate ? format(parsedDate, "HH:mm") : "00:00";

  const updateDate = (nextDate: Date) => {
    const base = parsedDate ?? new Date();
    const merged = new Date(base);
    merged.setFullYear(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
    onChange(merged.toISOString());
  };

  const updateTime = (nextTime: string) => {
    const [hours, minutes] = nextTime.split(":").map((part) => Number(part));
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return;

    const base = parsedDate ?? new Date();
    const merged = new Date(base);
    merged.setHours(hours, minutes, 0, 0);
    onChange(merged.toISOString());
  };

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("flex-1 justify-start text-left font-normal", !parsedDate && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {parsedDate ? format(parsedDate, "dd MMM yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={(selectedDate) => selectedDate && updateDate(selectedDate)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        value={formattedTime}
        onChange={(event) => updateTime(event.target.value)}
        className="w-28"
      />
    </div>
  );
};

export default DateTimePicker;
