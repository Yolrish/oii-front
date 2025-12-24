function getWebUrlDomain(url: string) {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace(/^www\./i, '');
        return domain;
    } catch (error) {
        return url;
    }
}

export { getWebUrlDomain };