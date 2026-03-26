const { Resend } = require('resend');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

const resend = new Resend(process.env.RESEND_API_KEY);

function parseMultipart(event) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true, maxFileSize: 20 * 1024 * 1024 });

    // Formidable expects a Node-like request object
    const headers = event.headers || {};
    const req = {
      headers: {
        'content-type': headers['content-type'] || headers['Content-Type'],
        'content-length': headers['content-length'] || headers['Content-Length'],
      },
    };

    // If the body is base64-encoded (Netlify default for binary), decode it
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body);

    const { Readable } = require('stream');
    const readable = new Readable();
    readable._read = () => {};
    readable.push(body);
    readable.push(null);
    readable.headers = req.headers;

    form.parse(readable, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { fields, files } = await parseMultipart(event);

    // Normalize fields — formidable v3 returns arrays
    const f = {};
    for (const [key, val] of Object.entries(fields)) {
      f[key] = Array.isArray(val) ? val[0] : val;
    }

    const clientName = f.clientName || 'Unknown';
    const checkinDate = f.checkinDate || 'Not provided';

    // Build email body
    const rows = [
      ['Client Name', clientName],
      ['Check-In Date', checkinDate],
      ['Dry Weight', `${f.dryWeight || '—'} lbs`],
      ['Nutrition Deviation', f.nutritionDeviation || '—'],
      ['Deviation Details', f.deviationDetails || 'N/A'],
      ['Evening Protein Days', `${f.proteinDays || '—'}/7`],
      ['Hunger Level', f.hungerLevel || '—'],
      ['Water Intake', f.waterIntake || '—'],
      ['Total Steps', f.totalSteps || '—'],
      ['Mama Burner', f.mamaBurner || '—'],
      ['Proud Of', f.proudOf || '—'],
      ['Excited For', f.excitedFor || '—'],
      ['Other Notes', f.otherNotes || 'None'],
    ];

    const tableRows = rows
      .map(([label, value]) =>
        `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(value)}</td></tr>`
      )
      .join('');

    // Process photo attachments
    const attachments = [];
    const photoFiles = files.photos
      ? (Array.isArray(files.photos) ? files.photos : [files.photos])
      : [];

    for (const photo of photoFiles) {
      const content = fs.readFileSync(photo.filepath);
      attachments.push({
        filename: photo.originalFilename || 'photo.jpg',
        content,
      });
    }

    await resend.emails.send({
      from: 'Built By Nicole Marie <onboarding@resend.dev>',
      to: 'ms.s@championtkd.ca',
      subject: `Weekly Check-In — ${clientName} (${checkinDate})`,
      html: `
        <h2>Weekly Check-In: ${escapeHtml(clientName)}</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px;">
          ${tableRows}
        </table>
        ${attachments.length > 0 ? `<p style="margin-top:16px;color:#666;">${attachments.length} photo(s) attached.</p>` : ''}
      `,
      attachments,
    });

    // Clean up temp files
    for (const photo of photoFiles) {
      try { fs.unlinkSync(photo.filepath); } catch (_) {}
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Check-in form error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send check-in' }),
    };
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
