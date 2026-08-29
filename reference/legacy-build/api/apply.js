import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const resend = new Resend(process.env.RESEND_API_KEY);
  const NICOLE_EMAIL = 'ms.s@championtkd.ca';

  try {
    const { firstName, lastName, email, phone, goal, about, referral } = req.body;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F2; padding: 0;">
        
        <div style="background: #1A1108; padding: 2rem 2.5rem; border-bottom: 4px solid #E8420A;">
          <p style="font-family: Arial Black, sans-serif; font-size: 1.4rem; color: #F5EFE6; margin: 0; letter-spacing: 0.08em; text-transform: uppercase;">
            BUILT BY <span style="color: #E8420A;">NICOLE MARIE</span>
          </p>
          <p style="color: #8B7355; font-size: 0.8rem; letter-spacing: 0.15em; text-transform: uppercase; margin: 0.25rem 0 0;">New Coaching Application</p>
        </div>

        <div style="padding: 2rem 2.5rem; background: white; border-left: 4px solid #E8420A; margin: 1.5rem;">
          <p style="font-size: 1.2rem; font-weight: 700; color: #1A1108; margin: 0 0 0.25rem;">${firstName} ${lastName}</p>
          <p style="color: #8B7355; font-size: 0.9rem; margin: 0;">${email}${phone ? ` · ${phone}` : ''}</p>
        </div>

        <div style="padding: 0 2.5rem 2.5rem;">

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
            <tr style="background: #1A1108;">
              <td colspan="2" style="padding: 0.6rem 1rem; font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: #E8420A; font-weight: 700;">Application Details</td>
            </tr>
            <tr style="background: #FAF7F2;">
              <td style="padding: 0.75rem 1rem; font-size: 0.85rem; color: #8B7355; width: 35%;">Main Goal</td>
              <td style="padding: 0.75rem 1rem; font-size: 0.9rem; font-weight: 600; color: #1A1108;">${goal || 'Not specified'}</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 0.75rem 1rem; font-size: 0.85rem; color: #8B7355;">Heard About Nicole</td>
              <td style="padding: 0.75rem 1rem; font-size: 0.9rem; color: #1A1108;">${referral || 'Not specified'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #1A1108;">
              <td style="padding: 0.6rem 1rem; font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: #E8420A; font-weight: 700;">Their Story</td>
            </tr>
            <tr style="background: #FAF7F2;">
              <td style="padding: 1.25rem; font-size: 0.95rem; color: #1A1108; line-height: 1.7;">${about}</td>
            </tr>
          </table>

        </div>

        <div style="background: #1A1108; padding: 1.5rem 2.5rem; text-align: center;">
          <p style="color: #8B7355; font-size: 0.75rem; margin: 0;">Built By Nicole Marie · New Client Application</p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'Built By Nicole Marie <onboarding@resend.dev>',
      to: NICOLE_EMAIL,
      replyTo: email,
      subject: `🔥 New Application: ${firstName} ${lastName} — ${goal}`,
      html: htmlBody,
    });

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Apply email error:', err);
    return res.status(500).json({ error: 'Failed to send' });
  }
}
