const { Resend } = require("resend");

const getRecipients = () =>
  (process.env.EMAIL_TO || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing");
  }
  return new Resend(process.env.RESEND_API_KEY);
};

const sendEmail = async ({ subject, html }) => {
  try {
    const recipients = getRecipients();
    if (!recipients.length) {
      throw new Error("EMAIL_TO is missing");
    }

    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Portfolio <onboarding@resend.dev>",
      to: recipients,
      subject,
      html,
    });

    if (error) {
      console.error("Email send error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

module.exports = sendEmail;
