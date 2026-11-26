// CMS redirects are not configured (plugin-redirects is not in the Payload config).
// Do not fetch this app's own /api/redirects here: in `next dev` that call waits on
// the same process that is evaluating redirects, so the browser stays blank.

module.exports = async () => {
  const internetExplorerRedirect = {
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    destination: '/ie-incompatible.html',
  };

  return [internetExplorerRedirect];
};
