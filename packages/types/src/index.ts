// User types
export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
  bio?: string
  isPremium: boolean
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export type UserRole = 'USER' | 'CREATOR' | 'MODERATOR' | 'ADMIN'

// Prompt types
export interface Prompt {
  id: string
  title: string
  description: string
  content: string
  category: PromptCategory
  tags: string[]
  modelCompatibility: AIModel[]
  isPublic: boolean
  isPremium: boolean
  price?: number
  authorId: string
  author?: User
  forkCount: number
  upvoteCount: number
  viewCount: number
  currentVersionId: string
  createdAt: Date
  updatedAt: Date
}

export interface PromptVersion {
  id: string
  promptId: string
  version: number
  content: string
  changelog?: string
  createdById: string
  createdAt: Date
}

export type PromptCategory =
  | 'CODING'
  | 'WRITING'
  | 'ANALYSIS'
  | 'CREATIVITY'
  | 'EDUCATION'
  | 'BUSINESS'
  | 'RESEARCH'
  | 'ROLEPLAY'
  | 'OTHER'

// AI Model types
export type AIModel = 'GPT4O' | 'GPT4' | 'CLAUDE_3_5_SONNET' | 'CLAUDE_3_OPUS' | 'GEMINI_1_5_PRO' | 'MISTRAL_LARGE'

export interface ModelInfo {
  id: AIModel
  name: string
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'Mistral'
  contextWindow: number
  costPer1kInput: number
  costPer1kOutput: number
  color: string
  logo: string
}

// Execution types
export interface ExecutionRequest {
  promptContent: string
  model: AIModel
  variables?: Record<string, string>
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ExecutionResult {
  id: string
  promptId?: string
  model: AIModel
  input: string
  output: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  cost: number
  createdAt: Date
}

// Search types
export interface SearchParams {
  query: string
  category?: PromptCategory
  models?: AIModel[]
  tags?: string[]
  sortBy?: 'relevance' | 'upvotes' | 'recent' | 'trending'
  page?: number
  limit?: number
}

export interface SearchResult {
  prompts: Prompt[]
  total: number
  page: number
  hasMore: boolean
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}

// Auth types
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  username: string
  password: string
  displayName?: string
}
