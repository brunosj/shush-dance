/** @deprecated Use revalidateContent — kept for import compatibility. */
export {
  revalidatePage,
  revalidatePageDelete,
} from './revalidateContent';

export const formatAppURL = ({
  doc,
}: {
  doc: { slug?: string | null };
}): string => {
  const pathToUse = doc.slug === 'home' ? '' : doc.slug || '';
  const { pathname } = new URL(
    `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/${pathToUse}`,
  );
  return pathname;
};
