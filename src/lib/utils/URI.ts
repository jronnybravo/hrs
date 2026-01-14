export function decodeAndParseParam(param: any): any {
    if (typeof param !== 'string') {
        return param;
    }
    try {
        const decoded = decodeURIComponent(param);
        try {
            return JSON.parse(decoded);
        } catch {
            return decoded;
        }
    } catch (error) {
        return param;
    }
}

export function toUriParams(obj: Record<string, any>, prefix = ''): string {
    const params = [];

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            const fullKey = prefix ? `${prefix}[${key}]` : key;

            if (typeof value === 'object' && value !== null) {
                // Recurse for nested objects and arrays
                params.push(toUriParams(value, fullKey));
            } else {
                // Encode and push primitive values
                params.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(value)}`);
            }
        }
    }

    // Flatten the array of params and join with '&'
    return params.flat().join('&');
};