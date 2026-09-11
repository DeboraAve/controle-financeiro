// `icon.png` (o mestre da marca) vem em ~1200px e pesa mais de 1MB — bom
// pro ícone de instalação, pesado demais só pra virar um selinho de
// 20pt no cabeçalho do PDF (e entraria inteiro no precache do service
// worker). Usa a mesma arte já em tamanho de ícone de app (180px,
// `apple-touch-icon`), bem mais leve.
import iconUrl from '../brand/icon-selo.png';

let cache: Promise<string> | null = null;

// Redimensiona pra 128px antes de virar base64 — ainda mais compacto no
// PDF final que embutir os 180px direto. Memoizado — só carrega/
// redimensiona uma vez por sessão, não a cada PDF.
export function logoBase64(): Promise<string> {
  if (!cache) {
    cache = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const tam = 128;
        const canvas = document.createElement('canvas');
        canvas.width = tam;
        canvas.height = tam;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('sem contexto 2d pra redimensionar o ícone'));
          return;
        }
        ctx.drawImage(img, 0, 0, tam, tam);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('falha ao carregar o ícone da marca'));
      img.src = iconUrl;
    });
  }
  return cache;
}
