const nodemailer = require("nodemailer");

let transporter;

const isMailConfigured = () =>
    Boolean(
        process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        (process.env.SMTP_SERVICE || process.env.SMTP_HOST)
    );

const getTransporter = () => {
    if (transporter) return transporter;
    if (!isMailConfigured()) {
        throw new Error("Contact email is not configured");
    }

    const transportOptions = process.env.SMTP_SERVICE
        ? {
            service: process.env.SMTP_SERVICE,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        }
        : {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure:
                process.env.SMTP_SECURE === "true" ||
                Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        };

    transporter = nodemailer.createTransport(transportOptions);
    return transporter;
};

const escapeHtml = (value) =>
    String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

const sendContactEmail = async (contact) => {
    const subject = contact.subject || "Website contact enquiry";
    const destination = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;
    const sender = process.env.MAIL_FROM || process.env.SMTP_USER;
    const name = escapeHtml(contact.name);
    const email = escapeHtml(contact.email);
    const phone = escapeHtml(contact.phone || "Not provided");
    const safeSubject = escapeHtml(subject);
    const message = escapeHtml(contact.message);
    const receivedAt = new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
    }).format(new Date(contact.createdAt || Date.now()));
    const replyUrl =
        "mailto:" +
        contact.email +
        "?subject=" +
        encodeURIComponent("Re: " + subject);

    return getTransporter().sendMail({
        from: sender,
        to: destination,
        replyTo: contact.email,
        subject: "[MarineAegis Contact] " + subject,
        text: [
            "New website contact enquiry",
            "",
            "Name: " + contact.name,
            "Email: " + contact.email,
            "Phone: " + (contact.phone || "Not provided"),
            "Subject: " + subject,
            "",
            "Message:",
            contact.message,
        ].join("\n"),
        html: [
            "<!doctype html>",
            "<html lang=\"en\">",
            "<head>",
            "<meta charset=\"utf-8\">",
            "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
            "<title>New MarineAegis enquiry</title>",
            "</head>",
            "<body style=\"margin:0;padding:0;background:#020617;color:#e2e8f0;font-family:Arial,Helvetica,sans-serif;\">",
            "<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;\">",
            "New contact enquiry from " + name + " regarding " + safeSubject,
            "</div>",
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"width:100%;background:#020617;\">",
            "<tr><td align=\"center\" style=\"padding:32px 14px;\">",
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"width:100%;max-width:680px;background:#061526;border:1px solid #164e63;border-radius:18px;overflow:hidden;\">",

            "<tr><td style=\"padding:0;background:linear-gradient(135deg,#071d33 0%,#082f49 58%,#0e7490 100%);\">",
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\">",
            "<tr>",
            "<td style=\"padding:28px 32px;vertical-align:middle;\">",
            "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tr>",
            "<td style=\"width:48px;height:48px;text-align:center;vertical-align:middle;border:1px solid #22d3ee;border-radius:12px;background:#083344;color:#67e8f9;font-size:16px;font-weight:800;letter-spacing:1px;\">MA</td>",
            "<td style=\"padding-left:14px;\">",
            "<div style=\"color:#ffffff;font-size:22px;line-height:28px;font-weight:800;letter-spacing:.2px;\">MarineAegis</div>",
            "<div style=\"margin-top:3px;color:#7dd3fc;font-size:11px;line-height:16px;letter-spacing:1.4px;text-transform:uppercase;\">Maritime Cyber Defense</div>",
            "</td>",
            "</tr></table>",
            "</td>",
            "<td align=\"right\" style=\"padding:28px 32px;vertical-align:middle;\">",
            "<span style=\"display:inline-block;padding:7px 11px;border:1px solid #34d399;border-radius:999px;background:#052e2b;color:#6ee7b7;font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;\">New enquiry</span>",
            "</td>",
            "</tr>",
            "</table>",
            "</td></tr>",

            "<tr><td style=\"height:3px;background:#22d3ee;font-size:0;line-height:0;\">&nbsp;</td></tr>",
            "<tr><td style=\"padding:34px 32px 10px;\">",
            "<div style=\"color:#38bdf8;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;\">Website contact form</div>",
            "<h1 style=\"margin:9px 0 8px;color:#f8fafc;font-size:27px;line-height:35px;font-weight:800;\">You received a new message</h1>",
            "<p style=\"margin:0;color:#94a3b8;font-size:13px;line-height:21px;\">A visitor submitted an enquiry through the MarineAegis website. Their complete details are below.</p>",
            "</td></tr>",

            "<tr><td style=\"padding:20px 32px 0;\">",
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"width:100%;background:#081b2e;border:1px solid #164e63;border-radius:12px;\">",
            "<tr>",
            "<td width=\"50%\" style=\"padding:18px 20px;border-bottom:1px solid #123047;\">",
            "<div style=\"color:#64748b;font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;\">Contact name</div>",
            "<div style=\"margin-top:6px;color:#f1f5f9;font-size:15px;line-height:22px;font-weight:700;\">" + name + "</div>",
            "</td>",
            "<td width=\"50%\" style=\"padding:18px 20px;border-bottom:1px solid #123047;border-left:1px solid #123047;\">",
            "<div style=\"color:#64748b;font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;\">Received</div>",
            "<div style=\"margin-top:6px;color:#f1f5f9;font-size:14px;line-height:22px;\">" + escapeHtml(receivedAt) + " IST</div>",
            "</td>",
            "</tr>",
            "<tr>",
            "<td width=\"50%\" style=\"padding:18px 20px;\">",
            "<div style=\"color:#64748b;font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;\">Email address</div>",
            "<a href=\"mailto:" + email + "\" style=\"display:block;margin-top:6px;color:#22d3ee;font-size:14px;line-height:22px;text-decoration:none;word-break:break-word;\">" + email + "</a>",
            "</td>",
            "<td width=\"50%\" style=\"padding:18px 20px;border-left:1px solid #123047;\">",
            "<div style=\"color:#64748b;font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;\">Phone number</div>",
            "<div style=\"margin-top:6px;color:#f1f5f9;font-size:14px;line-height:22px;\">" + phone + "</div>",
            "</td>",
            "</tr>",
            "</table>",
            "</td></tr>",

            "<tr><td style=\"padding:22px 32px 0;\">",
            "<div style=\"color:#64748b;font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;\">Subject</div>",
            "<div style=\"margin-top:7px;padding:14px 16px;background:#0b2238;border-left:3px solid #22d3ee;border-radius:0 8px 8px 0;color:#e0f2fe;font-size:15px;line-height:23px;font-weight:700;\">" + safeSubject + "</div>",
            "</td></tr>",

            "<tr><td style=\"padding:22px 32px 0;\">",
            "<div style=\"color:#64748b;font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;\">Message</div>",
            "<div style=\"margin-top:7px;padding:20px;background:#03101e;border:1px solid #123047;border-radius:10px;color:#cbd5e1;font-size:14px;line-height:23px;white-space:pre-wrap;word-break:break-word;\">" + message + "</div>",
            "</td></tr>",

            "<tr><td align=\"center\" style=\"padding:28px 32px 34px;\">",
            "<a href=\"" + escapeHtml(replyUrl) + "\" style=\"display:inline-block;padding:13px 24px;background:#06b6d4;border:1px solid #22d3ee;border-radius:999px;color:#00131f;font-size:13px;font-weight:800;text-decoration:none;\">Reply to " + name + "</a>",
            "<p style=\"margin:14px 0 0;color:#64748b;font-size:10px;line-height:16px;\">This button opens a reply addressed directly to the visitor.</p>",
            "</td></tr>",

            "<tr><td style=\"padding:18px 32px;background:#030d18;border-top:1px solid #123047;text-align:center;\">",
            "<p style=\"margin:0;color:#64748b;font-size:10px;line-height:17px;\">Automatically sent by the MarineAegis website contact system.</p>",
            "<p style=\"margin:3px 0 0;color:#334155;font-size:9px;line-height:15px;\">Protecting ships and fleets through unified maritime intelligence.</p>",
            "</td></tr>",
            "</table>",
            "</td></tr>",
            "</table>",
            "</body>",
            "</html>",
        ].join(""),
    });
};

module.exports = { isMailConfigured, sendContactEmail };
