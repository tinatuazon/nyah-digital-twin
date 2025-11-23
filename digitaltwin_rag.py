"""
Digital Twin RAG Application
Based on Binal's production implementation
- Upstash Vector: Built-in embeddings and vector storage
- Groq: Ultra-fast LLM inference
"""

import os
import json
from dotenv import load_dotenv
from upstash_vector import Index
from groq import Groq

# Load environment variables
load_dotenv()

# Constants
JSON_FILE = "data/digitaltwin.json"
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
DEFAULT_MODEL = "llama-3.1-8b-instant"

def setup_groq_client():
    """Setup Groq client"""
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY not found in .env file")
        return None
    
    try:
        client = Groq(api_key=GROQ_API_KEY)
        print("✅ Groq client initialized successfully!")
        return client
    except Exception as e:
        print(f"❌ Error initializing Groq client: {str(e)}")
        return None

def setup_vector_database():
    """Setup Upstash Vector database with built-in embeddings"""
    print("🔄 Setting up Upstash Vector database...")
    
    try:
        # Get environment variables directly
        vector_url = os.getenv('UPSTASH_VECTOR_REST_URL')
        vector_token = os.getenv('UPSTASH_VECTOR_REST_TOKEN')
        
        if not vector_url or not vector_token:
            print("❌ Upstash Vector environment variables not found")
            print("📝 Using fallback mode - loading profile data for direct search")
            return "fallback_mode"
        
        # Check if URL is for Vector service (not Search service)
        if "search.upstash.io" in vector_url:
            print("⚠️  Detected Upstash Redis Search URL, but need Vector database")
            print("💡 To fix this, create an Upstash Vector database at: https://console.upstash.com/")
            print("   Then update your .env with the Vector database credentials")
            print("📝 Using fallback mode for now...")
            return "fallback_mode"
        
        # Try different initialization approaches
        try:
            index = Index(url=vector_url, token=vector_token)
            print("✅ Connected to Upstash Vector successfully!")
        except Exception as e1:
            print(f"❌ Vector database connection failed: {e1}")
            print("📝 Using fallback mode - loading profile data for direct search")
            return "fallback_mode"
        
        # Check current vector count with error handling
        try:
            info = index.info()
            current_count = getattr(info, 'vector_count', 0)
            print(f"📊 Current vectors in database: {current_count}")
            
            # Check if embedding model is configured
            embedding_model = ""
            if hasattr(info, 'dense_index') and info.dense_index:
                embedding_model = getattr(info.dense_index, 'embedding_model', '')
            
            if not embedding_model:
                print("⚠️  Vector database has no embedding model configured")
                print("📝 Using fallback mode instead of vector storage")
                return "fallback_mode"
            else:
                print(f"✅ Embedding model: {embedding_model}")
            
        except Exception as e:
            print(f"Warning: Could not get vector count: {e}")
            current_count = 0
        
        # Load data if database is empty and has embedding model
        if current_count == 0:
            print("📝 Loading your professional profile...")
            
            try:
                with open(JSON_FILE, "r", encoding="utf-8") as f:
                    profile_data = json.load(f)
            except FileNotFoundError:
                print(f"❌ {JSON_FILE} not found!")
                return "fallback_mode"
            
            # Prepare text chunks for embedding
            content_chunks = []
            
            # Add personal information
            personal = profile_data.get('personal', {})
            if personal:
                content_chunks.append({
                    'id': 'personal_info',
                    'title': 'Personal Information',
                    'type': 'personal',
                    'content': f"Name: {personal.get('name', '')}. Title: {personal.get('title', '')}. Location: {personal.get('location', '')}. Summary: {personal.get('summary', '')}. Elevator pitch: {personal.get('elevator_pitch', '')}"
                })
            
            # Add experience information
            experience = profile_data.get('experience', [])
            for i, exp in enumerate(experience):
                achievements = ' '.join([achievement.get('result', '') for achievement in exp.get('achievements_star', [])])
                content_chunks.append({
                    'id': f'experience_{i}',
                    'title': f'Experience at {exp.get("company", "")}',
                    'type': 'experience',
                    'content': f"Company: {exp.get('company', '')}. Title: {exp.get('title', '')}. Duration: {exp.get('duration', '')}. Achievements: {achievements}"
                })
            
            # Add skills information
            skills = profile_data.get('skills', {})
            technical_skills = skills.get('technical', {})
            if technical_skills:
                prog_langs = ', '.join([lang.get('language', '') for lang in technical_skills.get('programming_languages', [])])
                frameworks = ', '.join([fw.get('framework', '') for fw in technical_skills.get('backend_frameworks', [])])
                databases = ', '.join([db.get('database', '') for db in technical_skills.get('databases', [])])
                content_chunks.append({
                    'id': 'technical_skills',
                    'title': 'Technical Skills',
                    'type': 'skills',
                    'content': f"Programming languages: {prog_langs}. Frameworks: {frameworks}. Databases: {databases}."
                })
            
            # Add projects information
            projects = profile_data.get('projects_portfolio', [])
            for i, project in enumerate(projects):
                content_chunks.append({
                    'id': f'project_{i}',
                    'title': f'Project: {project.get("name", "")}',
                    'type': 'project',
                    'content': f"Name: {project.get('name', '')}. Description: {project.get('description', '')}. Technologies: {', '.join(project.get('technologies', []))}. Impact: {project.get('impact', '')}"
                })
            
            # Add career goals
            career_goals = profile_data.get('career_goals', {})
            if career_goals:
                content_chunks.append({
                    'id': 'career_goals',
                    'title': 'Career Goals',
                    'type': 'goals',
                    'content': f"Short term: {career_goals.get('short_term', '')}. Long term: {career_goals.get('long_term', '')}. Learning focus: {', '.join(career_goals.get('learning_focus', []))}"
                })
            
            if not content_chunks:
                print("❌ No content could be extracted from profile data")
                return "fallback_mode"
            
            # Upload text data for auto-embedding (Upstash will handle embedding)
            try:
                vectors_to_upload = []
                for chunk in content_chunks:
                    vectors_to_upload.append({
                        "id": chunk['id'],
                        "data": f"{chunk['title']}: {chunk['content']}",  # Text to be embedded
                        "metadata": {
                            "title": chunk['title'],
                            "type": chunk['type'],
                            "content": chunk['content']
                        }
                    })
                
                # Use upsert with data parameter for auto-embedding
                index.upsert(vectors=vectors_to_upload)
                print(f"✅ Successfully uploaded {len(vectors_to_upload)} content chunks!")
                
            except Exception as upload_error:
                print(f"❌ Vector upload failed: {upload_error}")
                print("💡 Continuing with enhanced fallback mode...")
                return "fallback_mode"
        
        return index
        
    except Exception as e:
        print(f"❌ Error setting up database: {str(e)}")
        print("📝 Using fallback mode - loading profile data for direct search")
        return "fallback_mode"

