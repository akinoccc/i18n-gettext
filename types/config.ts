export interface ModelConfig {
  provider: string
  modelId: string
  apiKey?: string
  baseURL?: string
}

export interface Config {
  models: ModelConfig[]
}

export type ModelInfo = Omit<ModelConfig, 'apiKey'>
