import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export const revalidate = 0;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ call_id: string }> }
) {
  try {
    const { call_id } = await params;
    const body = await req.json();
    const { outcome, success_condition, notes } = body;

    // Try FastAPI proxy
    try {
      const res = await fetch(`http://127.0.0.1:8001/api/calls/${call_id}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome, success_condition, notes }),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback to Python direct execution
    }

    const backendDir = path.resolve(process.cwd(), '../backend');
    const script = `import json; from src.db import update_call_outcome; ok = update_call_outcome(call_id=${JSON.stringify(
      call_id
    )}, outcome=${JSON.stringify(outcome)}, success_condition=${JSON.stringify(
      success_condition || null
    )}, notes=${JSON.stringify(notes || null)}); print(json.dumps({'ok': ok}))`;

    const pyCmd = `python -c "${script.replace(/"/g, '\\"')}"`;
    const output = execSync(pyCmd, { cwd: backendDir, encoding: 'utf-8' });
    const result = JSON.parse(output.trim());
    if (result.ok) {
      return NextResponse.json({ status: 'updated', call_id, outcome });
    }
    return NextResponse.json({ error: 'Call record not found' }, { status: 404 });
  } catch (err) {
    console.error('Failed to update call outcome:', err);
    return NextResponse.json({ error: 'Internal error updating outcome' }, { status: 500 });
  }
}
