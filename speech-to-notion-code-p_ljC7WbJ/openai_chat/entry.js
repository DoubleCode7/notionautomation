import { Configuration, OpenAIApi } from "openai"
import { encode, decode } from "gpt-3-encoder"

export default defineComponent({
  props: {
    openai: {
      type: "app",
      app: "openai",
    }
  },
  async run({steps, $}) {

    // Import the transcript from the previous step
    const transcript = steps.create_transcription.$return_value.transcription

    // Set the max number of input tokens
    const maxTokens = 2000

    // Initialize OpenAI
    const openAIkey = this.openai.$auth.api_key
    const configuration = new Configuration({
      apiKey: openAIkey,
    });
    const openai = new OpenAIApi(configuration);
    
    // Split the transcript into shorter strings if needed, based on GPT token limit
    function splitTranscript(encodedTranscript, maxTokens) {
      const stringsArray = []
      let currentIndex = 0

      while (currentIndex < encodedTranscript.length) {
        let endIndex = Math.min(currentIndex + maxTokens, encodedTranscript.length)
        
        // Find the next period
        while (endIndex < encodedTranscript.length && decode([encodedTranscript[endIndex]]) !== ".") {
          endIndex++
        }

        // Include the period in the current string
        if (endIndex < encodedTranscript.length) {
          endIndex++
        }

        // Add the current chunk to the stringsArray
        const chunk = encodedTranscript.slice(currentIndex, endIndex)
        stringsArray.push(decode(chunk))

        currentIndex = endIndex
      }

      return stringsArray
    }

    const encoded = encode(transcript)

    const stringsArray = splitTranscript(encoded, maxTokens)
    const result = await sendToChat(stringsArray)
    return result

    // Function to send transcript string(s) to Chat API
    async function sendToChat (stringsArray) {
      
      const resultsArray = []

      for (let arr of stringsArray) {

        // Define the prompt
        const prompt = `Analyze the transcript provided below, then provide the following:
Key "title:" - add a title.
Key "summary" - create a summary.
Key "main_points" - add an array of the main points. Limit each item to 100 words, and limit the list to 10 items.
Key "action_items:" - add an array of action items. Limit each item to 100 words, and limit the list to 5 items.
Key "follow_up:" - add an array of follow-up questions. Limit each item to 100 words, and limit the list to 5 items.
Key "stories:" - add an array of an stories, examples, or cited works found in the transcript. Limit each item to 200 words, and limit the list to 5 items.
Key "arguments:" - add an array of potential arguments against the transcript. Limit each item to 100 words, and limit the list to 5 items.
Key "related_topics:" - add an array of topics related to the transcript. Limit each item to 100 words, and limit the list to 5 items.
Key "sentiment" - add a sentiment analysis

Write all responses in Spanish.

Ensure that the final element of any array within the JSON object is not followed by a comma.

Transcript:
        
        ${arr}`

        let retries = 3
        while (retries > 0) {
          try {
            const completion = await openai.createChatCompletion({
              model: "gpt-3.5-turbo",
              messages: [{role: "user", content: prompt}, {role: "system", content: `You are an assistant that only speaks Spanish, formatted as JSON. Do not write normal text.

Example formatting:

{
    "title": "Notion Buttons",
    "summary": "A collection of buttons for Notion",
    "action_items": [
        "item 1",
        "item 2",
        "item 3"
    ],
    "follow_up": [
        "item 1",
        "item 2",
        "item 3"
    ],
    "arguments": [
        "item 1",
        "item 2",
        "item 3"
    ],
    "related_topics": [
        "item 1",
        "item 2",
        "item 3"
    ]
    "sentiment": "positive"
}
              `}],
              temperature: 0.2
            });
            
            resultsArray.push(completion)
            break
          } catch (error) {
            if(error.response && error.response.status === 500) {
              retries--
              if (retries == 0) {
                throw new Error("Failed to get a response from OpenAI Chat API after 3 attempts.")
              }
              console.log("OpenAI Chat API returned a 500 error. Retrying...")
            } else {
              throw error
            }
          }
        }

      }
      
      return resultsArray
    }
    
  },
})
