// Email sablon-generáló modul
// src\backend\auth\utils\emailTemplates.ts
interface VerificationEmailData {
  name: string;
  verificationLink: string;
}

/**
 * Regisztrációs/megerősítő email sablon generálása
 * - Reszponzív, inline CSS, egyértelmű CTA
 * - Dinamikus tartalom: név, verifikációs link
 * - Plain text alternatíva
 */
export function generateVerificationEmail(data: VerificationEmailData): { html: string; text: string } {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; background: #f9f9f9; padding: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <tr>
          <td style="padding: 32px 24px 16px 24px; text-align: center;">
            <h2 style="margin: 0 0 16px 0; color: #007bff; font-size: 1.5rem;">Welcome, ${data.name}!</h2>
            <p style="margin: 0 0 24px 0; color: #333; font-size: 1rem;">Thank you for registering. To activate your account, please click the button below:</p>
            <a href="${data.verificationLink}"
              style="display: inline-block; padding: 12px 32px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 1rem; margin-bottom: 16px;">
              Activate Account
            </a>
            <p style="margin: 24px 0 0 0; color: #888; font-size: 0.95rem;">If you did not register, please ignore this email.</p>
            <p style="margin: 32px 0 0 0; color: #555; font-size: 0.95rem;">Best regards,<br>News Reader Team</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = `
Welcome, ${data.name}!

Thank you for registering. To activate your account, please open the following link in your browser:
${data.verificationLink}

If you did not register, please ignore this email.

Best regards,
News Reader Team
`;

  return { html, text };
}
