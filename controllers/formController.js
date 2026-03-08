const Submission = require("../models/Submission");
const sendEmail = require("../utils/sendEmail");
const mongoose = require("mongoose");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const stripControlChars = (value) =>
  String(value ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

const normalizeSingleLineText = (value) =>
  stripControlChars(value).replace(/\s+/g, " ").trim();

const normalizeMessage = (value) =>
  stripControlChars(value).replace(/\r\n/g, "\n").trim();

const validatePayload = ({ name, email, subject, message }) => {
  if (name.length < 2 || name.length > 80) {
    return "Please provide a valid name (2-80 characters).";
  }

  if (email.length > 120 || !EMAIL_PATTERN.test(email)) {
    return "Please provide a valid email address.";
  }

  if (subject.length < 3 || subject.length > 120) {
    return "Please provide a valid subject (3-120 characters).";
  }

  if (message.length < 20 || message.length > 1500) {
    return "Please provide a valid message (20-1500 characters).";
  }

  return "";
};

exports.createSubmission = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const normalizedData = {
      name: normalizeSingleLineText(name),
      email: normalizeSingleLineText(email).toLowerCase(),
      subject: normalizeSingleLineText(subject),
      message: normalizeMessage(message),
    };

    const validationError = validatePayload(normalizedData);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const canPersistSubmission = mongoose.connection.readyState === 1;
    const saveSubmissionPromise = canPersistSubmission
      ? Submission.create(normalizedData)
      : Promise.resolve(null);
    const sendEmailPromise = sendEmail({
      subject: `New Contact: ${normalizedData.subject}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${escapeHtml(normalizedData.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(normalizedData.email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(normalizedData.subject)}</p>
        <p>${escapeHtml(normalizedData.message).replace(/\n/g, "<br>")}</p>
      `,
    });

    const [emailResult, saveResult] = await Promise.allSettled([sendEmailPromise, saveSubmissionPromise]);

    if (emailResult.status === "rejected") {
      console.error("Email failed:", emailResult.reason);
      return res.status(502).json({
        error: "Unable to send message right now. Please try again shortly.",
      });
    }

    if (saveResult.status === "rejected") {
      console.error("Submission save failed:", saveResult.reason);
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      stored: saveResult.status === "fulfilled",
    });

  } catch (error) {
    console.error("Form error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
