// src\backend\auth\utils\emailService.ts
import nodemailer from 'nodemailer';

// Késleltetett inicializálás - a transporter csak akkor jön létre, amikor először használjuk
let transporter: nodemailer.Transporter | null = null;

function createTransporter(): nodemailer.Transporter {
  if (!transporter) {
    console.log('[EmailService] Transporter inicializálása...');
    console.log('[EmailService] SMTP_HOST:', process.env.SMTP_HOST || 'HIÁNYZIK');
    console.log('[EmailService] SMTP_PORT:', process.env.SMTP_PORT || 'HIÁNYZIK');
    console.log('[EmailService] SMTP_USER:', process.env.SMTP_USER || 'HIÁNYZIK');
    
    // Fail-safe ellenőrzés
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('[EmailService] FATAL ERROR: SMTP configuration is not complete.');
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      } else {
        // Development módban ne állítsuk le a szervert, csak logoljuk a hibát
        console.warn('[EmailService] Development módban - SMTP konfiguráció hiányos, emailek nem lesznek elküldve');
        // Dummy transporter development módban
        transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: 'unix',
          buffer: true
        });
        return transporter;
      }
    }

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // SMTP kapcsolat ellenőrzése csak valódi transporter esetén
    if (process.env.SMTP_HOST !== 'localhost') {
      transporter.verify((error, _success) => {
        if (error) {
          console.error('[EmailService] Email transporter verification failed:', error);
        } else {
          console.log('[EmailService] Email transporter is ready to send messages');
        }
      });
    }
  }
  
  return transporter;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const emailService = {
  async send(options: EmailOptions): Promise<void> {
    try {
      const transporterInstance = createTransporter();
      
      const result = await transporterInstance.sendMail({
        from: process.env.EMAIL_FROM || '"News App" <noreply@news-app.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      
      console.log(`[EmailService] Email sent successfully to ${options.to}`);
      console.log('[EmailService] Email result:', result);
    } catch (error) {
      console.error(`[EmailService] Failed to send email to ${options.to}`, error);
      // Éles rendszerben itt jöhetne egy riasztás (pl. Sentry, DataDog)
      throw error; // Továbbdobjuk a hibát, hogy a hívó fél is tudja kezelni
    }
  }
};