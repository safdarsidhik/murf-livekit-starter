import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const outcome = searchParams.get('outcome') || '';
  const limit = searchParams.get('limit') || '50';

  try {
    const res = await fetch(`http://127.0.0.1:8001/api/calls?outcome=${outcome}&limit=${limit}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // FastAPI server fallback
  }

  try {
    const backendDir = path.resolve(process.cwd(), '../backend');
    const pyCmd = `python -c "import json; from src.db import list_call_logs; print(json.dumps(list_call_logs(limit=${limit}, outcome='${outcome}')))"`;
    const output = execSync(pyCmd, { cwd: backendDir, encoding: 'utf-8' });
    const data = JSON.parse(output.trim());
    return NextResponse.json(data);
  } catch (err) {
    console.error('Failed to list calls via python script:', err);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      call_id,
      outcome,
      success_condition = 'Query resolved',
      user_id = 'FF001',
      caller_name = 'Farmer',
      started_at,
      ended_at,
      duration_seconds = 0,
      notes = '',
    } = body;

    // Try posting to FastAPI backend first
    try {
      const res = await fetch('http://127.0.0.1:8001/api/calls/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_id,
          outcome,
          success_condition,
          user_id,
          caller_name,
          started_at,
          ended_at,
          duration_seconds,
          notes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // FastAPI fallback
    }

    // Direct Python SQLite script execution
    const backendDir = path.resolve(process.cwd(), '../backend');
    const script = `import json; from src.db import record_call_outcome; res = record_call_outcome(call_id=${JSON.stringify(
      call_id
    )}, outcome=${JSON.stringify(outcome)}, success_condition=${JSON.stringify(
      success_condition
    )}, user_id=${JSON.stringify(user_id)}, caller_name=${JSON.stringify(
      caller_name
    )}, duration_seconds=${Number(duration_seconds) || 0}, notes=${JSON.stringify(
      notes
    )}); print(json.dumps(res))`;

    const pyCmd = `python -c "${script.replace(/"/g, '\\"')}"`;
    const output = execSync(pyCmd, { cwd: backendDir, encoding: 'utf-8' });
    const data = JSON.parse(output.trim());
    return NextResponse.json({ status: 'success', record: data });
  } catch (err) {
    console.error('Failed to record call outcome:', err);
    return NextResponse.json({ error: 'Failed to record call outcome' }, { status: 500 });
  }
}
