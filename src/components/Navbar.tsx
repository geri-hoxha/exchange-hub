import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Store, UserCheck, ArrowLeftRight } from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Owners", path: "/owners", icon: Users },
  { label: "Vendors", path: "/vendors", icon: Store },
  { label: "Customers", path: "/customers", icon: UserCheck },
  { label: "Exchange", path: "/exchange", icon: ArrowLeftRight },
];

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="bg-nav text-nav-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-7 w-7 text-nav-accent" />
            <span className="text-xl font-bold tracking-tight">CryptoXchange</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-nav-accent text-nav-foreground"
                      : "text-nav-foreground/70 hover:text-nav-foreground hover:bg-nav-foreground/10"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu */}
          <div className="flex md:hidden items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-nav-accent text-nav-foreground"
                      : "text-nav-foreground/70"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
