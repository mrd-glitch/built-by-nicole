import { Resend } from 'resend';
import formidable from 'formidable';
import fs from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const resend = new Resend(process.env.RESEND_API_KEY);
  const NICOLE_EMAIL = 'ms.s@championtkd.ca';

  try {
    const form = formidable({ multiples: true, maxFileSize: 20 * 1024 * 1024 });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    // Build attachments from uploaded photos
    const attachments = [];
    const photoFiles = files.photos ? (Array.isArray(files.photos) ? files.photos : [files.photos]) : [];

    for (const photo of photoFiles) {
      const content = fs.readFileSync(photo.filepath);
      attachments.push({
        filename: photo.originalFilename || 'photo.jpg',
        content: content.toString('base64'),
        type: photo.mimetype || 'image/jpeg',
      });
    }

    const f = (key) => Array.isArray(fields[key]) ? fields[key][0] : (fields[key] || 'Not provided');

    const htmlBody = `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F2; padding: 0;">
        
        <div style="background: #1A1108; padding: 2rem 2.5rem; border-bottom: 4px solid #E8420A;">
          <p style="font-family: Arial Black, sans-serif; font-size: 1.4rem; color: #F5EFE6; margin: 0; letter-spacing: 0.08em; text-transform: uppercase;">
            BUILT BY <span style="color: #E8420A;">NICOLE MARIE</span>
          </p>
          <p style="color: #8B7355; font-size: 0.8rem; letter-spacing: 0.15em; text-transform: uppercase; margin: 0.25rem 0 0;">Weekly Check-In</p>
        </div>

        <div style="padding: 2rem 2.5rem; background: white; border-left: 4px solid #E8420A; margin: 1.5rem;">
          <p style="font-size: 1.1rem; font-weight: 600; color: #1A1108; margin: 0 0 0.25rem;">${f('clientName')}</p>
          <p style="color: #8B7355; font-size: 0.85rem; margin: 0;">Check-in date: ${f('checkinDate')}</p>
        </div>

        <div style="padding: 0 2.5rem;">

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
            <tr style="background: #1A1108;">
              <td colspan="2" style="padding: 0.6rem 1rem; font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: #E8420A; font-weight: 700;">The Numbers</td>
            </tr>
            <tr style="background: #FAF7F2;">
              <td style="padding: 0.75rem 1rem; font-size: 0.85rem; color: #8B7355; width: 45%;">Dry Weight</td>
              <td style="padding: 0.75rem 1rem; font-size: 0.9rem; font-weight: 600; color: #1A1108;">${f('dryWeight')} lbs</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 0.75rem 1rem; font-size: 0.85rem; color: #8B7355;">Total Steps</td>
              <td style="padding: 0.75rem 1rem; font-size: 0.9rem; font-weight: 600; color: #1A1108;">${f('steps')}</td>
            </tr>
            <tr style="background: #FAF7F2;">
              <td style="padding: 0.75rem 1rem; font-size: 0.85rem; color: #8B7355;">Water Intake</td>
              <td style="padding: 0.75rem 1rem; font-size: 0.9rem; font-weight: 600; color: #1A1108;">${f('water')}</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 0.75rem 1rem; font-size: 0.85rem; color: #8B7355;">Evening Protein</td>
              <td style="padding: 0.75rem 1rem; font-size: 0.9rem; font-weight: 600; color: #1A1108;">${f('eveningProteinDays')}</td>
            </tr>
            <tr style="background: #FAF7F2;">
              <td style="padding: 0.75rem 1rem; font-size: 0.85rem; color: #8B7355;">Mama Burner</td>
              <td style="padding: 0.75rem 1rem; font-size: 0.9rem; font-weight: 600; color: #1A1108;">${f('mamaBurner')}</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 0.75rem 1rem; font-size: 0.85rem; color: #8B7355;">Hunger Level</td>
              <td style="padding: 0.75rem 1rem; font-size: 0.9rem; font-weight: 600; color: #1A1108;">${f('hunger')}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
            <tr style="background: #1A1108;">
              <td style="padding: 0.6rem 1rem; font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: #E8420A; font-weight: 700;">Nutrition Plan</td>
            </tr>
            <tr style="background: #FAF7F2;">
              <td style="padding: 1rem;">
                <p style="margin: 0 0 0.25rem; font-size: 0.85rem; color: #8B7355;">Deviations this week?</p>
                <p style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #1A1108;">${f('deviation')}</p>
                ${f('deviation') === 'Yes' ? `<p style="margin: 0.5rem 0 0; font-size: 0.9rem; color: #1A1108; font-style: italic;">${f('deviationDetails')}</p>` : ''}
              </td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
            <tr style="background: #1A1108;">
              <td style="padding: 0.6rem 1rem; font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: #E8420A; font-weight: 700;">Mindset</td>
            </tr>
            <tr style="background: #FAF7F2;">
              <td style="padding: 1rem; border-bottom: 1px solid rgba(26,17,8,0.06);">
                <p style="margin: 0 0 0.25rem; font-size: 0.8rem; color: #8B7355; text-transform: uppercase; letter-spacing: 0.1em;">Proud of this week</p>
                <p style="margin: 0; font-size: 0.95rem; color: #1A1108; line-height: 1.6;">${f('proud')}</p>
              </td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 1rem; border-bottom: 1px solid rgba(26,17,8,0.06);">
                <p style="margin: 0 0 0.25rem; font-size: 0.8rem; color: #8B7355; text-transform: uppercase; letter-spacing: 0.1em;">Excited for this week</p>
                <p style="margin: 0; font-size: 0.95rem; color: #1A1108; line-height: 1.6;">${f('excited')}</p>
              </td>
            </tr>
            ${f('notes') !== 'Not provided' ? `
            <tr style="background: #FAF7F2;">
              <td style="padding: 1rem;">
                <p style="margin: 0 0 0.25rem; font-size: 0.8rem; color: #8B7355; text-transform: uppercase; letter-spacing: 0.1em;">Other Notes</p>
                <p style="margin: 0; font-size: 0.95rem; color: #1A1108; line-height: 1.6;">${f('notes')}</p>
              </td>
            </tr>` : ''}
          </table>

          ${attachments.length > 0 ? `<p style="font-size: 0.8rem; color: #8B7355; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 1.5rem;">📎 ${attachments.length} photo${attachments.length > 1 ? 's' : ''} attached</p>` : ''}

        </div>

        <div style="background: #1A1108; padding: 1.5rem 2.5rem; margin-top: 1rem; text-align: center;">
          <p style="color: #8B7355; font-size: 0.75rem; margin: 0;">Built By Nicole Marie · Weekly Check-In System</p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'Built By Nicole Marie <onboarding@resend.dev>',
      to: NICOLE_EMAIL,
      subject: `✓ Check-In: ${f('clientName')} — ${f('checkinDate')}`,
      html: htmlBody,
      attachments,
    });

    // Clean up temp files
    for (const photo of photoFiles) {
      try { fs.unlinkSync(photo.filepath); } catch {}
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Check-in email error:', err);
    return res.status(500).json({ error: 'Failed to send' });
  }
}

export const config = { api: { bodyParser: false } };
