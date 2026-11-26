import type { User } from '../../payload-types';

export const checkRole = (
  allRoles: User['roles'] = [],
  user?: unknown,
): boolean => {
  if (user && typeof user === 'object' && 'roles' in user) {
    const roles = (user as User).roles;
    if (
      allRoles.some((role) => {
        return roles?.some((individualRole) => {
          return individualRole === role;
        });
      })
    ) {
      return true;
    }
  }

  return false;
};
