export interface ContentChunk {
  id: string;
  title: string;
  type: 'personal' | 'experience' | 'skills' | 'project' | 'goals' | 'education';
  content: string;
}

export interface VectorUpload {
  id: string;
  data: string;
  metadata: {
    title: string;
    type: string;
    content: string;
  };
}

export interface ProfileData {
  personal: {
    name: string;
    title: string;
    location: string;
    summary: string;
    elevator_pitch: string;
    contact: {
      email: string;
      linkedin: string;
      github: string;
      portfolio: string;
    };
  };
  experience: Array<{
    company: string;
    title: string;
    duration: string;
    achievements_star: Array<{
      result: string;
    }>;
    technical_skills_used: {
      backend: string[];
      frontend: string[];
      [key: string]: string[];
    };
  }>;
  skills: {
    technical: {
      programming_languages: Array<{
        language: string;
        years: number;
        proficiency: string;
      }>;
      backend_frameworks: Array<{
        framework: string;
        versions_used: string[];
      }>;
      frontend_technologies: Array<{
        technology?: string;
        language?: string;
        years: number;
        proficiency: string;
      }>;
      databases: Array<{
        database: string;
        years: number;
        proficiency: string;
      }>;
    };
  };
  projects_portfolio: Array<{
    name: string;
    description: string;
    technologies: string[];
    impact: string;
  }>;
  career_goals: {
    short_term: string;
    long_term: string;
    learning_focus: string[];
  };
  education: {
    university: string;
    degree: string;
    graduation_year: number;
    thesis_project: string;
  };
}

export interface RAGQueryResult {
  success: boolean;
  response: string;
  mode: 'vector' | 'fallback' | 'error';
  sources?: string[];
  /** Performance metrics for monitoring and optimization */
  metrics?: {
    queryTime: number;
    vectorSearchTime?: number;
    llmResponseTime?: number;
    resultsCount?: number;
    confidence?: number;
  };
  /** Error details for debugging */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Enhanced error types for better debugging */
export interface RAGError {
  code: 'GROQ_INIT_ERROR' | 'VECTOR_QUERY_ERROR' | 'ENV_VALIDATION_ERROR' | 'LLM_GENERATION_ERROR' | 'FALLBACK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  details?: unknown;
  timestamp: string;
}

/** Vector query options for fine-tuning searches */
export interface VectorQueryOptions {
  topK?: number;
  minScore?: number;
  includeMetadata?: boolean;
  timeout?: number;
}

/** Performance monitoring interface */
export interface PerformanceTimer {
  start(): void;
  end(): number;
  getElapsed(): number;
}

// Upstash Vector types to fix TypeScript errors
export interface VectorMetadata {
  title?: string | unknown;
  content?: string | unknown;
  type?: string | unknown;
  [key: string]: unknown;
}

export interface VectorQueryResult {
  id: string;
  score: number;
  metadata?: VectorMetadata;
}

export interface UpstashInfoResult {
  vectorCount?: number;
  dimension?: number;
  embeddingModel?: string;
  similarityFunction?: string;
  [key: string]: unknown;
}