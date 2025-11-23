'use server';

import { loadProfileData } from './profile-loader';
import type { ProfileData } from './types';

export async function fallbackSearch(question: string): Promise<string[]> {
  const profileData = await loadProfileData();
  if (!profileData) {
    return ['I don\'t have access to profile information.'];
  }
  
  const questionLower = question.toLowerCase();
  const relevantSections: string[] = [];
  
  // Search in different sections based on keywords
  if (containsKeywords(questionLower, ['experience', 'work', 'job', 'company', 'freelance'])) {
    addExperienceInfo(profileData, relevantSections);
  }
  
  if (containsKeywords(questionLower, ['skills', 'technical', 'programming', 'technology', 'languages', 'frameworks'])) {
    addSkillsInfo(profileData, relevantSections);
  }
  
  if (containsKeywords(questionLower, ['project', 'portfolio', 'built', 'developed'])) {
    addProjectsInfo(profileData, relevantSections);
  }
  
  if (containsKeywords(questionLower, ['goal', 'career', 'future', 'learning'])) {
    addCareerGoalsInfo(profileData, relevantSections);
  }
  
  if (containsKeywords(questionLower, ['education', 'university', 'degree', 'school'])) {
    addEducationInfo(profileData, relevantSections);
  }
  
  if (containsKeywords(questionLower, ['salary', 'location', 'relocation', 'remote', 'expectations', 'compensation', 'pay', 'rate', 'travel', 'authorization', 'visa', 'work rights'])) {
    addSalaryLocationInfo(profileData, relevantSections);
  }
  
  // Default to personal info if no specific match
  if (relevantSections.length === 0) {
    addPersonalInfo(profileData, relevantSections);
  }
  
  return relevantSections;
}

function containsKeywords(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword));
}

function addExperienceInfo(profileData: ProfileData, sections: string[]): void {
  profileData.experience.forEach(exp => {
    const techSkills = exp.technical_skills_used;
    const backend = techSkills?.backend?.join(', ') || '';
    const frontend = techSkills?.frontend?.join(', ') || '';
    sections.push(`Experience: ${exp.title} at ${exp.company} (${exp.duration}). Backend: ${backend}. Frontend: ${frontend}`);
  });
}

function addSkillsInfo(profileData: ProfileData, sections: string[]): void {
  const skills = profileData.skills.technical;
  
  // Programming languages
  const progLangs = skills.programming_languages?.map(lang => 
    `${lang.language} (${lang.proficiency} - ${lang.years} years)`
  ) || [];
  
  // Backend frameworks
  const frameworks = skills.backend_frameworks?.map(fw =>
    `${fw.framework} (versions: ${fw.versions_used?.join(', ') || ''})`
  ) || [];
  
  // Databases
  const databases = skills.databases?.map(db =>
    `${db.database} (${db.proficiency} - ${db.years} years)`
  ) || [];
  
  // Frontend technologies
  const frontendTech = skills.frontend_technologies?.map(tech =>
    `${tech.technology || tech.language || ''} (${tech.proficiency} - ${tech.years} years)`
  ) || [];
  
  if (progLangs.length > 0) {
    sections.push(`Programming Languages: ${progLangs.join(', ')}`);
  }
  if (frameworks.length > 0) {
    sections.push(`Backend Frameworks: ${frameworks.join(', ')}`);
  }
  if (databases.length > 0) {
    sections.push(`Databases: ${databases.join(', ')}`);
  }
  if (frontendTech.length > 0) {
    sections.push(`Frontend Technologies: ${frontendTech.join(', ')}`);
  }
}

function addProjectsInfo(profileData: ProfileData, sections: string[]): void {
  profileData.projects_portfolio.forEach(proj => {
    const technologies = proj.technologies?.join(', ') || '';
    sections.push(`Project: ${proj.name} - ${proj.description}. Technologies used: ${technologies}. Impact: ${proj.impact}`);
  });
}

function addCareerGoalsInfo(profileData: ProfileData, sections: string[]): void {
  const goals = profileData.career_goals;
  if (goals.short_term) {
    sections.push(`Short-term Career Goal: ${goals.short_term}`);
  }
  if (goals.long_term) {
    sections.push(`Long-term Career Goal: ${goals.long_term}`);
  }
  if (goals.learning_focus?.length > 0) {
    sections.push(`Current Learning Focus: ${goals.learning_focus.join(', ')}`);
  }
}

function addEducationInfo(profileData: ProfileData, sections: string[]): void {
  const education = profileData.education;
  sections.push(`Education: ${education.degree} from ${education.university} (graduating ${education.graduation_year}). Thesis: ${education.thesis_project}`);
}

function addPersonalInfo(profileData: ProfileData, sections: string[]): void {
  const personal = profileData.personal;
  sections.push(`About me: ${personal.summary}`);
  sections.push(`My elevator pitch: ${personal.elevator_pitch}`);
}

function addSalaryLocationInfo(profileData: ProfileData, sections: string[]): void {
  const salaryLocation = (profileData as any).salary_location;
  if (!salaryLocation) return;
  
  if (salaryLocation.current_status) {
    sections.push(`Current Status: ${salaryLocation.current_status}`);
  }
  
  if (salaryLocation.salary_expectations) {
    const expectations = salaryLocation.salary_expectations;
    const expectationsList = Object.entries(expectations)
      .filter(([key]) => key !== 'note')
      .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
      .join(', ');
    sections.push(`Salary Expectations: ${expectationsList}. Note: ${expectations.note || ''}`);
  }
  
  if (salaryLocation.location_preferences) {
    sections.push(`Location Preferences: ${salaryLocation.location_preferences.join(', ')}`);
  }
  
  if (salaryLocation.relocation_details) {
    const relDetails = salaryLocation.relocation_details;
    sections.push(`Relocation: Willing to relocate (${salaryLocation.relocation_willing ? 'Yes' : 'No'}). Domestic: ${relDetails.domestic_ph}. International: ${relDetails.international}. Remote preference: ${relDetails.remote_preference}`);
  }
  
  if (salaryLocation.work_authorization) {
    const workAuth = salaryLocation.work_authorization;
    sections.push(`Work Authorization: Philippines - ${workAuth.philippines}. International - ${workAuth.international}`);
  }
  
  if (salaryLocation.remote_experience) {
    sections.push(`Remote Work Experience: ${salaryLocation.remote_experience}`);
  }
}