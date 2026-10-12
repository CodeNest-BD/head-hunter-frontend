/**
 * Saves a blob the API returned as a file. The export endpoints need the
 * admin's bearer token, so a plain `<a href>` to them would arrive
 * unauthenticated; the blob is fetched through the API client instead and
 * handed to the browser from memory.
 */
export function downloadFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
