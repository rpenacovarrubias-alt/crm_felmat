// ==========================================
// SIDEBAR DE NAVEGACIÓN - MENÚS COMPLETOS
// Compatible con React Router + Vite
// ==========================================

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  Globe,
  Settings,
  Bell,
  Menu,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  BarChart3,
  ChevronDown,
  Package,
  Calculator,
  Link2,
  Share2,
  TrendingUp,
  Shield,
  User,
  Building,
  FileText,
  Receipt,
  Megaphone,
  Scale,
  Hotel,
  Briefcase,
  DollarSign,
  PieChart,
  TrendingUp as Trending,
  ClipboardList,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  adminOnly?: boolean;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
  adminOnly?: boolean;
}

// Menús principales
const dashboardItem: NavItem = { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard };

// Grupo de Propiedades con submenús
const propertiesGroup: NavGroup = {
  label: 'Propiedades',
  icon: Building2,
  items: [
    { label: 'Inventario', href: '/properties', icon: Package },
    { label: 'Estimaciones', href: '/estimaciones', icon: Calculator },
    { label: 'Vinculaciones', href: '/links', icon: Link2 },
    { label: 'Listas compartidas', href: '/shared-lists', icon: Share2 },
    { label: 'Desempeño', href: '/performance', icon: TrendingUp },
  ],
};

// Grupo Administración de Condominios con submenús
const adminCondominiosGroup: NavGroup = {
  label: 'Admin. Condominios',
  icon: Building,
  items: [
    { label: 'Carta Presentación', href: '/carta-presentacion', icon: FileText },
    { label: 'Cotizaciones', href: '/cotizaciones', icon: Receipt },
    { label: 'Anuncios', href: '/admin/condominios/anuncios', icon: Megaphone },
    { label: 'Legal', href: '/legal/compra-venta', icon: Scale },
  ],
};

// Grupo AIRBNB con submenús
const airbnbGroup: NavGroup = {
  label: 'AIRBNB',
  icon: Hotel,
  items: [
    { label: 'Anuncio', href: '/airbnb/anuncios', icon: Megaphone },
    { label: 'Propiedades', href: '/airbnb/propiedades', icon: Building },
    { label: 'Fichas Técnicas', href: '/airbnb/fichas', icon: ClipboardList },
    { label: 'Administración', href: '/airbnb/administracion', icon: Briefcase },
    { label: 'Comisión', href: '/airbnb/comision', icon: DollarSign },
    { label: 'Limpieza', href: '/airbnb/limpieza', icon: Sparkles },
  ],
};

// Grupo Reportes con submenús
const reportesGroup: NavGroup = {
  label: 'Reportes',
  icon: PieChart,
  items: [
    { label: 'Ingresos por Propiedad', href: '/reportes/ingresos-propiedad', icon: Building2 },
    { label: 'Ingresos Generales', href: '/reportes/ingresos-generales', icon: Trending },
  ],
};

const mainNavItems: NavItem[] = [
  { label: 'Clientes', href: '/leads', icon: Users },
  { label: 'Calendario', href: '/calendar', icon: Calendar },
  { label: 'Mi Sitio Web', href: '/website', icon: Globe },
];

const adminNavItems: NavItem[] = [
  { label: 'Gestión de Usuarios', href: '/users', icon: Shield, adminOnly: true },
  { label: 'Estadísticas', href: '/analytics', icon: BarChart3, adminOnly: true },
];

const secondaryNavItems: NavItem[] = [
  { label: 'Notificaciones', href: '/notifications', icon: Bell },
  { label: 'Configuración', href: '/settings', icon: Settings },
];

