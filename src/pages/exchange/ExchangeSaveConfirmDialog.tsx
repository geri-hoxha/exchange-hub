import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { ExchangeCustomer, SaveConfirmFormValues } from "./types";

interface ExchangeSaveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  actualReceivedAssetLabel?: string;
  actualPaidAssetLabel?: string;
  loadingCustomers: boolean;
  customers: ExchangeCustomer[];
  onSearchCustomers: (query: string) => void | Promise<void>;
  savingExchange: boolean;
  initialValues: SaveConfirmFormValues;
  onSubmit: (values: SaveConfirmFormValues) => void | Promise<void>;
}

const ExchangeSaveConfirmDialog = ({
  open,
  onOpenChange,
  quoteId,
  actualReceivedAssetLabel,
  actualPaidAssetLabel,
  loadingCustomers,
  customers,
  onSearchCustomers,
  savingExchange,
  initialValues,
  onSubmit,
}: ExchangeSaveConfirmDialogProps) => {
  const { control, handleSubmit, register, reset } = useForm<SaveConfirmFormValues>({
    defaultValues: initialValues,
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState("");

  useEffect(() => {
    if (open) {
      reset(initialValues);
      setCustomerSearch("");
      setCustomerOpen(false);
      setSelectedCustomerLabel("");
    }
  }, [open, initialValues, onSearchCustomers, reset]);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => {
      void onSearchCustomers(customerSearch.trim());
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [customerSearch, onSearchCustomers, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Confirm Exchange</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2.5 sm:gap-3">
            {/* Quote ID */}
            <div className="grid gap-1">
              <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">Quote Id</label>
              <Input value={quoteId} readOnly className="h-8 sm:h-9 font-mono text-[10px] sm:text-xs" />
            </div>

            {/* Customer */}
            <div className="grid gap-1">
              <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">Customer</label>
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerOpen}
                        className="h-8 sm:h-9 w-full justify-between bg-background font-medium text-xs sm:text-sm"
                      >
                        <span className="truncate">
                          {field.value
                            ? (customers.find((customer) => String(customer.id) === field.value)?.name ?? selectedCustomerLabel)
                            : "Select customer"}
                        </span>
                        <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Type customer name..."
                          value={customerSearch}
                          onValueChange={setCustomerSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {loadingCustomers ? "Searching..." : "No customer found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {customers.map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={customer.name}
                                onSelect={() => {
                                  field.onChange(String(customer.id));
                                  setSelectedCustomerLabel(customer.name);
                                  setCustomerOpen(false);
                                  setCustomerSearch(customer.name);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    String(customer.id) === field.value ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {customer.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>

            {/* Final Amount + Occurred At */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="grid gap-1">
                <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">Final Amount</label>
                <Input
                  type="number"
                  {...register("finalAmount")}
                  className="h-8 sm:h-9 font-mono text-xs sm:text-sm"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">Occurred At</label>
                <Input
                  type="datetime-local"
                  {...register("occurredAt")}
                  className="h-8 sm:h-9 font-mono text-[10px] sm:text-xs"
                />
              </div>
            </div>

            {/* Actual Received + Paid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="grid gap-1">
                <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest leading-tight">
                  {`Received${actualReceivedAssetLabel ? ` (${actualReceivedAssetLabel})` : ""}`}
                </label>
                <Input
                  type="number"
                  {...register("actualReceivedAmount")}
                  className="h-8 sm:h-9 font-mono text-xs sm:text-sm"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest leading-tight">
                  {`Paid${actualPaidAssetLabel ? ` (${actualPaidAssetLabel})` : ""}`}
                </label>
                <Input
                  type="number"
                  {...register("actualPaidAmount")}
                  className="h-8 sm:h-9 font-mono text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Reference No */}
            <div className="grid gap-1">
              <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">Reference No</label>
              <Input
                {...register("referenceNo")}
                className="h-8 sm:h-9 font-mono text-xs sm:text-sm"
                placeholder="Optional"
              />
            </div>

            {/* Note */}
            <div className="grid gap-1">
              <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">Note</label>
              <Textarea
                {...register("note")}
                className="min-h-[60px] sm:min-h-[84px] resize-y text-xs sm:text-sm"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="flex-1 h-9 sm:h-10 text-xs sm:text-sm">
              Cancel
            </Button>
            <Button type="submit" disabled={savingExchange} className="flex-1 h-9 sm:h-10 text-xs sm:text-sm">
              {savingExchange ? "Saving..." : "Confirm & Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExchangeSaveConfirmDialog;
