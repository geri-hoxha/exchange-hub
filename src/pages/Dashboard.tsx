import { ArrowUpRight, ArrowDownRight, DollarSign, Users, Store, UserCheck, ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { title: "Total Exchanges", value: "1,284", change: "+12.5%", up: true, icon: ArrowLeftRight },
  { title: "Owners", value: "24", change: "+2", up: true, icon: Users },
  { title: "Vendors", value: "56", change: "+5", up: true, icon: Store },
  { title: "Customers", value: "342", change: "+18", up: true, icon: UserCheck },
];

const recentExchanges = [
  { from: "USD", to: "BTC", amount: "5,000.00", result: "0.07407", date: "2026-03-11" },
  { from: "EUR", to: "ETH", amount: "2,000.00", result: "0.62609", date: "2026-03-11" },
  { from: "BTC", to: "USDT", amount: "0.5", result: "33,750.00", date: "2026-03-10" },
  { from: "GBP", to: "SOL", amount: "1,500.00", result: "13.13793", date: "2026-03-10" },
  { from: "ARS", to: "USD", amount: "500,000", result: "600.00", date: "2026-03-09" },
];

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className={`flex items-center text-xs mt-1 ${stat.up ? "text-success" : "text-destructive"}`}>
                {stat.up ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {stat.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Exchanges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 font-medium text-muted-foreground">From</th>
                  <th className="text-left py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 font-medium text-muted-foreground">To</th>
                  <th className="text-left py-3 font-medium text-muted-foreground">Result</th>
                </tr>
              </thead>
              <tbody>
                {recentExchanges.map((ex, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-3 text-muted-foreground">{ex.date}</td>
                    <td className="py-3 font-medium">{ex.from}</td>
                    <td className="py-3">{ex.amount}</td>
                    <td className="py-3 font-medium">{ex.to}</td>
                    <td className="py-3">{ex.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
