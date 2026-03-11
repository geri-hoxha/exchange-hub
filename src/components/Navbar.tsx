import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Store, UserCheck, ArrowLeftRight } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

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
    <nav className="bg-nav text-nav-foreground border-b border-nav-foreground/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-nav-accent flex items-center justify-center glow-primary">
              <ArrowLeftRight className="h-4 w-4 text-nav-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Crypto<span className="text-nav-accent">X</span>change
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-nav-accent text-nav-foreground shadow-md glow-primary"
                      : "text-nav-foreground/60 hover:text-nav-foreground hover:bg-nav-foreground/5"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="ml-2 pl-2 border-l border-nav-foreground/10">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-1">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-1 pb-3 overflow-x-auto -mx-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-nav-accent text-nav-foreground glow-primary"
                    : "text-nav-foreground/50"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
