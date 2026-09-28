const readCookie = (header, name) => {
    if (!header || !name) return null;

    const prefix = name + "=";
    const entry = header
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(prefix));

    if (!entry) return null;

    try {
        return decodeURIComponent(entry.slice(prefix.length));
    } catch {
        return null;
    }
};

module.exports = { readCookie };
