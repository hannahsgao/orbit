interface ConnectionButtonProps {
  href: string;
  children: React.ReactNode;
}

export function ConnectionButton({ href, children }: ConnectionButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid rgba(255, 255, 255, 0.5)',
        color: 'white',
        padding: '0.75rem 1.5rem',
        fontSize: '0.875rem',
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        pointerEvents: 'auto',
        position: 'relative',
        zIndex: 100,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {'>'} {children}
    </a>
  );
}
