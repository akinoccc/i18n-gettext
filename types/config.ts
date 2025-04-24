export interface ModelConfig {
  provider: string
  modelId: string
  apiKey?: string
  baseURL?: string
}

export interface AIConfig {
  additionalPrompts: string[]
  ai: ModelConfig[]
}

export type ModelInfo = Omit<ModelConfig, 'apiKey'>
