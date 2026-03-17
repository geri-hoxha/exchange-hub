import { useEffect, useMemo, useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { ExchangeCustomer, SaveConfirmFormValues } from "./types";

interface ExchangeSaveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  actualReceivedAssetLabel?: string;
  actualPaidAssetLabel?: string;
  actualReceivedMax?: number;
  actualPaidMax?: number;
  loadingCustomers: boolean;
  customers: ExchangeCustomer[];
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
  actualReceivedMax,
  actualPaidMax,
  loadingCustomers,
  customers,
  savingExchange,
  initialValues,
  onSubmit,
}: ExchangeSaveConfirmDialogProps) => {
  const { control, handleSubmit, register, reset, setValue } =
    useForm<SaveConfirmFormValues>({
      defaultValues: initialValues,
    });
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState("");
  const receivedLimit = Math.max(actualReceivedMax ?? 0, 0);
  const paidLimit = Math.max(actualPaidMax ?? 0, 0);

  const clampToMax = (rawValue: string, max: number) => {
    if (rawValue === "") return "";
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return "";
    if (parsed < 0) return "0";
    return String(Math.min(parsed, max));
  };

  useEffect(() => {
    if (open) {
      reset(initialValues);
      setCustomerSearch("");
      setCustomerOpen(false);
      setSelectedCustomerLabel("");
    }
  }, [open, initialValues, reset]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(query),
    );
  }, [customerSearch, customers]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            Confirm Exchange
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2.5 sm:gap-3">
            {/* Quote ID */}
            <div className="grid gap-1">
              <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Quote Id
              </label>
              <Input
                value={quoteId}
                readOnly
                className="h-8 sm:h-9 font-mono text-[10px] sm:text-xs"
              />
            </div>

            {/* Customer */}
            <div className="grid gap-1">
              <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Customer
              </label>
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
                            ? (customers.find(
                                (customer) =>
                                  String(customer.id) === field.value,
                              )?.name ?? selectedCustomerLabel)
                            : "Select customer"}
                        </span>
                        <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Type customer name..."
                          value={customerSearch}
                          onValueChange={setCustomerSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {loadingCustomers
                              ? "Loading customers..."
                              : "No customer found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredCustomers.map((customer) => (
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
                                    String(customer.id) === field.value
                                      ? "opacity-100"
                                      : "opacity-0",
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
                <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Final Amount
                </label>
                <Input
                  type="number"
                  {...register("finalAmount")}
                  className="h-8 sm:h-9 font-mono text-xs sm:text-sm"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Occurred At
                </label>
                <Input
                  type="datetime-local"
                  {...register("occurredAt")}
                  className="!h-8 sm:h-9 font-mono text-[10px] sm:text-xs"
                />
              </div>
            </div>

            {/* Actual Received + Paid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="grid gap-1 relative">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest leading-tight">
                    {`Received${actualReceivedAssetLabel ? ` (${actualReceivedAssetLabel})` : ""}`}
                  </label>
                  <Button
                    type="button"
                    className="h-6 px-2 rounded-sm text-[10px] sm:text-xs absolute right-1 bottom-0 mb-1 md:mb-1.5"
                    onClick={() =>
                      setValue("actualReceivedAmount", String(receivedLimit), {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    Max
                  </Button>
                </div>
                <Input
                  type="number"
                  max={receivedLimit}
                  min={0}
                  step="any"
                  {...register("actualReceivedAmount", {
                    onChange: (event) => {
                      const clamped = clampToMax(
                        event.target.value,
                        receivedLimit,
                      );
                      if (clamped !== event.target.value) {
                        setValue("actualReceivedAmount", clamped, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    },
                  })}
                  className="h-8 sm:h-9 font-mono text-xs sm:text-sm"
                />
              </div>
              <div className="grid gap-1 relative">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest leading-tight">
                    {`Paid${actualPaidAssetLabel ? ` (${actualPaidAssetLabel})` : ""}`}
                  </label>
                  <Button
                    type="button"
                    className="h-6 px-2 rounded-sm text-[10px] sm:text-xs absolute right-1 bottom-0 mb-1 md:mb-1.5"
                    onClick={() =>
                      setValue("actualPaidAmount", String(paidLimit), {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    Max
                  </Button>
                </div>
                <Input
                  type="number"
                  max={paidLimit}
                  min={0}
                  step="any"
                  {...register("actualPaidAmount", {
                    onChange: (event) => {
                      const clamped = clampToMax(event.target.value, paidLimit);
                      if (clamped !== event.target.value) {
                        setValue("actualPaidAmount", clamped, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    },
                  })}
                  className="h-8 sm:h-9 font-mono text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Reference No */}
            <div className="grid gap-1">
              <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Reference No
              </label>
              <Input
                {...register("referenceNo")}
                className="h-8 sm:h-9 font-mono text-xs sm:text-sm"
                placeholder="Optional"
              />
            </div>

            {/* Note */}
            <div className="grid gap-1">
              <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Note
              </label>
              <Textarea
                {...register("note")}
                className="min-h-[60px] sm:min-h-[84px] resize-y text-xs sm:text-sm"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={savingExchange}
              className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
            >
              {savingExchange ? "Saving..." : "Confirm & Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExchangeSaveConfirmDialog;
