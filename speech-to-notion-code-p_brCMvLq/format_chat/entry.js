export default defineComponent({
  async run({ steps, $ }) {
    
    const resultsArray = []
    for (let result of steps.openai_chat.$return_value) {
      
      // ChatGPT loves to occasionally throw commas after the final element in arrays, so let's remove them
      function removeTrailingCommas(jsonString) {
        const regex = /,\s*(?=])/g;
        return jsonString.replace(regex, '');
      }
      
      // Need some code that will ensure we only get the JSON portion of the response
      // This should be the entire response already, but we can't always trust GPT
      const jsonString = result.data.choices[0].message.content
        .replace(/^[^\{]*?{/, '{')
        .replace(/\}[^}]*?$/,'}')

      const cleanedJsonString = removeTrailingCommas(jsonString)
      
      let jsonObj
      try {
        jsonObj = JSON.parse(cleanedJsonString)
      } catch (error) {
        console.error("Error while parsing cleaned JSON string:")
        console.error(error)
        console.log("Original JSON string:", jsonString)
        console.log(cleanedJsonString)
        console.log("Cleaned JSON string:", cleanedJsonString)
        jsonObj = {}
      }
      
      const response = {
        choice: jsonObj,
        usage: !result.data.usage.total_tokens ? 0 : result.data.usage.total_tokens
      }

      resultsArray.push(response)
    }

    const chatResponse = {
      title: resultsArray[0].choice.title,
      sentiment: resultsArray[0].choice.sentiment,
      summary: [],
      main_points: [],
      action_items: [],
      stories: [],
      arguments: [],
      follow_up: [],
      related_topics: [],
      usageArray: []
    }

    for (let arr of resultsArray) {
      chatResponse.summary.push(arr.choice.summary)
      chatResponse.main_points.push(arr.choice.main_points)
      chatResponse.action_items.push(arr.choice.action_items)
      chatResponse.stories.push(arr.choice.stories)
      chatResponse.arguments.push(arr.choice.arguments)
      chatResponse.follow_up.push(arr.choice.follow_up)
      chatResponse.related_topics.push(arr.choice.related_topics)
      chatResponse.usageArray.push(arr.usage)
    }

    console.log(chatResponse.related_topics)

    function arraySum (arr) {
      const init = 0
      const sum = arr.reduce((accumulator, currentValue) => accumulator + currentValue, init)
      return sum
    }
    
    const finalChatResponse = {
      title: chatResponse.title,
      summary: chatResponse.summary.join(' '),
      sentiment: chatResponse.sentiment,
      main_points: chatResponse.main_points.flat(),
      action_items: chatResponse.action_items.flat(),
      stories: chatResponse.stories.flat(),
      arguments: chatResponse.arguments.flat(),
      follow_up: chatResponse.follow_up.flat(),
      related_topics: Array.from(new Set(chatResponse.related_topics.flat().map(item => item.toLowerCase()))).sort(),
      tokens: arraySum(chatResponse.usageArray)
    }

    return finalChatResponse

  },
})