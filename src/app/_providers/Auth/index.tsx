'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { User } from '../../../payload/payload-types';

type ResetPassword = (args: {
  password: string;
  passwordConfirm: string;
  token: string;
}) => Promise<void>;

type ForgotPassword = (args: { email: string }) => Promise<void>;

type Create = (args: {
  email: string;
  password: string;
  passwordConfirm: string;
}) => Promise<void>;

type Login = (args: { email: string; password: string }) => Promise<User>;

type Logout = () => Promise<void>;

type AuthContext = {
  user?: User | null;
  setUser: (user: User | null) => void;
  logout: Logout;
  login: Login;
  create: Create;
  resetPassword: ResetPassword;
  forgotPassword: ForgotPassword;
  status: undefined | 'loggedOut' | 'loggedIn';
};

const Context = createContext({} as AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>();

  // used to track the single event of logging in or logging out
  // useful for `useEffect` hooks that should only run once
  const [status, setStatus] = useState<undefined | 'loggedOut' | 'loggedIn'>();
  const create = useCallback<Create>(async (args) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/create`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: args.email,
            password: args.password,
            passwordConfirm: args.passwordConfirm,
          }),
        },
      );

      if (res.ok) {
        const { data, errors } = await res.json();
        if (errors) throw new Error(errors[0].message);
        setUser(data?.loginUser?.user);
        setStatus('loggedIn');
      } else {
        throw new Error('Invalid login');
      }
    } catch (_e) {
      throw new Error('An error occurred while attempting to login.');
    }
  }, []);

  const login = useCallback<Login>(async (args) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/login`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: args.email,
            password: args.password,
          }),
        },
      );

      if (res.ok) {
        const { user, errors } = await res.json();
        if (errors) throw new Error(errors[0].message);
        setUser(user);
        setStatus('loggedIn');
        return user;
      }

      throw new Error('Invalid login');
    } catch (_e) {
      throw new Error('An error occurred while attempting to login.');
    }
  }, []);

  const logout = useCallback<Logout>(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/logout`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (res.ok) {
        setUser(null);
        setStatus('loggedOut');
      } else {
        throw new Error('An error occurred while attempting to logout.');
      }
    } catch (_e) {
      throw new Error('An error occurred while attempting to logout.');
    }
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/me`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (res.ok) {
          const { user: meUser } = await res.json();
          setUser(meUser || null);
          setStatus(meUser ? 'loggedIn' : undefined);
        } else {
          throw new Error('An error occurred while fetching your account.');
        }
      } catch (_e) {
        setUser(null);
        throw new Error('An error occurred while fetching your account.');
      }
    };

    fetchMe();
  }, []);

  const forgotPassword = useCallback<ForgotPassword>(async (args) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/forgot-password`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: args.email,
          }),
        },
      );

      if (res.ok) {
        const { data, errors } = await res.json();
        if (errors) throw new Error(errors[0].message);
        setUser(data?.loginUser?.user);
      } else {
        throw new Error('Invalid login');
      }
    } catch (_e) {
      throw new Error('An error occurred while attempting to login.');
    }
  }, []);

  const resetPassword = useCallback<ResetPassword>(async (args) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/reset-password`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: args.password,
            passwordConfirm: args.passwordConfirm,
            token: args.token,
          }),
        },
      );

      if (res.ok) {
        const { data, errors } = await res.json();
        if (errors) throw new Error(errors[0].message);
        setUser(data?.loginUser?.user);
        setStatus(data?.loginUser?.user ? 'loggedIn' : undefined);
      } else {
        throw new Error('Invalid login');
      }
    } catch (_e) {
      throw new Error('An error occurred while attempting to login.');
    }
  }, []);

  return (
    <Context.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        create,
        resetPassword,
        forgotPassword,
        status,
      }}
    >
      {children}
    </Context.Provider>
  );
};

type UseAuth<_T = User> = () => AuthContext;

export const useAuth: UseAuth = () => useContext(Context);
