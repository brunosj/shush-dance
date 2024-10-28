// app/api/audio/route.ts

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    // Assuming your API to upload file and return an ID
    const response = await fetch(
      `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/audio/upload`,
      {
        method: 'POST',
        body: JSON.stringify({
          title,
          file: await file.arrayBuffer(), // Convert file to ArrayBuffer or required format
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.PAYLOAD_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Audio file upload failed');
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error uploading audio file' },
      { status: 500 }
    );
  }
}