// Componente para renderizar un grupo colapsable
function NavGroupComponent({
  group,
  isCollapsed,
  isActive,
}: {
  group: NavGroup;
  isCollapsed: boolean;
  isActive: boolean;
}) {
  const [isOpen, setIsOpen] = useState(isActive);

  if (isCollapsed) {
    return (
      <nav className="px-3 space-y-1 mb-2">
        <Link
          to={group.items[0]?.href || '#'}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            "hover:bg-accent hover:text-accent-foreground",
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground",
            "justify-center px-2"
          )}
        >
          <group.icon className="w-5 h-5 flex-shrink-0" />
        </Link>
      </nav>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mx-3",
            "hover:bg-accent hover:text-accent-foreground",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground"
          )}
        >
          <group.icon className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1 text-left">{group.label}</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <nav className="px-3 space-y-1 mt-1 ml-4 border-l-2 border-border/50">
          {group.items.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                "hover:bg-accent hover:text-accent-foreground",
                "text-muted-foreground"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const userInitials = user
    ? `${user.name?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
    : '?';

  const isPropertiesActive = location.pathname.startsWith('/properties') ||
    location.pathname.startsWith('/estimaciones') ||
    location.pathname.startsWith('/links') ||
    location.pathname.startsWith('/shared-lists') ||
    location.pathname.startsWith('/performance');

  const isAdminCondominiosActive = location.pathname.startsWith('/carta-presentacion') ||
    location.pathname.startsWith('/cotizaciones') ||
    location.pathname.startsWith('/admin/condominios') ||
    location.pathname.startsWith('/legal');

  const isAirbnbActive = location.pathname.startsWith('/airbnb');
  const isReportesActive = location.pathname.startsWith('/reportes');

  const NavContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-border/50",
        isCollapsed && "justify-center px-2"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center flex-shrink-0">
            <Home className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight text-blue-700">GRUPO FELMAT</span>
              <span className="text-xs text-muted-foreground">CRM Inmobiliario</span>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 py-4 h-[calc(100vh-8rem)] overflow-y-auto">
        {/* Dashboard */}
        <nav className="px-3 space-y-1 mb-2">
          <Link
            to={dashboardItem.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              "hover:bg-accent hover:text-accent-foreground",
              location.pathname === '/dashboard' || location.pathname === '/'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground",
              isCollapsed && "justify-center px-2"
            )}
          >
            <dashboardItem.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>{dashboardItem.label}</span>}
          </Link>
        </nav>

        {/* Propiedades Group */}
        {!isCollapsed ? (
          <Collapsible open={isPropertiesActive} onOpenChange={() => {}}>
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mx-3",
                  "hover:bg-accent hover:text-accent-foreground",
                  isPropertiesActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )}
              >
                <propertiesGroup.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 text-left">{propertiesGroup.label}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isPropertiesActive && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <nav className="px-3 space-y-1 mt-1 ml-4 border-l-2 border-border/50">
                {propertiesGroup.items.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onItemClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                      "hover:bg-accent hover:text-accent-foreground",
                      location.pathname.startsWith(item.href)
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <nav className="px-3 space-y-1 mb-2">
            <Link
              to="/properties"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-accent hover:text-accent-foreground",
                isPropertiesActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground",
                "justify-center px-2"
              )}
            >
              <propertiesGroup.icon className="w-5 h-5 flex-shrink-0" />
            </Link>
          </nav>
        )}

        {/* Admin Condominios Group */}
        <div className="mt-2">
          <NavGroupComponent
            group={adminCondominiosGroup}
            isCollapsed={isCollapsed}
            isActive={isAdminCondominiosActive}
          />
        </div>

        {/* Airbnb Group */}
        <div className="mt-2">
          <NavGroupComponent
            group={airbnbGroup}
            isCollapsed={isCollapsed}
            isActive={isAirbnbActive}
          />
        </div>

        {/* Reportes Group */}
        <div className="mt-2">
          <NavGroupComponent
            group={reportesGroup}
            isCollapsed={isCollapsed}
            isActive={isReportesActive}
          />
        </div>

        {/* Main Nav Items */}
        <nav className="px-3 space-y-1 mt-4">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-accent hover:text-accent-foreground",
                location.pathname.startsWith(item.href)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Admin Items */}
        {user?.role === 'admin' && (
          <nav className="px-3 space-y-1 mt-4">
            <div className={cn(
              "px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
              isCollapsed && "text-center"
            )}>
              {!isCollapsed && 'Administración'}
            </div>
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground",
                  location.pathname.startsWith(item.href)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>
        )}

        {/* Secondary Items */}
        <nav className="px-3 space-y-1 mt-4">
          {secondaryNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-accent hover:text-accent-foreground",
                location.pathname.startsWith(item.href)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      {/* User Profile */}
      <div className={cn(
        "border-t border-border/50 p-4",
        isCollapsed && "px-2"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center"
        )}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-semibold text-sm">
            {userInitials}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          "absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center hover:bg-primary/90 transition-colors",
          isCollapsed && "rotate-180"
        )}
      >
        <ChevronLeft className="w-3 h-3" />
      </button>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-40",
        isCollapsed ? "w-20" : "w-72"
      )}>
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <NavContent onItemClick={() => {}} />
        </SheetContent>
      </Sheet>
    </>
  );
}
