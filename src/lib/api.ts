/** Chamadas ao backend a partir do navegador (via proxy /api do próprio Next). */

export class ErroApi extends Error {
  constructor(
    public status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

async function mensagemDeErro(resp: Response): Promise<string> {
  try {
    const corpo = await resp.json();
    return corpo.detail ?? corpo.erro ?? corpo.mensagem ?? `Erro ${resp.status}`;
  } catch {
    return resp.status === 413 ? "Arquivo maior que o permitido." : `Erro ${resp.status}`;
  }
}

export async function api<T = unknown>(caminho: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...resto } = init;
  const resp = await fetch(caminho, {
    ...resto,
    headers: json !== undefined ? { "Content-Type": "application/json", ...resto.headers } : resto.headers,
    body: json !== undefined ? JSON.stringify(json) : resto.body,
  });
  if (!resp.ok) throw new ErroApi(resp.status, await mensagemDeErro(resp));
  if (resp.status === 204) return undefined as T;
  const tipo = resp.headers.get("content-type") ?? "";
  return (tipo.includes("json") ? await resp.json() : undefined) as T;
}

/**
 * Upload com barra de progresso (fetch não informa progresso de envio).
 */
export function enviarArquivo<T>(
  caminho: string,
  campos: Record<string, string | Blob>,
  aoProgredir?: (fracao: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    Object.entries(campos).forEach(([k, v]) => form.append(k, v));
    xhr.open("POST", caminho);
    xhr.upload.onprogress = (e) => e.lengthComputable && aoProgredir?.(e.loaded / e.total);
    xhr.onload = () => {
      let corpo: { detail?: string; erro?: string } | null = null;
      try {
        corpo = JSON.parse(xhr.responseText);
      } catch {
        /* sem corpo */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(corpo as T);
      else
        reject(
          new ErroApi(
            xhr.status,
            corpo?.detail ?? corpo?.erro ?? (xhr.status === 413 ? "Arquivo maior que o permitido." : `Erro ${xhr.status}`),
          ),
        );
    };
    xhr.onerror = () => reject(new ErroApi(0, "Falha de conexão."));
    xhr.send(form);
  });
}
