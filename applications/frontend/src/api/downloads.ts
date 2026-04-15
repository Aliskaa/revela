import { apiClient } from './client';

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function filenameFromContentDisposition(header: string | undefined): string | null {
    if (!header) return null;
    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
    if (utf8?.[1]) return decodeURIComponent(utf8[1]);
    const ascii = /filename="([^"]+)"/i.exec(header);
    if (ascii?.[1]) return ascii[1];
    const loose = /filename=([^;\s]+)/i.exec(header);
    if (loose?.[1]) return loose[1].replace(/"/g, '');
    return null;
}

/**
 * Télécharge un CSV (ou blob) depuis une route admin avec le JWT Axios.
 */
export async function downloadAdminBlob(
    path: string,
    params?: Record<string, string | number | undefined>,
    fallbackFilename = 'export.csv'
): Promise<void> {
    const clean: Record<string, string> = {};
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined && v !== '') clean[k] = String(v);
        }
    }
    const res = await apiClient.get(path, { params: clean, responseType: 'blob' });
    const cd = res.headers['content-disposition'] as string | undefined;
    const filename = filenameFromContentDisposition(cd) ?? fallbackFilename;
    downloadBlob(res.data as Blob, filename);
}
