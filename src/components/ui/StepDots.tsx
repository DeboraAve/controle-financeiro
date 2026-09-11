// Indicador de progresso dos modais de formulário longos, divididos em
// etapas (avaliação física, cadastro de aluno) — em vez de um formulário
// só, comprido, que obriga a rolar bastante pra achar o próximo campo.
export function StepDots({ total, atual }: { total: number; atual: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            style={{
              width: i === atual ? 18 : 6,
              height: 6,
              borderRadius: 'var(--radius-full)',
              background: i <= atual ? 'var(--brand)' : 'var(--color-neutral-300)',
              transition: 'width var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>Passo {atual + 1} de {total}</span>
    </div>
  );
}
