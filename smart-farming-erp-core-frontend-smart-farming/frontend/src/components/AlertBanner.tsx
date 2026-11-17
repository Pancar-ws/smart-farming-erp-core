// src/components/AlertBanner.tsx
interface AlertBannerProps {
  type: 'warning' | 'error' | 'success';
  title: string;
  message: string;
  onClose?: () => void;
}

export function AlertBanner({ type, title, message, onClose }: AlertBannerProps) {
  const styles = {
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '⚠️' },
    error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: '❌' },
    success: { bg: '#dcfce7', border: '#22c55e', text: '#166534', icon: '✅' },
  };

  const current = styles[type];

  return (
    <div
      style={{
        backgroundColor: current.bg,
        borderLeft: `5px solid ${current.border}`,
        color: current.text,
        padding: '14px 16px',
        borderRadius: '8px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <strong style={{ display: 'block', fontSize: '15px' }}>
          {current.icon} {title}
        </strong>
        <span style={{ fontSize: '14px' }}>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: current.text,
            padding: '4px 8px',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}