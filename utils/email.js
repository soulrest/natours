const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

// new Email(user, url).sendWelcome();

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = process.env.NODE_ENV === 'production' ? process.env.EMAIL_FROM_SENDGRID : `Andras Sop <${process.env.EMAIL_FROM}>`;
    };

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // Sendgrid
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }
            });
        };

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    };

    // Send the actual email
    async send(template, subject) {
        // 1) Render HTML based on a pug template
        // pug.renderFile() - перетворює pug template в реальний HTML (перший параметр методу)
        // pug.renderFile() - можемо передавати дані (другий параметр методу)
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });

        // 2) Define an email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html)
        };

        // 3) Create transport and send email
        await this.newTransport().sendMail(mailOptions);
    };

    // оскільки this.send() являється асинхронною функціїю, ми теж повинні виконувати на ній async/await в даній функції для отримання результату
    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours Family!');
    };

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)');
    };
};

// ------------------------------------------------------------------------------------------------
// наша стара реалізація
// const sendEmail = async options => {
//     // 1) Create a transporter 
//     const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         auth: {
//             user: process.env.EMAIL_USERNAME,
//             pass: process.env.EMAIL_PASSWORD
//         }
//     });
//     // 2) Define the email options
//     const mailOptions = {
//         from: 'Jonas Shmedtman <hello@jonas.io>',
//         to: options.email,
//         subject: options.subject,
//         text: options.message
//     };

//     // 3) Actually send the email
//     await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;