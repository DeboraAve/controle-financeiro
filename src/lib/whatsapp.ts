// wa.me só aceita texto pré-preenchido pra um número — não existe jeito
// (nem oficial nem alternativo) de abrir o WhatsApp já num contato
// específico COM um arquivo anexado; isso só é possível de dentro do
// próprio WhatsApp (ou por quem usa a API paga do WhatsApp Business).
// Por isso o PDF cai no share sheet do sistema (ver AvaliacaoDetalheModal
// e TreinoDetalheModal) em vez de ir direto pro número, diferente da
// cobrança (que é só texto).
export function abrirWhatsApp(fone: string, msg: string): boolean {
  const digits = fone.replace(/\D/g, '');
  if (!digits) return false;
  const comDdi = digits.length <= 11 ? '55' + digits : digits;
  window.open('https://wa.me/' + comDdi + '?text=' + encodeURIComponent(msg), '_blank');
  return true;
}
