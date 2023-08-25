import natural from 'natural'

export default defineComponent({
  async run({ steps, $ }) {

    const tokenizer = new natural.SentenceTokenizer()
    const transcriptSentences = tokenizer.tokenize(steps.create_transcription.$return_value.transcription)
    const summarySentences = tokenizer.tokenize(steps.format_chat.$return_value.summary)

    const sentencesPerParagraph = 3

    function sentenceGrouper(arr) {
      const newArray = []

      for (let i = 0; i < arr.length; i+= sentencesPerParagraph) {
        const group = []
        for (let j = i; j < i + sentencesPerParagraph; j++) {
          if (arr[j]) {
            group.push(arr[j])
          }
        }

        newArray.push(group.join(' '))
      }

      return newArray
    }

    function charMaxChecker(arr) {
      const sentenceArray = arr.map((element) => {
          if (element.length > 800) {
            const pieces = element.match(/.{800}[^\s]*\s*/g);
            if (element.length > pieces.join('').length) {
                pieces.push(element.slice(pieces.join('').length));
            }
            return pieces;
        } else {
            return element;
        }
      }).flat()

      return sentenceArray
    }

    const paragraphs = sentenceGrouper(transcriptSentences)
    const lengthCheckedParagraphs = charMaxChecker(paragraphs)

    const summaryParagraphs = sentenceGrouper(summarySentences)
    const lengthCheckedSummaryParagraphcs = charMaxChecker(summaryParagraphs)

    const allParagraphs = {
      transcript: lengthCheckedParagraphs,
      summary: lengthCheckedSummaryParagraphcs
    }

    return allParagraphs

  },
})