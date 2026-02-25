

export const formatCurrency = (amount: number | string, config?: any) => {
    const num = Number(amount);
    if (isNaN(num)) return `${config?.billing?.currency === 'USD' ? '$' : config?.billing?.currency === 'EUR' ? '€' : 'S/.'} 0.00`;

    const currency = config?.billing?.currency || 'PEN';
    const locale = currency === 'USD' ? 'en-US' : currency === 'EUR' ? 'de-DE' : 'es-PE';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(num);
};

export const PAYMENT_METHODS = {
    CASH: 'Efectivo',
    TRANSFER_BCP: 'Transferencia BCP',
    TRANSFER_BBVA: 'Transferencia BBVA',
    TRANSFER_INTERBANK: 'Transferencia Interbank',
    TRANSFER_SCOTIA: 'Transferencia Scotiabank',
    CARD_CREDIT: 'Tarjeta de Crédito',
    CARD_DEBIT: 'Tarjeta de Débito',
    YAPE: 'Yape',
    PLIN: 'Plin',
    INSURANCE: 'Seguro Privado'
} as const;

export const COMPANY_ACCOUNTS = [
    {
        id: 'acc_bcp_soles_001',
        bank: 'BCP',
        type: 'Corriente',
        currency: 'Soles',
        number: '191-2345678-0-12',
        cci: '002-191-002345678012-54',
        alias: 'BCP Soles - Principal',
        logo: 'bcp'
    },
    {
        id: 'acc_bbva_soles_001',
        bank: 'BBVA',
        type: 'Recaudadora',
        currency: 'Soles',
        number: '0011-0123-4567890123',
        cci: '011-0123-004567890123-44',
        alias: 'BBVA Recaudo',
        logo: 'bbva'
    },
    {
        id: 'acc_inter_soles_001',
        bank: 'Interbank',
        type: 'Corriente',
        currency: 'Soles',
        number: '200-3001234567',
        cci: '003-200-003001234567-33',
        alias: 'Interbank Operativa',
        logo: 'interbank'
    },
    {
        id: 'acc_cash_box_001',
        bank: 'Caja',
        type: 'Efectivo',
        currency: 'Soles',
        number: 'CAJA-PRINCIPAL-01',
        cci: '-',
        alias: 'Caja Chica - Sede Central',
        logo: 'cash'
    }
];

export const getBankByMethod = (method: string) => {
    if (method.includes('BCP')) return 'BCP';
    if (method.includes('BBVA')) return 'BBVA';
    if (method.includes('Interbank')) return 'Interbank';
    if (method.includes('Scotiabank')) return 'Scotiabank';
    if (method === 'Efectivo') return 'Caja';
    return null;
};
