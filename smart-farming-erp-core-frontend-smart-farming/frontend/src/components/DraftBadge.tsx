// src/components/DraftBadge.tsx
export function DraftBadge({ savedAt }: { savedAt: Date | null }) {
  if (!savedAt) return null;
  const jam = savedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return <span style={{ fontSize: '14px', color: '#64748b' }}>Draft tersimpan pukul {jam}</span>;
}