import type { Social } from '../../payload/payload-types';

export const fetchSocials = async (): Promise<Social[]> => {
  const pageRes: Social[] = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/globals/socials`,
    {
      next: { revalidate: 1 },
    }
  ).then((res) => res.json()); // eslint-disable-line function-paren-newline

  return pageRes ?? [];
};
