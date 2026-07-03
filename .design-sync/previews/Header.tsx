import { Header } from 'crm-felmat';

export function Expandido() {
  return (
    <div style={{ position: 'relative', height: 64, minWidth: 900 }}>
      <Header sidebarCollapsed={false} />
    </div>
  );
}

export function Colapsado() {
  return (
    <div style={{ position: 'relative', height: 64, minWidth: 900 }}>
      <Header sidebarCollapsed={true} />
    </div>
  );
}
