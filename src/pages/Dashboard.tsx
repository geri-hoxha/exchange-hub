import { ArrowUpRight, ArrowDownRight, Users, Store, UserCheck, ArrowLeftRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const stats = [
  { title: "Total Exchanges", value: "1,284", change: "+12.5%", up: true, icon: ArrowLeftRight, color: "text-primary", bg: "bg-primary/10" },
  { title: "Owners", value: "24", change: "+2", up: true, icon: Users, color: "text-accent", bg: "bg-accent/10" },
  { title: "Vendors", value: "56", change: "+5", up: true, icon: Store, color: "text-primary", bg: "bg-primary/10" },
  { title: "Customers", value: "342", change: "+18", up: true, icon: UserCheck, color: "text-accent", bg: "bg-accent/10" },
];

const volumeData = [
  { month: "Sep", volume: 42000 },
  { month: "Oct", volume: 58000 },
  { month: "Nov", volume: 49000 },
  { month: "Dec", volume: 72000 },
  { month: "Jan", volume: 65000 },
  { month: "Feb", volume: 81000 },
  { month: "Mar", volume: 94000 },
];

const exchangesByDay = [
  { day: "Mon", count: 32 },
  { day: "Tue", count: 45 },
  { day: "Wed", count: 28 },
  { day: "Thu", count: 51 },
  { day: "Fri", count: 67 },
  { day: "Sat", count: 22 },
  { day: "Sun", count: 14 },
];

const assetDistribution = [
  { name: "USDT-TRC20", value: 38 },
  { name: "EUR", value: 25 },
  { name: "BTC", value: 18 },
  { name: "ETH", value: 12 },
  { name: "Other", value: 7 },
];

const COLORS = [
  "hsl(160, 84%, 39%)",
  "hsl(217, 91%, 50%)",
  "hsl(35, 92%, 55%)",
  "hsl(270, 70%, 55%)",
  "hsl(220, 15%, 55%)",
];

const feeData = [
  { month: "Sep", fee: 1200 },
  { month: "Oct", fee: 1800 },
  { month: "Nov", fee: 1400 },
  { month: "Dec", fee: 2200 },
  { month: "Jan", fee: 1900 },
  { month: "Feb", fee: 2600 },
  { month: "Mar", fee: 3100 },
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold font-mono">{stat.value}</p>
                  <div className={`flex items-center text-xs font-medium ${stat.up ? "text-accent" : "text-destructive"}`}>
                    {stat.up ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {stat.change}
                    <span className="text-muted-foreground ml-1 font-normal">vs last month</span>
                  </div>
                </div>
                <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Volume Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Volume (LCY)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" strokeOpacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(230, 22%, 11%)", border: "1px solid hsl(230, 15%, 18%)", borderRadius: "8px", color: "#fff" }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Volume"]}
                  />
                  <Area type="monotone" dataKey="volume" stroke="hsl(217, 91%, 50%)" strokeWidth={2} fill="url(#volumeGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Net Fees Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Net Fees (LCY)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={feeData}>
                  <defs>
                    <linearGradient id="feeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" strokeOpacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(230, 22%, 11%)", border: "1px solid hsl(230, 15%, 18%)", borderRadius: "8px", color: "#fff" }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Fee"]}
                  />
                  <Area type="monotone" dataKey="fee" stroke="hsl(160, 84%, 39%)" strokeWidth={2} fill="url(#feeGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exchanges by Day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Exchanges by Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exchangesByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" strokeOpacity={0.5} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(230, 22%, 11%)", border: "1px solid hsl(230, 15%, 18%)", borderRadius: "8px", color: "#fff" }}
                    formatter={(value: number) => [value, "Exchanges"]}
                  />
                  <Bar dataKey="count" fill="hsl(217, 91%, 50%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Asset Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Asset Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {assetDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(230, 22%, 11%)", border: "1px solid hsl(230, 15%, 18%)", borderRadius: "8px", color: "#fff" }}
                    formatter={(value: number) => [`${value}%`, "Share"]}
                  />
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
