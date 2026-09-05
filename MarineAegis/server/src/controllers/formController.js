import Contact from "../models/Contact.js";
import NewsletterSubscriber from "../models/NewsletterSubscriber.js";
import ServiceRequest from "../models/ServiceRequest.js";

export async function submitContact(req, res, next) {
  try {
    await Contact.create(req.body);
    res.status(201).json({ success: true, message: "Thanks! Your message has been received." });
  } catch (error) {
    next(error);
  }
}

export async function subscribe(req, res, next) {
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

export async function requestService(req, res, next) {
  try {
    await ServiceRequest.create(req.body);
    res.status(201).json({ success: true, message: "Your service request has been received." });
  } catch (error) {
    next(error);
  }
}
