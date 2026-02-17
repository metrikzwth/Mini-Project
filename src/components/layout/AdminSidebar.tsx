import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Pill,
  UserCog,
  Calendar,
  Package,
  Bot,
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login/admin');
  };

  const navLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/medicines', label: 'Medicines', icon: Pill },
    { path: '/admin/doctors', label: 'Doctors', icon: UserCog },
    { path: '/admin/patients', label: 'Patients', icon: UserCog },
    { path: '/admin/appointments', label: 'Appointments', icon: Calendar },
    { path: '/admin/orders', label: 'Orders', icon: Package },
    { path: '/admin/wallets', label: 'Wallets', icon: LayoutDashboard }, // Using LayoutDashboard for now, could use Wallet icon
    { path: '/admin/chatbot', label: 'Chatbot KB', icon: Bot },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-6 border-b border-sidebar-border",
        isCollapsed && "justify-center"
      )}>
        <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6 text-sidebar-primary-foreground" />
        </div>
        {!isCollapsed && (
          <div>
            <span className="text-lg font-bold text-sidebar-foreground">MediCare</span>
            <p className="text-xs text-sidebar-foreground/70">Admin Portal</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? link.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-sidebar-border p-4">
        {!isCollapsed && (
          <div className="mb-3">
            <p className="font-medium text-sidebar-foreground text-sm">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/70">{user?.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-bold text-sidebar-foreground">Admin</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="text-sidebar-foreground"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "lg:hidden fixed top-16 left-0 bottom-0 w-64 bg-sidebar z-50 flex flex-col transition-transform",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex fixed top-0 left-0 bottom-0 bg-sidebar flex-col transition-all z-40",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 z-50 w-6 h-6 rounded-full bg-sidebar-accent border border-sidebar-border text-sidebar-foreground"
        >
          <Menu className="w-3 h-3" />
        </Button>
        <SidebarContent />
      </aside>
    </>
  );
};

export default AdminSidebar;
