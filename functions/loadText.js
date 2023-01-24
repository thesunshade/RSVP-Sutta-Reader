import { PARAGRAPH_BREAK } from "../script.js";
import { SENTENCE_BREAK } from "../script.js";
import { textArea } from "../script.js";

export default function loadText() {
  let words = textArea.value
    .split(/\n\n+/g)
    .filter(Boolean)
    .join(" " + PARAGRAPH_BREAK + " ")
    .replace(/ ([-–—%]) /g, " $1&nbsp;")
    .replace(/ ([^ ]+) \1 /g, " $1 " + SENTENCE_BREAK + " $1 ") /* Same word twice in a row */
    .replace(/([.…!?"“”]) ([A-ZÁÍÓÚÞÑÖÐÉÜÇ])/g, "$1 " + SENTENCE_BREAK + " $2")
    .replace(/SENTENCE_BREAK PARAGRAPH_BREAK/g, "PARAGRAPH_BREAK")
    .split(/\s+/g)
    .filter(Boolean)
    .map(i => i.replace(/&nbsp;/g, "\u00A0"));
  return words;
}
