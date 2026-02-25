export const validateSettings = (settings: any): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Email validation
    if (settings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
        errors.email = 'Email inválido';
    }

    // Phone validation (allows +, digits, spaces, dashes, parentheses)
    if (settings.phone && !/^\+?[\d\s\-()]+$/.test(settings.phone)) {
        errors.phone = 'Teléfono inválido';
    }

    // Hospital name validation
    if (settings.hospitalName && settings.hospitalName.trim().length < 3) {
        errors.hospitalName = 'El nombre debe tener al menos 3 caracteres';
    }

    // Billing validation
    if (settings.billing) {
        const { taxRate, invoicePrefix } = settings.billing;

        if (taxRate !== undefined && (taxRate < 0 || taxRate > 100)) {
            errors.taxRate = 'El impuesto debe estar entre 0% y 100%';
        }

        if (invoicePrefix && invoicePrefix.length > 10) {
            errors.invoicePrefix = 'El prefijo no puede exceder 10 caracteres';
        }
    }

    // Opening hours validation
    if (settings.openingHours) {
        Object.keys(settings.openingHours).forEach(day => {
            const hours = settings.openingHours[day];
            if (hours?.enabled && hours.open && hours.close) {
                if (hours.open >= hours.close) {
                    errors[`hours_${day}`] = `Horario de cierre debe ser después de apertura`;
                }
            }
        });
    }

    return errors;
};

export const validateLogoFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
        return 'Solo se permiten archivos de imagen';
    }

    // Check file size (max 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
        return 'La imagen no puede superar 5MB';
    }

    // Check file extension
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !validExtensions.includes(extension)) {
        return 'Formato de imagen no válido';
    }

    return null;
};
