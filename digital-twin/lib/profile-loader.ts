import { readFile } from 'fs/promises';
import { join } from 'path';
import type { ProfileData } from './types';

const JSON_FILE = join(process.cwd(), '..', 'data', 'digitaltwin.json');

export async function loadProfileData(): Promise<ProfileData | null> {
  try {
    const fileContent = await readFile(JSON_FILE, 'utf-8');
    const profileData: ProfileData = JSON.parse(fileContent);
    console.log('✅ Profile data loaded successfully!');
    return profileData;
  } catch (error) {
    console.error(`❌ Error loading profile data: ${error}`);
    return null;
  }
}