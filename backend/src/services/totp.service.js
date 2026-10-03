const crypto = require("node:crypto");

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const encodeBase32 = (buffer) => {
    let bits = "";
    for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
    let result = "";
    for (let index = 0; index < bits.length; index += 5) result += alphabet[parseInt(bits.slice(index, index + 5).padEnd(5, "0"), 2)];
    return result;
};
const decodeBase32 = (value) => {
    let bits = "";
    for (const character of String(value || "").replace(/=+$/g, "").toUpperCase()) {
        const index = alphabet.indexOf(character);
        if (index < 0) throw new Error("Invalid authenticator secret");
        bits += index.toString(2).padStart(5, "0");
    }
    const bytes = [];
    for (let index = 0; index + 8 <= bits.length; index += 8) bytes.push(parseInt(bits.slice(index, index + 8), 2));
    return Buffer.from(bytes);
};
const generateSecret = () => encodeBase32(crypto.randomBytes(20));
const generateTotp = (secret, timestamp = Date.now(), period = 30) => {
    const counter = Math.floor(timestamp / 1000 / period);
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter));
    const digest = crypto.createHmac("sha1", decodeBase32(secret)).update(buffer).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;
    return String(value).padStart(6, "0");
};
const verifyTotp = (secret, code, timestamp = Date.now()) => {
    if (!/^\d{6}$/.test(String(code || ""))) return false;
    return [-30000, 0, 30000].some((offset) => {
        const expected = Buffer.from(generateTotp(secret, timestamp + offset));
        const provided = Buffer.from(String(code));
        return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
    });
};

module.exports = { encodeBase32, decodeBase32, generateSecret, generateTotp, verifyTotp };
