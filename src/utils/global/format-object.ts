/**
 * Formats an object's properties into strings in the format 'value string'
 * @param obj The object to format
 * @returns An array of formatted strings
 */
export const formatObjectToStrings = (obj: Record<string, any>): string[] => {
    return Object.entries(obj).map(([key, value]) => {
        // Convert the value to string, handling different types
        const stringValue = typeof value === 'object'
            ? JSON.stringify(value)
            : String(value);

        return `${stringValue} ${key.toUpperCase()}`;
    });
};

/**
 * Formats an object's properties into a single string with line breaks
 * @param obj The object to format
 * @returns A formatted string with each property on a new line
 */
export const formatObjectToOneString = (obj: Record<string, any>): string => {
    return formatObjectToStrings(obj).join('\n');
}; 