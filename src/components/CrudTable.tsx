import { useState } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

export interface Column {
  key: string;
  label: string;
  type?: "text" | "email" | "tel" | "number";
}

export interface CrudTableProps {
  title: string;
  columns: Column[];
  initialData?: Record<string, string>[];
}

const CrudTable = ({ title, columns, initialData = [] }: CrudTableProps) => {
  const [data, setData] = useState<Record<string, string>[]>(initialData);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const filtered = data.filter((row) =>
    columns.some((col) =>
      (row[col.key] || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  const openCreate = () => {
    setForm(Object.fromEntries(columns.map((c) => [c.key, ""])));
    setEditIndex(null);
    setDialogOpen(true);
  };

  const openEdit = (index: number) => {
    const realIndex = data.indexOf(filtered[index]);
    setForm({ ...data[realIndex] });
    setEditIndex(realIndex);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editIndex !== null) {
      setData((d) => d.map((row, i) => (i === editIndex ? form : row)));
    } else {
      setData((d) => [...d, { ...form, id: crypto.randomUUID() }]);
    }
    setDialogOpen(false);
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      const realIndex = data.indexOf(filtered[deleteIndex]);
      setData((d) => d.filter((_, i) => i !== realIndex));
      setDeleteIndex(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add {title.slice(0, -1)}
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-12 text-muted-foreground">
                  No {title.toLowerCase()} found. Click "Add" to create one.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>{row[col.key]}</TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(i)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteIndex(i)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editIndex !== null ? "Edit" : "Add"} {title.slice(0, -1)}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {columns.map((col) => (
              <div key={col.key} className="grid gap-2">
                <Label htmlFor={col.key}>{col.label}</Label>
                <Input
                  id={col.key}
                  type={col.type || "text"}
                  value={form[col.key] || ""}
                  onChange={(e) => setForm((f) => ({ ...f, [col.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {title.slice(0, -1)}</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Are you sure?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CrudTable;
