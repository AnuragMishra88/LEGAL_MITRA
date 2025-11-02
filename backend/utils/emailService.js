// utils/emailService.js
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  port:2525,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email templates
const emailTemplates = {
  verificationApproved: (data) => ({
    from: `"LegalMitra Team" <${process.env.EMAIL_USER}>`,
    to: data.email,
    subject: '🎉 LegalMitra - Verification Approved! Join Our Team',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .footer { background: #eee; padding: 10px; text-align: center; font-size: 12px; }
          .deadline-box { background: #fff4e6; border-left: 4px solid #ffa500; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LegalMitra</h1>
            <p>Your Trusted Legal Partner</p>
          </div>
          <div class="content">
            <h2>Congratulations, ${data.name}! 🎉</h2>
            <p>We're excited to inform you that your verification has been <strong>approved</strong> by our LegalMitra admin team!</p>
            
            <div class="deadline-box">
              <strong>💰 Complete Your Team Registration</strong>
              <p>To officially join our team and unlock all premium features, please complete the one-time joining fee of <strong>₹2499</strong>.</p>
              <p><strong>⏰ Deadline:</strong> ${new Date(data.deadline).toLocaleDateString()} (7 days from approval)</p>
            </div>

            <h3>🚀 Features You'll Get:</h3>
            <ul>
              <li>✅ Listed in "Our Lawyers" section</li>
              <li>✅ Premium profile visibility</li>
              <li>✅ Client case management tools</li>
              <li>✅ Professional networking opportunities</li>
              <li>✅ LegalMitra verified badge</li>
            </ul>

            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Login to your LegalMitra account</li>
              <li>Go to "My Collection" page</li>
              <li>Click "Complete Payment - ₹2499"</li>
              <li>Complete the secure payment process</li>
            </ol>

            <p>If you miss the deadline, you'll need to re-apply for verification.</p>

            <p>Welcome to the LegalMitra family! We're excited to have you on board.</p>

            <p>Best regards,<br>LegalMitra Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2024 LegalMitra. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  verificationRejected: (data) => ({
    from: `"LegalMitra Team" <${process.env.EMAIL_USER}>`,
    to: data.email,
    subject: 'LegalMitra - Verification Status Update',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .footer { background: #eee; padding: 10px; text-align: center; font-size: 12px; }
          .reason-box { background: #fff4f4; border-left: 4px solid #ff4444; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LegalMitra</h1>
            <p>Your Trusted Legal Partner</p>
          </div>
          <div class="content">
            <h2>Dear ${data.name},</h2>
            <p>We regret to inform you that your verification request has been <strong>rejected</strong>.</p>
            
            <div class="reason-box">
              <strong>Reason for Rejection:</strong>
              <p>${data.reason}</p>
            </div>

            <p><strong>Important:</strong> Your profile has <strong>NOT been deleted</strong>. You still have access to your personal dashboard and can re-apply after addressing the issues mentioned above.</p>

            <h3>🔄 How to Re-apply:</h3>
            <ol>
              <li>Review the rejection reason above</li>
              <li>Update your profile information</li>
              <li>Ensure all documents are clear and valid</li>
              <li>Submit a new verification request</li>
            </ol>

            <p>If you believe this is a mistake or need clarification, please contact our support team.</p>

            <p>Best regards,<br>LegalMitra Verification Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2024 LegalMitra. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  customBulkEmail: (data) => ({
    from: `"LegalMitra Team" <${process.env.EMAIL_USER}>`,
    to: data.email,
    subject: data.subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .footer { background: #eee; padding: 10px; text-align: center; font-size: 12px; }
          .message-box { background: white; padding: 20px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LegalMitra</h1>
            <p>Your Trusted Legal Partner</p>
          </div>
          <div class="content">
            <h2>${data.subject}</h2>
            <p>Dear ${data.name},</p>
            
            <div class="message-box">
              ${data.message.replace(/\n/g, '<br>')}
            </div>

            <p>Thank you for being part of the LegalMitra community.</p>
            
            <p>Best regards,<br>LegalMitra Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2024 LegalMitra. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
const sendEmail = async (to, templateName, data) => {
  try {
    console.log('🔄 Starting email send process:', { 
      to, 
      templateName, 
      data: { ...data, message: data.message ? `${data.message.substring(0, 50)}...` : 'No message' }
    });

    // Check email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Email credentials not configured');
      return { 
        success: false, 
        error: 'Email service not configured. Please check EMAIL_USER and EMAIL_PASS environment variables.' 
      };
    }

    // Validate template exists
    const template = emailTemplates[templateName];
    if (!template) {
      console.error(`❌ Email template '${templateName}' not found`);
      return { 
        success: false, 
        error: `Email template '${templateName}' not found. Available templates: ${Object.keys(emailTemplates).join(', ')}` 
      };
    }

    // Validate required data
    if (!to) {
      return { success: false, error: 'Recipient email (to) is required' };
    }

    // Generate mail options
    const mailOptions = template(data);
    mailOptions.to = to; // Ensure recipient is set

    console.log('📤 Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      template: templateName
    });

    // Test transporter connection
    try {
      await transporter.verify();
      console.log('✅ Email transporter verified successfully');
    } catch (verifyError) {
      console.error('❌ Email transporter verification failed:', verifyError);
      return { 
        success: false, 
        error: `Email service connection failed: ${verifyError.message}` 
      };
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${to}, Message ID:`, info.messageId);
    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response 
    };

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { 
      success: false, 
      error: error.message,
      stack: error.stack 
    };
  }
};

module.exports = {
  sendEmail,
  emailTemplates
};