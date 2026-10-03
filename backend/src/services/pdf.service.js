const escapePdfText = (value) => String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const wrapLine = (text, width = 92) => {
    const words = String(text ?? "").replace(/\s+/g, " ").trim().split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (candidate.length > width && line) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
};

const createTextPdf = (title, inputLines) => {
    const lines = [title, "", ...inputLines.flatMap((line) => wrapLine(line))];
    const pages = [];
    for (let index = 0; index < lines.length; index += 46) pages.push(lines.slice(index, index + 46));

    const pageObjectIds = pages.map((_, index) => 4 + index * 2);
    const objects = [];
    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
    objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    pages.forEach((pageLines, index) => {
        const pageId = pageObjectIds[index];
        const contentId = pageId + 1;
        const commands = ["BT", "/F1 10 Tf", "48 790 Td", "13 TL"];
        pageLines.forEach((line, lineIndex) => {
            if (lineIndex > 0) commands.push("T*");
            commands.push(`(${escapePdfText(line)}) Tj`);
        });
        commands.push("ET");
        const stream = commands.join("\n");
        objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
        objects[contentId] = `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream`;
    });

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    for (let id = 1; id < objects.length; id += 1) {
        offsets[id] = Buffer.byteLength(pdf, "ascii");
        pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }
    const xrefOffset = Buffer.byteLength(pdf, "ascii");
    pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let id = 1; id < objects.length; id += 1) {
        pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    return Buffer.from(pdf, "ascii");
};

module.exports = { createTextPdf, escapePdfText, wrapLine };
