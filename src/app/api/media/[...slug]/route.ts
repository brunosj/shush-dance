// app/api/media/[...slug]/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export async function GET(
  request: Request,
  { params }: { params: { slug: string[] } }
) {
  // Construct the file path from the slug parameters
  const filePath = path.join(process.cwd(), 'media', ...params.slug);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const stat = fs.statSync(filePath);

  // Set appropriate headers
  const headers = new Headers();
  headers.set('Content-Type', 'application/octet-stream'); // Change based on file type
  headers.set('Content-Length', stat.size.toString());
  headers.set(
    'Content-Disposition',
    `inline; filename="${params.slug[params.slug.length - 1]}"`
  );

  // Create a Readable stream from the file
  const fileStream = fs.createReadStream(filePath);

  // Use a new Response to send the file
  const response = new Response(fileStream as any, { headers });

  return response;
}
