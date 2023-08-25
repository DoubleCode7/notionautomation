import { parseFile } from 'music-metadata';
import { inspect } from 'util';

export default defineComponent({
  async run({ steps, $ }) {
    
    try {
      // Get the tmp file path
      const filePath = steps.Download_to_tmp.$return_value.tmpPath

      if (!filePath) {
        throw new Error("File path is missing or invalid.");
      }

      // Parse the file with music-metadata
      let dataPack;
      try {
        dataPack = await parseFile(filePath);
      } catch (error) {
        throw new Error("Failed to read audio file metadata. The file format might be unsupported or corrupted, or the file might no longer exist at the specified file path (which is in temp storage).");
      }

      // Get and return the duration in seconds
      const duration = Math.round(await inspect(dataPack.format.duration, { showHidden: false, depth: null }));
      return duration;
    } catch (error) {
      // Log the error and return an error message or handle the error as required
      console.error(error);
      throw new Error(`An error occurred while processing the audio file: ${error.message}`);
    }


  },
})