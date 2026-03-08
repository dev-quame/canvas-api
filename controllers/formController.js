const Submission = require("../models/Submission");
const sendEmail = require("../utils/sendEmail");
const mongoose = require("mongoose");

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

exports.createSubmission = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const normalizedData = {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      subject: String(subject).trim(),
      message: String(message).trim(),
    };

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
