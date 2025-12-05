import crypto from 'crypto';

export const hashSha256 = (value: string): string => {
    return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
};