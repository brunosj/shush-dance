import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

import { payloadToken } from '../../../_api/token';
import { getDraftPreviewSecret } from '../../../../payload/utilities/draftPreviewSecret';

export async function GET(
  req: Request & {
    cookies: {
      get: (name: string) => {
        value: string;
      };
    };
  },
): Promise<Response> {
  const token = req.cookies.get(payloadToken)?.value;
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const secret = searchParams.get('secret');

  if (!url) {
    return new Response('No URL provided', { status: 404 });
  }

  if (!token) {
    return new Response('You are not allowed to preview this page', { status: 403 });
  }

  // validate the Payload token
  const userReq = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/me`,
    {
      headers: {
        Authorization: `JWT ${token}`,
      },
    },
  );

  const userRes = await userReq.json();

  if (!userReq.ok || !userRes?.user) {
    (await draftMode()).disable();
    return new Response('You are not allowed to preview this page', {
      status: 403,
    });
  }

  const draftSecret = getDraftPreviewSecret();
  if (!draftSecret || secret !== draftSecret) {
    return new Response('Invalid token', { status: 401 });
  }

  (await draftMode()).enable();

  redirect(url);
}
