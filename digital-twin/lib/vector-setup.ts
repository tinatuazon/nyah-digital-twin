'use server';

import { Index } from '@upstash/vector';
import { loadProfileData } from './profile-loader';
import { VectorLogger, VECTOR_CONFIG, truncateContent, isValidVectorUrl } from './vector-utils';
import type { ContentChunk, VectorUpload, UpstashInfoResult, ProfileData } from './types';

/**
 * Enhanced vector database setup with comprehensive error handling
 * @returns Configured vector index or fallback mode indicator
 */
export async function setupVectorDatabase(): Promise<Index | 'fallback_mode'> {
  const startTime = performance.now();
  VectorLogger.info('Initializing Upstash Vector database...');
  
  try {
    const vectorUrl = process.env.UPSTASH_VECTOR_REST_URL;
    const vectorToken = process.env.UPSTASH_VECTOR_REST_TOKEN;
    
    if (!vectorUrl || !vectorToken) {
      VectorLogger.warn('Upstash Vector environment variables not configured');
      return 'fallback_mode';
    }
    
    if (!isValidVectorUrl(vectorUrl)) {
      VectorLogger.warn('Invalid vector database URL format');
      return 'fallback_mode';
    }
    
    if (vectorUrl.includes('search.upstash.io')) {
      VectorLogger.warn('Detected Redis Search URL instead of Vector database URL');
      return 'fallback_mode';
    }
    
    const index = new Index({ url: vectorUrl, token: vectorToken });
    VectorLogger.info('Connected to Upstash Vector successfully');
    
    try {
      const info = await index.info();
      const currentCount = info.vectorCount || 0;
      const embeddingModel = (info as UpstashInfoResult).embeddingModel || '';
      
      VectorLogger.info('Database info retrieved', { 
        vectorCount: currentCount, 
        embeddingModel 
      });
      
      if (!embeddingModel) {
        VectorLogger.warn('No embedding model configured');
        return 'fallback_mode';
      }
      
      if (currentCount === 0) {
        VectorLogger.info('Database is empty, loading profile data...');
        await populateDatabase(index);
      }
      
      const duration = performance.now() - startTime;
      VectorLogger.performance('Vector database setup', duration);
      return index;
      
    } catch (infoError) {
      VectorLogger.warn('Could not get database info, using fallback', infoError);
      return 'fallback_mode';
    }
    
  } catch (error) {
    const duration = performance.now() - startTime;
    VectorLogger.error('Vector database setup failed', error);
    VectorLogger.performance('Vector setup (failed)', duration);
    return 'fallback_mode';
  }
}

/**
 * Populates the vector database with profile content
 */
async function populateDatabase(index: Index): Promise<void> {
  try {
    const profileData = await loadProfileData();
    if (!profileData) {
      throw new Error('Failed to load profile data');
    }
    
    const contentChunks = prepareContentChunks(profileData);
    if (contentChunks.length === 0) {
      throw new Error('No content chunks could be created');
    }
    
    VectorLogger.info(`Uploading ${contentChunks.length} content chunks...`);
    
    const vectorsToUpload: VectorUpload[] = contentChunks.map(chunk => ({
      id: chunk.id,
      data: `${chunk.title}: ${chunk.content}`,
      metadata: {
        title: chunk.title,
        type: chunk.type,
        content: chunk.content
      }
    }));
    
    await index.upsert(vectorsToUpload);
    VectorLogger.info('Successfully uploaded content chunks');
    
  } catch (error) {
    VectorLogger.error('Failed to populate database', error);
    throw error;
  }
}

/**
 * Enhanced content chunk preparation with validation
 */
