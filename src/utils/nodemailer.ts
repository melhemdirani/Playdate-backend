import nodemailer from "nodemailer";

export type EmailParams = {
  to: string;
  subject: string;
  text: string;
  otp?: string;
  html: string;
  attachments?: Attachment[];
};
export type Attachment = {
  filename: string;
  cid?: string;
  encoding?: string;
  contentType?: string;
  path?: string;
};
export type OtpParams = {
  to: string;
  name: string;
  otp: string;
};
export type ReceiptParams = {
  to: string;
  subject: string;
  text: string;
  otp?: string;
  courses?: string;
  lessonName?: string;
  nbLessons?: string;
  dates?: string;
  teacherName?: string;
  promo?: string;
  totalCost?: string;
  initialPrice?: string;
  name?: string;
};
const date = new Date();
const dateString = date.toLocaleString();
const serverTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const transporter = nodemailer.createTransport({
  service: "smtp",
  host: "smtp.titan.email",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (params: EmailParams) => {
  try {
    const footer = `
  <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; font-size: 14px; color: #666;">
    <p>Regards,</p>
    <p><strong>Play Date Team</strong></p>
    <a href="https://educify.org" style="text-decoration: none; color: #4CAF50;">Visit Play Date</a>
    <br/>
    <img src="https://educify.reboost.live/logo.png" alt="Play Date logo" width="100" />
  </div>
`;

    const mailOptions = {
      ...params,
      from: process.env.EMAIL_USER,
      html: `${params?.html || ""}${footer}`,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
  }
};
export const sendOTP = async (params: OtpParams) => {
  const link = `${process.env.FRONTEND_URL}/verify?email=${params.to}&otp=${params.otp}`;

  try {
    const mailOptions = {
      ...params,
      from: process.env.EMAIL_USER,
      subject: "OTP for PawsMob",
      html: `<html>
  <head>
    <link
      href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
 <div style="background-color: #ffaa55; margin: 0; display: flex; padding-left: 40px;align-items: center; justify-content: space-between; color: white;">
       <h1 style="font-size: 3rem; font-family: 'Comic Sans MS', cursive; max-width: 500px;">Welcome To PawsMob Community</h1>
    </div>
    <div style="margin: 50px;">
      <h2 style="margin: 50px 0;">It’s where paws lovers hangout!</h2>
      <p style="margin-bottom: 30px;">Hello ${params.name},</p>
      <p>
        You’re one step closer to be part of the PawsMob family! To activate
        your account,click on the following link: 
      </p>
       <a href="${link}">Please click here</a>
       <p style="margin-bottom: 30px;"> <strong>Otp:</strong> ${params.otp} </p>
      <p >Be careful, this OTP expires in 1 hour!</p>
      <p style="margin-bottom: 30px;"> If you did not initiate that request, no further action is required</p>
      <p>
        Glad to have you around! Hope you will enjoy your stay and be encouraged
        to invite your friends over.
      </p>
      <p style="margin-bottom: 30px;">If you did not create an account, no further action is required.</p>
      <p class="team">
        <p class="regards">Regards,</p>
        <p>PawsMob Team</p>
      </p>
      <div class="links">
        <a href="https://www.facebook.com/profile.php?id=61550786069582"   style="color: white;"    target="_blank"
      rel="noopener noreferrer">
        <img src="https://pawsmob.com/fb.png" />
        </a>
        <a href="https://www.instagram.com/pawsmob/"     style="color: white;"   target="_blank"
      rel="noopener noreferrer" >
        <img src="https://pawsmob.com/insta.png" />
        </a>
      </div>
    </div>
    <div class="img_container" style="margin: 0; display: flex; align-items: center;background-color: #ffaa55; justify-content: space-between;">
          <p></p>
          <p class="footer_disclaim" style="color: white; margin: 50px;">
            <span> This is an automated email. So, please do not reply! </span>

            <span> <a href="https://pawsmob.com/#/contact%20us">Click here</a> to contact us </span>
          </p>
    <img src="https://pawsmob.com/footerLogo.png" style="background-color: #ffaa55; object-fit: contain" width="150px" />
    
    </div>
  </body>
</html>
`,
    };
    await transporter.sendMail(mailOptions);
    return;
  } catch (error) {
    console.log(error);
  }
};

export const sendReceipt = async (params: ReceiptParams) => {
  try {
    await sendEmail({
      to: params.to,
      subject: params.subject,
      text: "",
      html: ` 
  <html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Educify Receipt</title>
    <style>
        body{
            margin: 0;
            padding: 0; 
        }
        h1,h2,h3,h4,h5,h6{
            margin: 0;
            padding: 0;
        }
        p{
            margin: 0;
            padding: 0;
        }
        .container{
            width: 90%;
            margin-right: auto;
            margin-left: auto;
        }
        .brand-section{
           padding: 10px 20px;
        }
        .logo{
            width: 50%;
        }
        .row{
            display: flex;
            flex-wrap: wrap;
        }
        .col-6{
            width: 50%;
            flex: 0 0 auto;
        }
        .text-white{
        }
        .company-details{
            float: right;
            text-align: right;
        }
        .body-section{
            padding: 16px;
            border: 1px solid gray;
        }
        .heading{
            font-size: 20px;
            margin-bottom: 08px;
        }
        .sub-heading{
            color: #262626;
            margin-bottom: 05px;
        }
        table{
            background-color: #fff;
            width: 80%;
            border-collapse: collapse;
        }
        table thead tr{
            border: 1px solid #111;
        }
        table td {
            vertical-align: middle !important;
            text-align: left;
        }
        table th, table td {
            padding: 10px;
        }
        .table-bordered{
            box-shadow: 0px 0px 5px 0.5px gray;
        }
        .table-bordered td, .table-bordered th {
            border: 1px solid #dee2e6;
        }
        .text-right{
            text-align: end;
        }
        .w-20{
            width: 20%;
        }
        .float-right{
            float: right;
        }	
        .headers{
            display: flex;
            align-items: center;
        }
        .logo{
            margin-right: 20px;
            width: 70px;
        }
</style>
</head>
<body>
    <div class="container">
        <div class="brand-section headers">
              <img src="https://educify.reboost.live/logo.png" alt="logo" width="75" class="logo">
              <h2 class="text-white">Educify Receipt</h2>
        </div>
        <div class="body-section">
            <div class="row">
                <div class="col-6">                  
                    <h3><p class="sub-heading">Full Name :  ${params.name}  </p>
 <p class="sub-heading">Date        :  <today> <span id="date"> ${dateString} ${serverTimeZone}</span></p></h3> </div>
  
 <div class="col-6">

 </div></div></div> 		
    <br>

<div class="body-section">
    <h1 class="heading"><u><i>Description</i></u></h1>
    <table>
        <thead>
            <td>
                Subject
            </td>
            <td>
                ${params.lessonName}
            </td>
        </thead>
        <thead>
            <td>
                Number of Lessons
            </td>
            <td>
                ${params.nbLessons}
            </td>
        </thead>
        <thead>
            <td>
                Teacher Name
            </td>
            <td>
                ${params.teacherName}  
            </td>
        </thead>
        <thead>
            <td>
                Booking Date(s)
            </td>
            <td>
                ${params.dates}
            </td>
        </thead>
    </table>
    <br>

    <h1 class="heading"><u><i>Payment</i></u></h1>

        <table>

        <thead>
            <td>
                Initial Price Before Discount
            </td>
            <td>
               $${params.initialPrice}
            </td>
        </thead>
        <thead>
            <td>
                Total Cost
            </td>
            <td>
                $${params.totalCost}
            </td>
        </thead>
    </table>

     <br>
           
</body>
</html>
    `,
    });
  } catch (error) {
    console.log(error);
  }
};
