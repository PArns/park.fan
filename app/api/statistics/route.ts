import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.park.fan/statistics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'park.fan-website/1.0',
      },
      next: { revalidate: 300 }, // Cache für 5 Minuten
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