# Global variable to store profile data for fallback mode
profile_data = None

def load_profile_data():
    """Load profile data for fallback mode"""
    global profile_data
    try:
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            profile_data = json.load(f)
        print("✅ Profile data loaded successfully!")
        return True
    except FileNotFoundError:
        print(f"❌ {JSON_FILE} not found!")
        return False

def query_vectors(index, query_text, top_k=3):
    """Query Upstash Vector for similar vectors"""
    try:
        results = index.query(
            data=query_text,
            top_k=top_k,
            include_metadata=True
        )
        return results
    except Exception as e:
        print(f"❌ Error querying vectors: {str(e)}")
        return None

def generate_response_with_groq(client, prompt, model=DEFAULT_MODEL):
    """Generate response using Groq"""
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "You are Cristina Tuazon's AI digital twin. CRITICAL: Only use information explicitly provided in the user's context. Never add, assume, or invent details not present in the provided information. If asked about something not in the context, clearly state you don't have that information. Speak in first person as Cristina."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,  # Lower temperature for more factual responses
            max_tokens=500
        )
        
        return completion.choices[0].message.content.strip()
        
    except Exception as e:
        return f"❌ Error generating response: {str(e)}"

def rag_query(index, groq_client, question):
    """Perform RAG query using Upstash Vector + Groq or fallback mode"""
    try:
        if index == "fallback_mode":
            # Fallback mode - search in profile data directly
            print("🧠 Searching your professional profile (fallback mode)...")
            
            if not profile_data:
                return "I don't have access to profile information."
            
            # Simple keyword matching for fallback
            question_lower = question.lower()
            relevant_sections = []
            
            # Search in different sections
            if any(word in question_lower for word in ['experience', 'work', 'job', 'company', 'freelance']):
                experience = profile_data.get('experience', [])
                for exp in experience:
                    company = exp.get('company', '')
                    title = exp.get('title', '')
                    duration = exp.get('duration', '')
                    tech_skills = exp.get('technical_skills_used', {})
                    backend = ', '.join(tech_skills.get('backend', []))
                    frontend = ', '.join(tech_skills.get('frontend', []))
                    relevant_sections.append(f"Experience: {title} at {company} ({duration}). Backend: {backend}. Frontend: {frontend}")
            
            if any(word in question_lower for word in ['skills', 'technical', 'programming', 'technology', 'languages', 'frameworks']):
                skills = profile_data.get('skills', {}).get('technical', {})
                
                # Programming languages
                prog_langs = []
                for lang in skills.get('programming_languages', []):
                    lang_info = f"{lang.get('language', '')} ({lang.get('proficiency', '')} - {lang.get('years', '')} years)"
                    prog_langs.append(lang_info)
                
                # Backend frameworks  
                frameworks = []
                for fw in skills.get('backend_frameworks', []):
                    fw_info = f"{fw.get('framework', '')} (versions: {', '.join(fw.get('versions_used', []))})"
                    frameworks.append(fw_info)
                
                # Databases
                databases = []
                for db in skills.get('databases', []):
                    db_info = f"{db.get('database', '')} ({db.get('proficiency', '')} - {db.get('years', '')} years)"
                    databases.append(db_info)
                
                # Frontend technologies
                frontend_tech = []
                for tech in skills.get('frontend_technologies', []):
                    tech_info = f"{tech.get('technology', tech.get('language', ''))} ({tech.get('proficiency', '')} - {tech.get('years', '')} years)"
                    frontend_tech.append(tech_info)
                
                if prog_langs:
                    relevant_sections.append(f"Programming Languages: {', '.join(prog_langs)}")
                if frameworks:
                    relevant_sections.append(f"Backend Frameworks: {', '.join(frameworks)}")
                if databases:
                    relevant_sections.append(f"Databases: {', '.join(databases)}")
                if frontend_tech:
                    relevant_sections.append(f"Frontend Technologies: {', '.join(frontend_tech)}")
            
            if any(word in question_lower for word in ['project', 'portfolio', 'built', 'developed']):
                projects = profile_data.get('projects_portfolio', [])
                for proj in projects:
                    name = proj.get('name', '')
                    description = proj.get('description', '')
                    technologies = ', '.join(proj.get('technologies', []))
                    impact = proj.get('impact', '')
                    relevant_sections.append(f"Project: {name} - {description}. Technologies used: {technologies}. Impact: {impact}")
            
            if any(word in question_lower for word in ['goal', 'career', 'future', 'learning']):
                goals = profile_data.get('career_goals', {})
                if goals.get('short_term'):
                    relevant_sections.append(f"Short-term Career Goal: {goals.get('short_term', '')}")
                if goals.get('long_term'):
                    relevant_sections.append(f"Long-term Career Goal: {goals.get('long_term', '')}")
                learning_focus = goals.get('learning_focus', [])
                if learning_focus:
                    relevant_sections.append(f"Current Learning Focus: {', '.join(learning_focus)}")
            
            if any(word in question_lower for word in ['education', 'university', 'degree', 'school']):
                education = profile_data.get('education', {})
                university = education.get('university', '')
                degree = education.get('degree', '')
                graduation = education.get('graduation_year', '')
                thesis = education.get('thesis_project', '')
                relevant_sections.append(f"Education: {degree} from {university} (graduating {graduation}). Thesis: {thesis}")
            
            # Default to personal info if no specific match
            if not relevant_sections:
                personal = profile_data.get('personal', {})
                relevant_sections.append(f"About me: {personal.get('summary', '')}")
                relevant_sections.append(f"My elevator pitch: {personal.get('elevator_pitch', '')}")
            
            context = "\n\n".join(relevant_sections)
        else:
            # Step 1: Query vector database
            results = query_vectors(index, question, top_k=3)
            
            if not results or len(results) == 0:
                return "I don't have specific information about that topic."
            
            # Step 2: Extract relevant content
            print("🧠 Searching your professional profile...")
            
            top_docs = []
            for result in results:
                metadata = result.metadata or {}
                title = metadata.get('title', 'Information')
                content = metadata.get('content', '')
                score = result.score
                
                print(f"🔹 Found: {title} (Relevance: {score:.3f})")
                if content:
                    top_docs.append(f"{title}: {content}")
            
            if not top_docs:
                return "I found some information but couldn't extract details."
            
            context = "\n\n".join(top_docs)
        
        print(f"⚡ Generating personalized response...")
        
        # Step 3: Generate response with context
        prompt = f"""You are answering as Cristina Tuazon. 

STRICT RULES:
1. Use ONLY the facts listed below - do not add ANY other information
2. Do not mention any technologies, frameworks, or experience not explicitly listed
3. If something isn't listed below, say "That's not mentioned in my profile"
4. Speak as Cristina in first person

VERIFIED FACTS FROM MY PROFILE:
{context}

QUESTION: {question}

ANSWER (using only the verified facts above):"""
        
        response = generate_response_with_groq(groq_client, prompt)
        return response
    
    except Exception as e:
        return f"❌ Error during query: {str(e)}"

