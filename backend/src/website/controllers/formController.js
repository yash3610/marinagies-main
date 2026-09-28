const Contact = require("../models/Contact.js");
const NewsletterSubscriber = require("../models/NewsletterSubscriber.js");
const ServiceRequest = require("../models/ServiceRequest.js");
const {
  isMailConfigured,
  sendContactEmail
} = require("../../services/mailer.js");

async function submitContact(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const message = String(req.body.message || "").trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name || name.length > 100 || !emailValid || email.length > 254 || !message || message.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Please check your name, email address and message."
      });
    }
    if (!isMailConfigured()) {
      return res.status(503).json({ success: false, message: "Contact email is temporarily unavailable." });
    }

    const contact = await Contact.create({
      name,
      email,
      phone: String(req.body.phone || "").trim().slice(0, 30),
      subject: String(req.body.subject || "").trim().slice(0, 200),
      message,
      emailStatus: "pending"
    });

    try {
      await sendContactEmail(contact);
      contact.emailStatus = "sent";
      contact.emailedAt = new Date();
      await contact.save();
    } catch (mailError) {
      contact.emailStatus = "failed";
      contact.emailError = String(mailError.message || "Mail delivery failed").slice(0, 500);
      await contact.save();
      console.error("Contact email error:", mailError.message);
      return res.status(502).json({
        success: false,
        message: "Your message was saved, but email delivery failed. Please try again later."
      });
    }

    res.status(201).json({ success: true, message: "Thanks! Your message has been sent." });
  } catch (error) {
    next(error);
  }
}

async function subscribe(req, res, next) {
  try {
    await NewsletterSubscriber.updateOne(
      { email: req.body.email.trim().toLowerCase() },
      { $setOnInsert: { email: req.body.email.trim().toLowerCase() } },
      { upsert: true }
    );
    res.status(201).json({ success: true, message: "You are subscribed to the newsletter." });
  } catch (error) {
    next(error);
  }
}

async function requestService(req, res, next) {
  try {
    await ServiceRequest.create(req.body);
    res.status(201).json({ success: true, message: "Your service request has been received." });
  } catch (error) {
    next(error);
  }
}

module.exports = { submitContact, subscribe, requestService };
