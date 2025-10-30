import { CollectionConfig } from 'payload/types';
import audioField from '../../fields/audioField';
import afterChangeHook from '../../hooks/afterChangeHook';

const Tracks: CollectionConfig = {
  slug: 'tracks',
  labels: {
    singular: 'Track',
    plural: 'Tracks',
  },
  access: {
    read: () => true,
    update: () => true,
  },
  admin: {
    defaultColumns: ['title', 'year'],
    useAsTitle: 'title',
  },
  // endpoints: [
  //   {
  //     path: '/custom-create',
  //     method: 'post',
  //     handler: async (req, res, next) => {
  //       try {
  //         const {
  //           title,
  //           description,
  //           year,
  //           category,
  //           license,
  //           tags,
  //           contributorName,
  //           audioGroup,
  //           status,
  //         } = req.body;

  //         // Handle sound creation
  //         const soundDoc = await req.payload.create({
  //           collection: 'sounds',
  //           data: {
  //             title,
  //             description,
  //             year,
  //             category,
  //             license,
  //             tags,
  //             contributorName,
  //             audioGroup,
  //             status,
  //           },
  //         });

  //         res.status(200).json({
  //           message: 'Sound successfully created.',
  //           doc: soundDoc,
  //         });
  //       } catch (error) {
  //         console.error('Error in custom sound creation endpoint:', error);
  //         res.status(500).json({ error: 'Error creating sound' });
  //       }
  //     },
  //   },
  // ],
  hooks: {
    afterChange: [afterChangeHook],
  },
  fields: [
    {
      type: 'group',
      name: 'audioGroup',
      label: 'Audio File',
      fields: [
        audioField,
        {
          name: 'audioHighQuality',
          label: 'Audio File (AIFF)',
          type: 'relationship',
          relationTo: 'audio',
        },
        {
          name: 'audioUpload',
          label: 'Audio File (MP3)',
          type: 'relationship',
          relationTo: 'audio',
          admin: {
            description:
              'You need to refresh the page after uploading a new audio file to see the changes in the player.',
          },
        },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: false,
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
      label: 'Artist',
      required: true,
    },
    {
      name: 'release',
      type: 'relationship',
      relationTo: 'releases',
      label: 'Release',
      hasMany: false,
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
    },

    // {
    //   name: 'moderationNotes',
    //   type: 'textarea',
    //   admin: {
    //     readOnly: false,
    //   },
    // },
  ],
};

export default Tracks;
