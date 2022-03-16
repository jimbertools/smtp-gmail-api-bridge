import * as nodemailer from "nodemailer";

console.log('Creating Transport');

//smtp transport configuration
const smtpTransport = nodemailer.createTransport({
    host: "localhost",
    port: 1025,
    auth: {
        user: "wannesmatthys",
        pass: "wannes"
    }
});

//Message
const message = {
    from: "wannesmatthys@gmail.com",
    to: "wannes233@gmail.com",
    text: "test .",
    subject: "test"
};

console.log('Sending Mail');
// Send mail
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
smtpTransport.sendMail(message, function(error, info) {
    if (error) {
        console.log(error);
    } else {
        console.log('Message sent successfully!');
        console.log('Server responded with "%s"', info.response);
    }
    console.log('Closing Transport');
    smtpTransport.close();
});
