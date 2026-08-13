import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';

  try {
    const res = await fetch(`http://127.0.0.1:8001/api/escalations?status=${status}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // FastAPI fallback
  }

  try {
    const backendDir = path.resolve(process.cwd(), '../backend');
    const pyCmd = `python -c "import json; from src.escalation import list_escalations; print(json.dumps(list_escalations(status='${status}')))"`;
    const output = execSync(pyCmd, { cwd: backendDir, encoding: 'utf-8' });
    const data = JSON.parse(output.trim());
    return NextResponse.json(data);
  } catch (err) {
    console.error('Failed to list escalations via python script:', err);
    return NextResponse.json([]);
  }
}
