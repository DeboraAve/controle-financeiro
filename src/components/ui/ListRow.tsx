import type { ReactNode } from 'react';
import { TONE_TEXT_VAR, type Tone } from './tone';

/** Encapsula .aluno-row/.avatar-square de app.css com slots — cobre a
 * linha de aluno hoje e, mais pra frente, sessão e despesa sem precisar
 * de mais uma classe CSS por tipo de lista. */
export function ListRow({
  avatarText,
  avatarTone = 'brand',
  title,
  badge,
  subtitle,
  trailing,
  trailingSub,
  trailingSubTone = 'muted',
  onClick,
}: {
  avatarText?: string;
  avatarTone?: Tone;
  title: ReactNode;
  badge?: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  trailingSub?: ReactNode;
  trailingSubTone?: Tone;
  onClick?: () => void;
}) {
  return (
    <div className="aluno-row" onClick={onClick}>
      {avatarText !== undefined && (
        <div className="avatar-square" style={{ color: TONE_TEXT_VAR[avatarTone] }}>
          {avatarText}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 'var(--text-md)' }}>{title}</span>
          {badge}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {(trailing || trailingSub) && (
        <div style={{ textAlign: 'right' }}>
          {trailing && <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)' }}>{trailing}</div>}
          {trailingSub && (
            <div style={{ fontSize: 'var(--text-2xs)', color: TONE_TEXT_VAR[trailingSubTone] }}>{trailingSub}</div>
          )}
        </div>
      )}
    </div>
  );
}
