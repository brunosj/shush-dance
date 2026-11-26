import type { CollectionBeforeChangeHook } from 'payload';
import { getPlaiceholder } from 'plaiceholder';

export const generateBlurDataURL: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create' && operation !== 'update') {
    return data;
  }

  const buffer = req.file?.data;
  if (!buffer || buffer.byteLength === 0) {
    return data;
  }

  try {
    const { base64 } = await getPlaiceholder(buffer, { size: 10 });
    return {
      ...data,
      blurDataURL: base64,
    };
  } catch (error) {
    req.payload.logger.error({
      err: error,
      msg: 'Failed to generate blurDataURL for media upload',
    });
    return data;
  }
};