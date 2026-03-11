import CrudTable from "@/components/CrudTable";

const columns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email", type: "email" as const },
  { key: "phone", label: "Phone", type: "tel" as const },
  { key: "country", label: "Country" },
];

const initialData = [
  { id: "1", name: "Alice Johnson", email: "alice@mail.com", phone: "+1 555-0303", country: "USA" },
  { id: "2", name: "Carlos Ruiz", email: "carlos@correo.es", phone: "+54 11 4567 8901", country: "Argentina" },
  { id: "3", name: "Yuki Tanaka", email: "yuki@mail.jp", phone: "+81 90 1234 5678", country: "Japan" },
];

const Customers = () => <CrudTable title="Customers" columns={columns} initialData={initialData} />;

export default Customers;
