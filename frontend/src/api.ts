import {
  RunSummaryData,
  RunSummary,
  ProvidersData,
  CategoriesData,
  QueryData,
  QueryRawData,
  CompareData,
  PreviewResponse,
  SSEMessage,
  BrandsConfig,
  TemplatesConfig,
  ConfigItem,
  FullConfig
} from './types';

const BASE_URL = '/api';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, options);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  getRuns: () => fetchApi<RunSummaryData[]>('/runs'),
  getRunSummary: (run: string) => fetchApi<RunSummary>(`/runs/${run}/summary`),
  getRunProviders: (run: string) => fetchApi<ProvidersData>(`/runs/${run}/providers`),
  getRunCategories: (run: string) => fetchApi<CategoriesData>(`/runs/${run}/categories`),
  getRunQueries: (run: string) => fetchApi<QueryData[]>(`/runs/${run}/queries`),
  getQueryRaw: (run: string, id: number) => fetchApi<QueryRawData>(`/runs/${run}/queries/${id}/raw`),
  compareRuns: (a: string, b: string) => fetchApi<CompareData>(`/runs/compare?run_a=${a}&run_b=${b}`),
  getPreviewQueries: () => fetchApi<PreviewResponse>('/queries/preview'),
  
  startRun: (queryIds?: number[]) => fetchApi<{ status: string }>('/runs/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query_ids: queryIds && queryIds.length > 0 ? queryIds : undefined })
  }),
  stopRun: () => fetchApi<{ status: string }>('/runs/stop', { method: 'POST' }),
  
  getBrands: () => fetchApi<BrandsConfig>('/brands'),
  getBrandsRaw: () => fetchApi<Record<string, unknown>>('/brands/raw'),
  updateBrands: (brands: BrandsConfig) => fetchApi<{ status: string }>('/brands', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(brands)
  }),
  
  getTemplates: () => fetchApi<TemplatesConfig>('/templates'),
  updateTemplates: (templates: TemplatesConfig) => fetchApi<{ status: string }>('/templates', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(templates)
  }),
  
  getConfigs: () => fetchApi<ConfigItem[]>('/configs'),
  getConfig: (name: string) => fetchApi<FullConfig>(`/configs/${name}`),
  createConfig: (config: Omit<FullConfig, 'created'>) => fetchApi<{ status: string }>('/configs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  }),
  deleteConfig: (name: string) => fetchApi<{ status: string }>(`/configs/${name}`, { method: 'DELETE' }),

  subscribeToActiveRun: (onMessage: (msg: SSEMessage) => void, onError: (err: unknown) => void) => {
    let hasStarted = false;
    const es = new EventSource(`${BASE_URL}/runs/active`);
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEMessage;
        
        if (data.running) {
          hasStarted = true;
        }
        
        if (hasStarted && !data.running) {
          es.close();
        }
        
        onMessage(data);
      } catch (err) {
        onError(err);
      }
    };
    
    es.onerror = (err) => {
      onError(err);
    };
    
    return () => {
      es.close();
    };
  }
};
