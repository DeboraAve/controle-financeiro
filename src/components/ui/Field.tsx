import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

/** Encapsula .field de industry.css: rótulo + controle + erro/dica. */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {error ? (
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--status-danger)', marginTop: 4 }}>{error}</div>
      ) : hint ? (
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 4 }}>{hint}</div>
      ) : null}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props;
  return <input className={`input ${className}`.trim()} {...rest} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props;
  return <textarea className={`input ${className}`.trim()} {...rest} />;
}
