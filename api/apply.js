const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { name, email, phone, age, goals, tried, commitment, anything_else } = data;

    if (!name || !email || !goals || !commitment) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    await resend.emails.send({
      from: 'Built By Nicole Marie <onboarding@resend.dev>',
      to: 'ms.s@championtkd.ca',
      subject: `New Client Application — ${name}`,
      html: `
        <h2>New Client Application</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px;">
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(email)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(phone || 'Not provided')}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Age</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(age || 'Not provided')}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Goals</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(goals)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Tried Before</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(tried || 'Not provided')}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Commitment</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(commitment)}/10</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Anything Else</td><td style="padding:8px;">${escapeHtml(anything_else || 'Nothing')}</td></tr>
        </table>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Application form error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send email' }),
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
