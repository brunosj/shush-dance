import type { Access } from 'payload';

import { checkRole } from '../collections/Users/checkRole';

export const admins: Access = ({ req: { user } }) => {
  return checkRole(['admin'], user);
};
