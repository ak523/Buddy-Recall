export async function parseDocument(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  if (mimeType === 'text/plain' || filename.endsWith('.txt')) {
    return buffer.toString('utf-8');
  }

  if (mimeType === 'application/pdf' || filename.endsWith('.pdf')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule = await import('pdf-parse') as any;
    const pdfParse = pdfParseModule.default ?? pdfParseModule;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    filename.endsWith('.docx')
  ) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${mimeType || filename}`);
}
