import nodemailer from 'nodemailer';

// Build a Nodemailer transport for a given Zoho sender account.
// Zoho uses implicit TLS on 465 (secure) and STARTTLS on 587.
function buildTransport(account) {
  return nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpPort === 465,
    auth: {
      user: account.username,
      pass: account.getPassword(),
    },
  });
}

// Confirm the SMTP credentials work without sending anything.
export async function verifyAccount(account) {
  const transport = buildTransport(account);
  await transport.verify();
  return true;
}

// Send one email through the given sender account.
export async function sendEmail(account, { to, subject, body, cc = [], bcc = [] }) {
  const transport = buildTransport(account);
  const info = await transport.sendMail({
    from: `"${account.senderName}" <${account.email}>`,
    to,
    cc: cc.length ? cc : undefined,
    bcc: bcc.length ? bcc : undefined,
    subject,
    text: body,
    html: body.replace(/\n/g, '<br>'),
  });
  return info.messageId;
}
