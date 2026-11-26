import type { CollectionConfig } from 'payload';

import { admins } from '../../access/admins';
import { anyone } from '../../access/anyone';
import adminsAndUser from './access/adminsAndUser';
import { checkRole } from './checkRole';
import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin';
import { loginAfterCreate } from './hooks/loginAfterCreate';

const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    group: 'Admin',
    useAsTitle: 'name',
    defaultColumns: ['name', 'email'],
  },
  access: {
    read: adminsAndUser,
    create: anyone,
    update: adminsAndUser,
    delete: admins,
    admin: ({ req: { user } }) => checkRole(['admin'], user),
  },
  hooks: {
    afterChange: [loginAfterCreate],
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['user'],
      options: [
        {
          label: 'admin',
          value: 'admin',
        },
        {
          label: 'user',
          value: 'user',
        },
      ],
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
      access: {
        read: ({ req: { user } }) => checkRole(['admin'], user),
        create: ({ req: { user } }) => checkRole(['admin'], user),
        update: ({ req: { user } }) => checkRole(['admin'], user),
      },
    },
  ],
  timestamps: true,
};

export default Users;
