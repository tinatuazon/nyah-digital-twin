'use server';

// Environment variable validation utility
export async function validateEnvironmentVariables(): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables
  if (!process.env.UPSTASH_VECTOR_REST_URL) {
    errors.push('UPSTASH_VECTOR_REST_URL is undefined');
  }

  if (!process.env.UPSTASH_VECTOR_REST_TOKEN) {
    errors.push('UPSTASH_VECTOR_REST_TOKEN is undefined');
  }

  if (!process.env.GROQ_API_KEY) {
    errors.push('GROQ_API_KEY is undefined');
  }

  // Check for whitespace/newlines in URLs (common issue)
  const vectorUrl = process.env.UPSTASH_VECTOR_REST_URL;
  if (vectorUrl && (vectorUrl.includes('\n') || vectorUrl.includes(' '))) {
    warnings.push('UPSTASH_VECTOR_REST_URL contains whitespace or newline, which can cause errors');
  }

  const vectorToken = process.env.UPSTASH_VECTOR_REST_TOKEN;
  if (vectorToken && (vectorToken.includes('\n') || vectorToken.includes(' '))) {
    warnings.push('UPSTASH_VECTOR_REST_TOKEN contains whitespace or newline, which can cause errors');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Load and validate environment variables
export async function loadAndValidateEnv() {
  const validation = await validateEnvironmentVariables();
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Environment Variable Warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (!validation.isValid) {
    console.error('❌ Environment Variable Errors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    console.error('💡 Solution: Verify .env.local file exists and variables are properly set');
    throw new Error('Missing required environment variables');
  }

  console.log('✅ All required environment variables are set');
  return validation;
}