import stream from "stream";
import { promisify } from "util";
import fs from "fs";
import got from "got";

export default defineComponent({
  async run({ steps, $ }) {
    
    // Workflow only supports files <100mb, so break out if the file is larger.
    if (steps.trigger.event.size > 100000000) {
      throw new Error("File is too large. Files must be mp3 or m4a filels under 100mb")
    }

    try {
        // Define the mimetype
        const mime = steps.trigger.event.path_lower.match(/\.\w+$/)[0]
        
        // Check if the mime type is supported (mp3 or m4a)
        if (mime !== '.mp3' && mime !== '.m4a') {
            throw new Error("Unsupported file type. Only mp3 and m4a files are supported.");
        }

        // Define the tmp file path
        const tmpPath = `/tmp/recording${mime}`
        
        // Download the audio recording from Dropbox to tmp file path
        const pipeline = promisify(stream.pipeline);
        await pipeline(
        got.stream(steps.trigger.event.link),
        fs.createWriteStream(tmpPath)
        );

        // Create a results object
        const results = {
        "tmpPath": tmpPath,
        "mimetype": mime
        }

        return results
    } catch (error) {
        // Log the error and return an error message or handle the error as required
        console.error(error);
        throw error;
    }
  }
})