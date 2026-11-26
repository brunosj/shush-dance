// collections/AudioFiles.ts
import { addDataAndFileToRequest } from '@payloadcms/next/utilities';
import type { CollectionConfig } from 'payload';

import { getAudioUploadDir } from '../../paths';

const _MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/vnd.wav',
  'audio/mp4',
  'audio/aiff',
  'audio/x-aiff',
  'audio/wav',
];

const Audio: CollectionConfig = {
  slug: 'audio',
  admin: {
    group: 'Music',
    useAsTitle: 'title',
    defaultColumns: ['title', 'filename', 'mimeType', 'updatedAt'],
  },
  upload: {
    staticDir: getAudioUploadDir(),
    mimeTypes: ALLOWED_MIME_TYPES,
  },
  access: {
    read: () => true,
  },
  endpoints: [
    {
      path: '/custom-upload',
      method: 'post',
      handler: async (req) => {
        try {
          await addDataAndFileToRequest(req);
          const title = (req.data as { title?: string } | undefined)?.title;
          const file = req.file;

          if (!file) {
            return Response.json(
              { error: 'No file uploaded' },
              { status: 400 },
            );
          }

          // Validate file type
          if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            return Response.json(
              { error: 'Invalid file type' },
              { status: 400 },
            );
          }

          // Validate file size
          // if (file.size > MAX_FILE_SIZE) {
          //   return res
          //     .status(400)
          //     .json({ error: 'File size exceeds the 5MB limit' });
          // }

          // Validate file duration
          // const duration = await getAudioDuration(file);
          // if (duration > 300) {
          //   // 300 seconds = 5 minutes
          //   return res
          //     .status(400)
          //     .json({ error: 'Audio duration exceeds the 5-minute limit' });
          // }

          const audioDoc = await req.payload.create({
            collection: 'audio',
            data: {
              title,
            },
            file,
          });

          return Response.json({
            message: 'Audio successfully uploaded.',
            doc: {
              id: audioDoc.id,
              title,
              filename: file.name,
              url: audioDoc.url,
            },
          });
        } catch (error) {
          console.error('Error in custom audio upload endpoint:', error);
          return Response.json(
            { error: 'Error uploading audio file' },
            { status: 500 },
          );
        }
      },
    },
  ],
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
    },
  ],
};

export default Audio;
