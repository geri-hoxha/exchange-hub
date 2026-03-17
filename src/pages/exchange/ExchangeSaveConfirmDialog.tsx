import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExchangeCustomer, SaveConfirmFormValues } from "./types";

interface ExchangeSaveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
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
  loadingCustomers,
  customers,
  savingExchange,
  initialValues,
  onSubmit,
}: ExchangeSaveConfirmDialogProps) => {
  const { control, handleSubmit, register, reset } = useForm<SaveConfirmFormValues>({
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues);
    }
  }, [open, initialValues, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm Exchange Save</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Quote Id</label>
              <Input value={quoteId} readOnly className="h-10 font-mono text-xs" />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Customer</label>
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 bg-background font-medium">
                      <SelectValue placeholder={loadingCustomers ? "Loading customers..." : "Select customer"} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={String(customer.id)}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Final Amount</label>
                <Input
                  type="number"
                  {...register("finalAmount")}
                  className="h-10 font-mono"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Occurred At (UTC)</label>
                <Input
                  type="datetime-local"
                  {...register("occurredAt")}
                  className="h-10 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Actual Received</label>
                <Input
                  type="number"
                  {...register("actualReceivedAmount")}
                  className="h-10 font-mono"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Actual Paid</label>
                <Input
                  type="number"
                  {...register("actualPaidAmount")}
                  className="h-10 font-mono"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Reference No</label>
              <Input
                {...register("referenceNo")}
                className="h-10 font-mono"
                placeholder="Optional"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Note</label>
              <Textarea
                {...register("note")}
                className="min-h-[84px] resize-y"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={savingExchange} className="flex-1">
              {savingExchange ? "Saving..." : "Confirm & Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExchangeSaveConfirmDialog;
