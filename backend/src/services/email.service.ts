import nodemailer from 'nodemailer'

export class EmailService {
    async sendPasswordResetEmail(email: string, resetLink: string) {
        let transporter = this.createTransporter()

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

    async sendInvoiceEmail(email: string, attachments: {filename: string, content: Buffer}[]) {
        let transporter = this.createTransporter()

        await transporter.sendMail({
            from: `"Printing House" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Printing House invoices",
            text: "Your order was successfully confirmed. Invoice PDF files are attached to this email.",
            html: `
                <p>Your order was successfully confirmed.</p>
                <p>Invoice PDF files are attached to this email.</p>
            `,
            attachments: attachments
        })
    }

    private createTransporter() {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            throw new Error("Email credentials are not configured.")
        }

        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        })
    }
}
