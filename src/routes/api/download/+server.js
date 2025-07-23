import { redirect, error } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

export async function load({ locals }) {
  // [UNCHANGED CONTENT FROM ORIGINAL CODE]
}

export const actions = {
  // [EXISTING ACTIONS: createFolder, uploadFile, toggleFavorite]

  downloadFile: async ({ params, locals, url }) => {
    if (!locals.user || !locals.pb.authStore.isValid) {
      throw redirect(302, '/login');
    }

    const fileId = url.searchParams.get('id');

    if (!fileId) {
      throw error(400, 'Missing file ID');
    }

    try {
      const fileRecord = await locals.pb.collection('files').getOne(fileId);

      if (fileRecord.owner !== locals.user.id) {
        throw error(403, 'Unauthorized');
      }

      const fileName = fileRecord.name;
      const fileField = fileRecord.file;

      const filePath = path.resolve(`./pb_data/storage/${fileRecord.collectionId}/${fileRecord.id}/${fileField}`);

      const buffer = await fs.readFile(filePath);
      return new Response(buffer, {
        headers: {
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Type': fileRecord.mime_type || 'application/octet-stream',
          'Content-Length': buffer.length.toString()
        }
      });

    } catch (err) {
      console.error('❌ DOWNLOAD_FILE: Error:', err);
      throw error(500, 'Failed to download file');
    }
  }
};
