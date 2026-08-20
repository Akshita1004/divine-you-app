import express from 'express';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Resend once
const resend = new Resend(process.env.RESEND_API_KEY);

// Receiver email (jahan inquiries recieve karni hain)
const TARGET_EMAIL = process.env.CONTACT_RECEIVER_EMAIL || 'divine05you26@gmail.com';

router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message field is required.' });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY missing in backend .env file');
      return res.status(500).json({ 
        success: false, 
        message: 'Server misconfiguration: RESEND_API_KEY is not defined in .env' 
      });
    }

    const senderName = name?.trim() || 'Logged-in Customer';
    const senderEmail = email?.trim() || 'no-reply@divineyou.net';

    const { data, error } = await resend.emails.send({
      // NOTE: Agar aapne "contact.divineyou.net" verify kiya hai toh wahi subdomain use karein
      from: 'Divine You <support@contact.divineyou.net>', 
      to: [TARGET_EMAIL],
      replyTo: senderEmail,
      subject: `New Inquiry from ${senderName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #243126; max-width: 600px; margin: auto; border: 1px solid #ded8ca; border-radius: 8px;">
          <h2 style="color: #285538; border-bottom: 2px solid #285538; padding-bottom: 8px;">New Message from Divine You Contact Page</h2>
          <p><strong>User Name:</strong> ${senderName}</p>
          <p><strong>Logged-in Email:</strong> ${senderEmail}</p>
          <hr style="border: 0; border-top: 1px solid #ded8ca; margin: 15px 0;" />
          <p><strong>Message:</strong></p>
          <p style="background: #f7f3eb; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${message}</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.json({ success: true, message: 'Message sent successfully!', data });
  } catch (err) {
    console.error('Contact Submission Error:', err);
    return res.status(500).json({ success: false, message: 'Server error sending email.' });
  }
});

export default router;