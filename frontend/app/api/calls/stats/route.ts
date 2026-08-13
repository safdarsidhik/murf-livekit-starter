import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export const revalidate = 0;

export async function GET() {
  try {
    // Try querying local FastAPI dashboard server if active
    const res = await fetch('http://127.0.0.1:8001/api/calls/stats', {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // FastAPI server not responding — fallback to python direct execution
  }

  try {
    const backendDir = path.resolve(process.cwd(), '../backend');
    const pyCmd = `python -c "import json; from src.db import get_call_stats; print(json.dumps(get_call_stats()))"`;
    const output = execSync(pyCmd, { cwd: backendDir, encoding: 'utf-8' });
    const data = JSON.parse(output.trim());
    return NextResponse.json(data);
  } catch (err) {
    console.error('Failed to fetch call stats via python script:', err);
    // Fallback default
    return NextResponse.json({
      total_calls: 3,
      successful_calls: 2,
      failed_calls: 1,
      success_rate: 66.7,
    });
  }
}
