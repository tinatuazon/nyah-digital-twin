import { ragQueryAction, setupVectorDatabaseAction } from '../../lib/server-actions';

export default async function TestPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">
            Cristina&apos;s Digital Twin - RAG Test
          </h1>
          <p className="text-slate-300">
            Test the RAG functionality before MCP integration
          </p>
        </header>

        <div className="space-y-6">
          <TestForm />
          <DatabaseStatus />
        </div>
      </div>
    </div>
  );
}

function TestForm() {
  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-green-400">
        Ask Questions About Cristina&apos;s Profile
      </h2>
      
      <form action={handleQuery} className="space-y-4">
        <div>
          <label htmlFor="question" className="block text-sm font-medium mb-2">
            Your Question:
          </label>
          <input
            type="text"
            id="question"
            name="question"
            placeholder="e.g., What are your technical skills with Laravel?"
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Ask Cristina 🤖
        </button>
      </form>
    </div>
  );
}

function DatabaseStatus() {
  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-yellow-400">
        Database Management
      </h2>
      
      <form action={handleSetup} className="space-y-4">
        <p className="text-slate-300">
          Initialize or refresh the vector database with Cristina&apos;s profile data.
        </p>
        
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Setup Database 🔧
        </button>
      </form>
    </div>
  );
}

// Server Actions
async function handleQuery(formData: FormData): Promise<void> {
  'use server';
  
  const question = formData.get('question') as string;
  
  if (!question) {
    return;
  }
  
  try {
    const result = await ragQueryAction(question);
    console.log('Query Result:', result);
  } catch (error) {
    console.error('Query Error:', error);
  }
}

async function handleSetup(): Promise<void> {
  'use server';
  
  try {
    const result = await setupVectorDatabaseAction();
    console.log('Setup Result:', result);
  } catch (error) {
    console.error('Setup Error:', error);
  }
}