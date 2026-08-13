import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export const revalidate = 0;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ref_id: string }> }
) {
  try {
    const { ref_id } = await params;

    try {
      const res = await fetch(`http://127.0.0.1:8001/api/escalations/${ref_id}/resolve`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback
    }

    const backendDir = path.resolve(process.cwd(), '../backend');
    const pyCmd = `python -c "import json; from src.escalation import resolve_escalation; ok = resolve_escalation('${ref_id}'); print(json.dumps({'ok': ok}))"`;
    const output = execSync(pyCmd, { cwd: backendDir, encoding: 'utf-8' });
    const result = JSON.parse(output.trim());
    if (result.ok) {
      return NextResponse.json({ status: 'resolved', ref_id });
    }
    return NextResponse.json({ error: 'Escalation ref_id not found' }, { status: 404 });
  } catch (err) {
    console.error('Failed to resolve escalation:', err);
    return NextResponse.json({ error: 'Internal error resolving escalation' }, { status: 500 });
  }
}