function prepareContentChunks(profileData: ProfileData): ContentChunk[] {
  VectorLogger.info('Preparing content chunks from profile data...');
  const contentChunks: ContentChunk[] = [];
  
  try {
    // Personal information
    if (profileData.personal) {
      const personal = profileData.personal;
      const personalContent = `Name: ${personal.name || ''}. Title: ${personal.title || ''}. Location: ${personal.location || ''}. Summary: ${personal.summary || ''}. Elevator pitch: ${personal.elevator_pitch || ''}`;
      
      if (personalContent.length >= VECTOR_CONFIG.MIN_CHUNK_LENGTH) {
        contentChunks.push({
          id: 'personal_info',
          title: 'Personal Information',
          type: 'personal',
          content: truncateContent(personalContent)
        });
      }
    }
    
    // Experience information
    if (Array.isArray(profileData.experience)) {
      profileData.experience.forEach((exp, i) => {
        const achievements = exp.achievements_star 
          ? exp.achievements_star.map(a => a.result || '').join(' ')
          : '';
        
        const experienceContent = `Company: ${exp.company || ''}. Title: ${exp.title || ''}. Duration: ${exp.duration || ''}. Achievements: ${achievements}`;
        
        if (experienceContent.length >= VECTOR_CONFIG.MIN_CHUNK_LENGTH) {
          contentChunks.push({
            id: `experience_${i}`,
            title: `Experience at ${exp.company || 'Company'}`,
            type: 'experience',
            content: truncateContent(experienceContent)
          });
        }
      });
    }
    
    // Technical skills
    if (profileData.skills?.technical) {
      const skills = profileData.skills.technical;
      const progLangs = Array.isArray(skills.programming_languages) 
        ? skills.programming_languages.map(lang => lang.language || '').join(', ')
        : '';
      
      const frameworks = Array.isArray(skills.backend_frameworks)
        ? skills.backend_frameworks.map(fw => fw.framework || '').join(', ')
        : '';
      
      const databases = Array.isArray(skills.databases)
        ? skills.databases.map(db => db.database || '').join(', ')
        : '';
      
      const skillsContent = `Programming languages: ${progLangs}. Frameworks: ${frameworks}. Databases: ${databases}.`;
      
      if (skillsContent.length >= VECTOR_CONFIG.MIN_CHUNK_LENGTH) {
        contentChunks.push({
          id: 'technical_skills',
          title: 'Technical Skills',
          type: 'skills',
          content: truncateContent(skillsContent)
        });
      }
    }
    
    // Projects
    if (Array.isArray(profileData.projects_portfolio)) {
      profileData.projects_portfolio.forEach((project, i) => {
        const technologies = Array.isArray(project.technologies)
          ? project.technologies.join(', ')
          : '';
        
        const projectContent = `Name: ${project.name || ''}. Description: ${project.description || ''}. Technologies: ${technologies}. Impact: ${project.impact || ''}`;
        
        if (projectContent.length >= VECTOR_CONFIG.MIN_CHUNK_LENGTH) {
          contentChunks.push({
            id: `project_${i}`,
            title: `Project: ${project.name || 'Project'}`,
            type: 'project',
            content: truncateContent(projectContent)
          });
        }
      });
    }
    
    // Career goals
    if (profileData.career_goals) {
      const careerGoals = profileData.career_goals;
      const learningFocus = Array.isArray(careerGoals.learning_focus)
        ? careerGoals.learning_focus.join(', ')
        : '';
      
      const goalsContent = `Short term: ${careerGoals.short_term || ''}. Long term: ${careerGoals.long_term || ''}. Learning focus: ${learningFocus}`;
      
      if (goalsContent.length >= VECTOR_CONFIG.MIN_CHUNK_LENGTH) {
        contentChunks.push({
          id: 'career_goals',
          title: 'Career Goals',
          type: 'goals',
          content: truncateContent(goalsContent)
        });
      }
    }
    
    VectorLogger.info(`Created ${contentChunks.length} content chunks`);
    return contentChunks;
    
  } catch (error) {
    VectorLogger.error('Content chunk preparation failed', error);
    return contentChunks;
  }
}