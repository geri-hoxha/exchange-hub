import CrudTable from "@/components/CrudTable";

const columns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email", type: "email" as const },
  { key: "phone", label: "Phone", type: "tel" as const },
  { key: "company", label: "Company" },
];

const initialData = [
  { id: "1", name: "John Smith", email: "john@acme.com", phone: "+1 555-0101", company: "Acme Corp" },
  { id: "2", name: "Maria Garcia", email: "maria@global.io", phone: "+34 612 345 678", company: "Global Exchange" },
];

const Owners = () => <CrudTable title="Owners" columns={columns} initialData={initialData} />;

export default Owners;
