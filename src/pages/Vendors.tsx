import CrudTable from "@/components/CrudTable";

const columns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email", type: "email" as const },
  { key: "phone", label: "Phone", type: "tel" as const },
  { key: "service", label: "Service" },
];

const initialData = [
  { id: "1", name: "CryptoFlow Ltd", email: "info@cryptoflow.com", phone: "+44 20 7123 4567", service: "Liquidity Provider" },
  { id: "2", name: "FastPay Inc", email: "contact@fastpay.io", phone: "+1 555-0202", service: "Payment Gateway" },
];

const Vendors = () => <CrudTable title="Vendors" columns={columns} initialData={initialData} />;

export default Vendors;
