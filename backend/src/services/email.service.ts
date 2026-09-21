import nodemailer from 'nodemailer'

export class EmailService {
    async sendPasswordResetEmail(email: string, resetLink: string) {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            throw new Error("Email credentials are not configured.")
        }

        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        })

        await transporter.sendMail({
            from: `"Printing House" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Password reset",
            text: `Open this link to set a new password: ${resetLink}. The link is valid for 5 minutes.`,
            html: `
                <p>Open the following link to set a new password:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
                <p>The link is valid for 5 minutes.</p>
            `
        })
    }
}