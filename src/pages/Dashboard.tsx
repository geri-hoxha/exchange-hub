import { ArrowUpRight, ArrowDownRight, Users, Store, UserCheck, ArrowLeftRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  { title: "Total Exchanges", value: "1,284", change: "+12.5%", up: true, icon: ArrowLeftRight, color: "text-primary" },
  { title: "Owners", value: "24", change: "+2", up: true, icon: Users, color: "text-accent" },
  { title: "Vendors", value: "56", change: "+5", up: true, icon: Store, color: "text-primary" },
  { title: "Customers", value: "342", change: "+18", up: true, icon: UserCheck, color: "text-accent" },
];

const recentExchanges = [
  { from: "USD", to: "BTC", amount: "5,000.00", result: "0.07407", date: "2026-03-11", type: "crypto" },
  { from: "EUR", to: "ETH", amount: "2,000.00", result: "0.62609", date: "2026-03-11", type: "crypto" },
  { from: "BTC", to: "USDT", amount: "0.5", result: "33,750.00", date: "2026-03-10", type: "crypto" },
  { from: "GBP", to: "SOL", amount: "1,500.00", result: "13.13793", date: "2026-03-10", type: "crypto" },
  { from: "ARS", to: "USD", amount: "500,000", result: "600.00", date: "2026-03-09", type: "fiat" },
];

const Dashboard = () => {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your exchange activity</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-accent" />
          <span>Live rates updating</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 -mr-4 -mt-4 rounded-full bg-muted/50 group-hover:scale-110 transition-transform" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`h-8 w-8 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold font-mono">{stat.value}</div>
              <div className={`flex items-center text-xs mt-1 font-medium ${stat.up ? "text-accent" : "text-destructive"}`}>
                {stat.up ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {stat.change}
                <span className="text-muted-foreground ml-1 font-normal">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Exchanges</CardTitle>
          <Badge variant="secondary" className="font-mono text-xs">Last 5</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">From</th>
                  <th className="text-left py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">To</th>
                  <th className="text-left py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Result</th>
                  <th className="text-left py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody>
                {recentExchanges.map((ex, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3.5 text-muted-foreground font-mono text-xs">{ex.date}</td>
                    <td className="py-3.5">
                      <span className="font-semibold">{ex.from}</span>
                    </td>
                    <td className="py-3.5 font-mono">{ex.amount}</td>
                    <td className="py-3.5">
                      <span className="font-semibold">{ex.to}</span>
                    </td>
                    <td className="py-3.5 font-mono text-accent font-medium">{ex.result}</td>
                    <td className="py-3.5">
                      <Badge variant={ex.type === "crypto" ? "default" : "secondary"} className="text-xs font-mono">
                        {ex.type}
                      </Badge>
                    </td>
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
