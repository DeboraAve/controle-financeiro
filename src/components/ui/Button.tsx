import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { IconeCarregando } from './icons';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  block?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

/** Encapsula .btn/.btn-primary/.btn-secondary/.btn-ghost de industry.css.
 * `loading` troca o conteúdo por um spinner sem travar a tela — o botão
 * continua com o mesmo tamanho e fica desabilitado sozinho. */
export function Button({
  variant = 'secondary',
  block = false,
  loading = false,
  icon,
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn-${variant}`, block && 'btn-block', className].filter(Boolean).join(' ');
  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading ? (
        <IconeCarregando size={16} className="spin" aria-hidden />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
