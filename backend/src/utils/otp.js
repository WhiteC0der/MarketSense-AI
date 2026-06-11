function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function getOtpHtml(otp){
    return `
    <html>
  <body>
    <h1>One-Time Password (OTP)</h1>
    <p>Use this code to verify your account:</p>
    <h2>${otp}</h2>
    <p>This code expires in 5 minutes.</p>
    <p>If you didn't request this, you can ignore this email.</p>
  </body>
</html>

    `  
}

export { generateOtp, getOtpHtml };