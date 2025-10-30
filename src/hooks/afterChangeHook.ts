import { CollectionAfterChangeHook } from 'payload/types';

const afterChangeHook: CollectionAfterChangeHook = async ({
  doc, // full document data
  req, // full express request
  previousDoc, // document data before updating the collection
  operation, // name of the operation ie. 'create', 'update'
}) => {
  // Log the hook start
  // console.log('Hook started:', { doc, previousDoc, operation });

  // Check if the operation is create or update
  if (operation === 'create' || operation === 'update') {
    try {
      // Check if audioGroup exists and if 'audioUpload' is set
      const { audioGroup } = doc;

      // Check if `audioUpload` has changed or if the operation is 'create'
      const audioUploadHasChanged =
        !previousDoc ||
        audioGroup?.audioUpload !== previousDoc.audioGroup?.audioUpload;

      if (audioUploadHasChanged && audioGroup?.audioUpload) {
        // Log the current and previous audioUpload
        // console.log(
        //   'Previous audioUpload:',
        //   previousDoc?.audioGroup?.audioUpload
        // );
        // console.log('Current audioUpload:', audioGroup.audioUpload);

        // Check if audioUpload is an object and has the id property
        const audioUploadId =
          typeof audioGroup.audioUpload === 'object'
            ? audioGroup.audioUpload.id
            : audioGroup.audioUpload;

        // Fetch the related audio document
        const audioDoc = await req.payload.findByID({
          collection: 'audio', // The slug of your audio collection
          id: audioUploadId, // ID of the related audio document
        });

        if (!audioDoc) {
          // console.error('Audio document not found for ID:', audioUploadId);
          return; // Stop execution if audioDoc is not found
        }

        // Log the fetched audio document
        // console.log('Fetched audioDoc:', audioDoc);

        // Determine if we need to update audioFile
        const shouldUpdateAudioFile =
          !audioGroup.audioFile ||
          (typeof audioGroup.audioFile === 'string' &&
            audioGroup.audioFile !== audioUploadId) ||
          (typeof audioGroup.audioFile === 'object' &&
            audioGroup.audioFile.id !== audioUploadId);

        if (shouldUpdateAudioFile) {
          // console.log('Updating audioFile to match audioUpload...');

          await req.payload.update({
            collection: 'tracks', // The slug of your collection
            id: doc.id, // ID of the current document
            data: {
              audioGroup: {
                ...audioGroup,
                audioFile: audioUploadId, // Ensure we only set the ID
              },
            },
          });
          // console.log('audioFile was set to audioUpload value');
        } else if (
          audioDoc &&
          typeof audioGroup.audioFile === 'object' &&
          audioGroup.audioFile.id !== audioDoc.id
        ) {
          // console.log(
          //   'Updating audioFile with the correct audio document ID...'
          // );

          await req.payload.update({
            collection: 'tracks', // The slug of your collection
            id: doc.id, // ID of the current document
            data: {
              audioGroup: {
                ...audioGroup,
                audioFile: audioDoc.id, // Set audioFile with the audio document ID
              },
            },
          });
          // console.log('audioFile updated in audioGroup');
        }
      } else {
        // console.log('audioUpload has not changed. Skipping update.');
      }
    } catch (error) {
      console.error('Error updating audioFile field:', error);
    }
  }

  // console.log('Hook ended');
  return doc;
};

export default afterChangeHook;
