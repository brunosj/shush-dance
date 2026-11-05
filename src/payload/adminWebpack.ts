import type { Config } from 'payload/config';

type WebpackHook = NonNullable<NonNullable<Config['admin']>['webpack']>;

/** Payload admin and @payloadcms/richtext-slate must share one Slate stack. */
export const extendAdminWebpack: WebpackHook = (webpackConfig) => {
  const alias = {
    ...(typeof webpackConfig.resolve?.alias === 'object'
      ? webpackConfig.resolve.alias
      : {}),
    slate: require.resolve('slate'),
    'slate-react': require.resolve('slate-react'),
    'react-i18next': require.resolve('react-i18next'),
    '@faceless-ui/modal': require.resolve('@faceless-ui/modal'),
  };

  return {
    ...webpackConfig,
    resolve: {
      ...webpackConfig.resolve,
      alias,
    },
  };
};
