require('dotenv').config();

const nodemailer = require("nodemailer");

const ProfileModel = require('../models/profileModel');

// export const sendEmailOtp = async (email, otp) => {
//     try {
//         const info = await transporter.sendMail({
//             from: 'jotref@mailo.com', // sender address
//             to: "hello@parikshithv.in", // list of receivers
//             subject: "Jotref", // Subject line
//             text: "Hello world?", // plain text body
//             // html: "<b>Hello world?</b>", // html body
//           });

//           console.log("Message sent: %s", info.messageId);
//           return info.messageId;
//     }
//     catch (error) {
//         console.log(error);
//         return false;
//     }
// }

const emailHtml = (otp) => {
    return (
        `<div style="background-color: #f5f5f5; padding: 20px;">
            <div style="background-color: #fff; padding: 20px; border-radius: 10px;">
                <h1 style="text-align: center;">Jotref</h1>
                <p style="text-align: center;">Login OTP</p>
                <h4 style="text-align: center; margin-top: 15px;">${otp}</h4>
            </div>
        </div>`
    )
}

const sendEmailOtp = async (email) => {

    const randomFourDigit = Math.floor(1000 + Math.random() * 9000)

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_END_POINT,
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_ALIAS,
            pass: process.env.MAILO_PASS
        }
    });

    const otpAttemptsFrmDb = async (email) => {
        try {
            const emailStat = await ProfileModel.findOne(
                { email: email },
                { otpAttempts: 1 }
            );

            return emailStat?.otpAttempts;
        }
        catch (error) {
            console.log('otpAttemptsFrmDb', error);
            return false;
        }
    }

    const saveEmailToDb = async (email, otp, otpAttemptsNo) => {
        const remainingOtpAttempts = (otpAttemptsNo || 3) - 1;
        try {
            const emailStat = await ProfileModel.findOneAndUpdate(
                { email: email }, { otp: otp, otpAttempts: remainingOtpAttempts }, { new: true }
            );

            if (!emailStat) {
                const newEmail = new ProfileModel({
                    email: email,
                    otp: otp,
                    verified: false
                })
                await newEmail.save();
            }
            return true;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }


    try {
        const otpAttemptsNo = await otpAttemptsFrmDb(email);

        if (otpAttemptsNo < 1) {
            console.log("OTP limit reached");
            return 'limit';
        };

        const saveEmailStat = await saveEmailToDb(email, randomFourDigit, otpAttemptsNo);
        if (!saveEmailStat) return false;

        if (process.env.EMAIL_OTP_SEND === "0") {
            console.log(email, randomFourDigit);
            return true;
        }

        const info = await transporter.sendMail({
            from: '"jotref" <jotref@parikshithv.in>',
            to: email, // list of receivers
            subject: "Jotref login", // Subject line
            text: `Jotref login OTP: ${randomFourDigit}`, // plain text body
            html: emailHtml(randomFourDigit),
        });

        console.log("Message sent: %s", info.messageId);
        return info.messageId;
    }
    catch (error) {
        console.log(error);
        return false;
    }
}

module.exports = { sendEmailOtp };  
