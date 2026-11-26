import type { CollectionAfterChangeHook } from 'payload';

export const loginAfterCreate: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  if (operation === 'create' && !req.user) {
    const data = req.data as { email?: string; password?: string } | undefined;
    const { email, password } = data ?? {};

    if (email && password) {
      const { user, token } = await req.payload.login({
        collection: 'users',
        data: { email, password },
        req,
      });

      return {
        ...doc,
        token,
        user,
      };
    }
  }

  return doc;
};