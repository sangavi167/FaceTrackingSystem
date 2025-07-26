import emailjs from 'emailjs-com';

// EmailJS configuration
const EMAILJS_SERVICE_ID = 'your_service_id'; // Replace with your EmailJS service ID
const EMAILJS_TEMPLATE_ID = 'your_template_id'; // Replace with your EmailJS template ID
const EMAILJS_USER_ID = 'your_user_id'; // Replace with your EmailJS user ID

export const initializeEmailJS = () => {
  emailjs.init(EMAILJS_USER_ID);
};

export const sendRealEmail = async (
  toEmail: string,
  personName: string,
  attendanceRecords: any[]
) => {
  try {
    const templateParams = {
      to_email: toEmail,
      person_name: personName,
      total_records: attendanceRecords.length,
      late_records: attendanceRecords.filter(r => r.isLate).length,
      latest_record: attendanceRecords[0] 
        ? `${attendanceRecords[0].date} at ${attendanceRecords[0].time}` 
        : 'No records',
      attendance_details: attendanceRecords
        .slice(0, 10) // Limit to 10 most recent records
        .map(record => `${record.date} at ${record.time} - ${record.isLate ? 'Late' : 'On Time'}`)
        .join('\n'),
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    return { success: true, response };
  } catch (error) {
    console.error('EmailJS error:', error);
    throw error;
  }
};

// Setup instructions for EmailJS
export const getEmailJSSetupInstructions = () => {
  return `
To set up real email notifications:

1. Go to https://www.emailjs.com/
2. Create a free account
3. Add an email service (Gmail, Outlook, etc.)
4. Create an email template with these variables:
   - {{person_name}}
   - {{total_records}}
   - {{late_records}}
   - {{latest_record}}
   - {{attendance_details}}
   - {{to_email}}
5. Get your Service ID, Template ID, and User ID
6. Replace the values in src/utils/emailService.ts
7. Call initializeEmailJS() in your app

Template example:
Subject: Attendance Report - {{person_name}}

Dear {{to_email}},

Here's the attendance report for {{person_name}}:

Total Records: {{total_records}}
Late Arrivals: {{late_records}}
Latest Record: {{latest_record}}

Recent Attendance:
{{attendance_details}}

Best regards,
Face Analysis System
`;
};