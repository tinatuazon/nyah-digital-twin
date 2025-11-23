export async function GET() {
  return Response.json({ message: 'Hello from minimal API' });
}

export async function POST() {
  return Response.json({ message: 'POST received' });
}