export const mediaBlurDataURLField = {
  name: 'blurDataURL',
  type: 'text' as const,
  admin: {
    hidden: true,
    disableListColumn: true,
    disableListFilter: true,
    readOnly: true,
  },
};