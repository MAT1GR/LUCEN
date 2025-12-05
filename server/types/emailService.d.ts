declare module '../emailService.js' {
  export const sendEmail: (to: string, subject: string, html: string) => Promise<boolean>;
}