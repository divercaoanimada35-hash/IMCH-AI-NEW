
type ApiErrorResponse = {
  error?: string;
  message?: string;
  details?: string;
};

export class ApiService {
  /**
   * Faz pedidos à API e valida se o servidor devolveu JSON.
   * Evita o erro genérico "Unexpected token '<'" quando
   * o servidor devolve uma página HTML em vez de JSON.
   */
  private async requestJson<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    let response: Response;

    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro de ligação desconhecido';

      throw new Error(
        `Não foi possível contactar o servidor (${url}). Verifica se a API está disponível. Detalhes: ${message}`
      );
    }

    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();

    let data: any = null;

    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch {
        const isHtml =
          contentType.includes('text/html') ||
          /^\s*<!doctype html/i.test(responseText) ||
          /^\s*<html/i.test(responseText);

        if (isHtml) {
          throw new Error(
            `A API "${url}" devolveu HTML em vez de JSON (HTTP ${response.status}). ` +
            `A rota pode não existir, estar incorreta ou estar a ser encaminhada para a página principal da aplicação.`
          );
        }

        throw new Error(
          `Resposta inválida da API "${url}" (HTTP ${response.status}). ` +
          `O servidor não devolveu JSON válido.`
        );
      }
    }

    if (!response.ok) {
      const errorData = data as ApiErrorResponse | null;

      throw new Error(
        errorData?.error ||
        errorData?.message ||
        `Erro na API "${url}" (HTTP ${response.status}: ${response.statusText}).`
      );
    }

    if (data === null) {
      throw new Error(
        `A API "${url}" devolveu uma resposta vazia. Era esperado JSON.`
      );
    }

    return data as T;
  }

  async getStatus() {
    return this.requestJson('/api/status');
  }

  async getOpenRouterStatus(model?: string) {
    const url = model
      ? `/api/openrouter/status?model=${encodeURIComponent(model)}`
      : '/api/openrouter/status';

    return this.requestJson(url);
  }

  async setActiveModel(model: string) {
    return this.requestJson('/api/openrouter/set-model', {
      method: 'POST',
      body: JSON.stringify({ model }),
    });
  }

  async generateSite(payload: {
    prompt?: string;
    briefing?: string;
    model?: string;
  }) {
    return this.requestJson('/api/openrouter/generate-site', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async editSite(payload: {
    prompt: string;
    files?: Record<string, any>;
    allFiles?: Record<string, any>;
    currentFile?: any;
    currentCode?: string;
    model?: string;
    instructions?: string;
  }) {
    return this.requestJson('/api/openrouter/edit-site', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async sendChat(payload: {
    message?: string;
    messages?: any[];
    prompt?: string;
    history?: any[];
    context?: any;
    currentFile?: any;
    currentCode?: string;
    files?: Record<string, any>;
    model?: string;
    mode?: string;
  }) {
    return this.requestJson('/api/openrouter/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async architectPlan(
    prompt: string,
    projectType: string = 'web-application'
  ) {
    return this.requestJson('/api/openrouter/architect-plan', {
      method: 'POST',
      body: JSON.stringify({ prompt, projectType }),
    });
  }

  async qualityAudit(
    files: Record<string, any>,
    blueprint?: any
  ) {
    return this.requestJson('/api/openrouter/quality-audit', {
      method: 'POST',
      body: JSON.stringify({ files, blueprint }),
    });
  }

  async getKeyInfo() {
    return this.requestJson('/api/openrouter/key-info');
  }

  async getGitHubStatus() {
    return this.requestJson('/api/github/status');
  }

  async pullGitHub(token?: string) {
    return this.requestJson('/api/github/pull', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async pushGitHub(token?: string, message?: string) {
    return this.requestJson('/api/github/push', {
      method: 'POST',
      body: JSON.stringify({ token, message }),
    });
  }

  async syncGitHub(token?: string) {
    return this.requestJson('/api/github/sync', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async searchImages(query: string) {
    return this.requestJson('/api/image-search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }
}

export const apiService = new ApiService();
