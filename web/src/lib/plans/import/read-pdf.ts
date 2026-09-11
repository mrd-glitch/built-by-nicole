import { MAX_PDF_BYTES } from "./format";
export async function readWorkoutPdf(file: File): Promise<string> {
  if (file.size > MAX_PDF_BYTES || !file.size)
    throw new Error("Choose a PDF smaller than 10 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-")
    throw new Error("Choose an actual PDF file.");
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `/vendor/pdf.worker.min.mjs?v=${pdfjs.version}`;
  const task = pdfjs.getDocument({
    data: bytes,
    useSystemFonts: false,
    disableFontFace: true,
  });
  const timeout = setTimeout(() => void task.destroy(), 30_000);
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 200)
      throw new Error(
        "Use a PDF with 200 pages or fewer. Split larger programs.",
      );
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      for (const item of content.items)
        if ("str" in item) text += item.str + (item.hasEOL ? "\n" : " ");
      text += "\n";
      page.cleanup();
      if (text.length > 900_000)
        throw new Error(
          "This PDF has too much text. Split it into smaller programs.",
        );
    }
    return text;
  } catch (e) {
    if (e instanceof Error && e.name === "PasswordException")
      throw new Error("Use an unencrypted admin-upload PDF.");
    if (e instanceof Error && /destroy/i.test(e.message))
      throw new Error("Reading the PDF timed out. Try a smaller export.");
    throw e;
  } finally {
    clearTimeout(timeout);
    await task.destroy();
  }
}
