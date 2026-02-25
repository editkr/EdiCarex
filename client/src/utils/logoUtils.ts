
/**
 * Converts an image URL to a Base64 string.
 * Useful for embedding images in jsPDF.
 * @param url The URL of the image.
 * @returns A Promise that resolves to the Base64 string.
 */
export const getLogoBase64 = async (url: string | undefined): Promise<string> => {
    if (!url) return '';
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error converting logo to base64:', error);
        return '';
    }
};
