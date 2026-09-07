/* Mapa de ícones do app.
 *
 * Nenhuma tela importa 'lucide-react' direto — todas passam por aqui. Assim
 * trocar de biblioteca (ou substituir um ícone específico) é editar este
 * arquivo, não caçar imports por todo o src/.
 *
 * Os imports são nomeados de propósito: é o que permite o tree-shaking
 * deixar de fora os ~1500 ícones que não usamos.
 *
 * Tamanhos e regra de traço em docs/design/iconografia.md.
 */
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleAlert,
  CircleCheck,
  CircleX,
  Download,
  HandCoins,
  LayoutDashboard,
  Loader2,
  Pencil,
  Plus,
  Search,
  SquareArrowUp,
  Trash2,
  Users,
  Wallet,
  WifiOff,
  X,
} from 'lucide-react';

/* — navegação principal (as 5 abas) — */
export const IconePainel = LayoutDashboard;
export const IconeAlunos = Users;
export const IconeAgenda = CalendarDays;
export const IconeCaixa = Wallet;
export const IconeCobranca = HandCoins;

/* — ações — */
export const IconeFechar = X;
export const IconeVoltar = ArrowLeft;
export const IconeMais = Plus;
export const IconeBusca = Search;
export const IconeEditar = Pencil;
export const IconeExcluir = Trash2;
export const IconeConfirmar = Check;

/* — status e feedback — */
export const IconeOk = CircleCheck;
export const IconeErro = CircleX;
export const IconeAviso = CircleAlert;
export const IconeCarregando = Loader2;
export const IconeInstalar = Download;
export const IconeCompartilhar = SquareArrowUp;
export const IconeSemConexao = WifiOff;

/* A marca em si (o símbolo do pulso/seta) não é um ícone Lucide — é
 * BrandMark, em ./BrandMark.tsx. */

/* Tamanhos padrão. Usar estes em vez de números soltos: 16 acompanha texto,
 * 20 é o padrão de navegação e botão, 24 é para destaque (empty state). */
export const TAMANHO_ICONE = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export type { LucideIcon } from 'lucide-react';
