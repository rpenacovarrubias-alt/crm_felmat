import { Sidebar } from 'crm-felmat';

export function Expandido() {
  return (
    <div style={{ height: 600, display: 'flex', overflow: 'hidden', background: 'var(--background)' }}>
      <Sidebar isCollapsed={false} onToggle={() => {}} />
    </div>
  );
}

export function Colapsado() {
  return (
    <div style={{ height: 600, display: 'flex', overflow: 'hidden', background: 'var(--background)' }}>
      <Sidebar isCollapsed={true} onToggle={() => {}} />
    </div>
  );
}