def main():
    """Main application loop"""
    print("🤖 Your Digital Twin - AI Profile Assistant")
    print("=" * 50)
    print("🔗 Vector Storage: Upstash (built-in embeddings)")
    print(f"⚡ AI Inference: Groq ({DEFAULT_MODEL})")
    print("📋 Data Source: Your Professional Profile")
    
    # Setup clients
    groq_client = setup_groq_client()
    if not groq_client:
        return
    
    index = setup_vector_database()
    if not index:
        return
    
    # If in fallback mode, load profile data
    if index == "fallback_mode":
        if not load_profile_data():
            return
        print("✅ Your Digital Twin is ready! (Fallback mode)")
    else:
        print("✅ Your Digital Twin is ready!")
    
    # Interactive chat loop
    print("🤖 Chat with your AI Digital Twin!")
    print("Ask questions about your experience, skills, projects, or career goals.")
    print("Type 'exit' to quit.")
    
    print("💭 Try asking:")
    print("  - 'Tell me about your work experience'")
    print("  - 'What are your technical skills?'")
    print("  - 'Describe your career goals'")
    print()
    
    while True:
        question = input("You: ")
        if question.lower() in ["exit", "quit"]:
            print("👋 Thanks for chatting with your Digital Twin!")
            break
        
        if question.strip():
            answer = rag_query(index, groq_client, question)
            print(f"🤖 Digital Twin: {answer}")

if __name__ == "__main__":
    main()