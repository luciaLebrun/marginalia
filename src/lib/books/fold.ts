/** Strip case, accents and punctuation, so "Piranèse" and "piranese" meet. */
export function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "")
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim();
}
