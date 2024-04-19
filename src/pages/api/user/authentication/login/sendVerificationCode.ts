import getDisplayName from "@/apiUtils";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";
import * as sg from "@sendgrid/mail";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("Unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  // Get email address of user.
  let email;
  try {
    const userDocSnapshot = await firestore
      .doc(`users/${operationFromUsername}`)
      .get();

    const userDocData = userDocSnapshot.data();

    if (userDocData === undefined) {
      console.error("userDoc data is undefined.");
      return res.status(500).send("Internal Server Error");
    }

    const emailFetched = userDocData.email;

    if (!emailFetched) {
      console.error("Email is undefined on userDoc");
      return res.status(500).send("Internal Server Error");
    }

    email = emailFetched;
  } catch (error) {
    console.error("Error while getting user's email: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  // Create Verification Code

  const verificationCode = generateSixDigitNumber();
  try {
    await firestore.doc(`emailVerifications/${email}`).set({
      code: verificationCode,
    });
  } catch (error) {
    console.error(
      "Error while creating verificationCode doc in firestore: \n",
      error
    );
    return res.status(500).send("Internal Server Error");
  }

  // Send Verification Email to User
  try {
    const sgApiKey = process.env.SENDGRID_EMAIL_SERVICE_API_KEY;
    if (!sgApiKey) {
      console.error("Error on getting email verification api key: \n");
      return res.status(500).send("Internal Server Error");
    }

    sg.setApiKey(sgApiKey);
    const message = {
      to: email,
      from: "auth@apidon.com",
      subject: `Verification Code for Apidon: ${verificationCode}`,
      text: `Hello, your verification code is: ${verificationCode}`,
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
          <title>Verify Your Email Address</title>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
              /* Base Styles */
              body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  color: #575757;
                  line-height: 1.6;
              }
      
              .highlighted a {
                  color: #1A87FB; /* Change color as desired */
                  text-decoration: underline; /* Add underline */
              }
      
              a {
                  color: #1A87FB;
                  text-decoration: none;
              }
      
              /* Layout */
              .container {
                  background-color: #f5f7f9;
                  padding: 20px;
                  width: 100%;
                  max-width: 600px;
                  margin: 0 auto;
              }
      
              .header {
                  text-align: center;
              }
      
              .logo {
                  width: 100px;
                  height: auto; /* Maintain aspect ratio */
                  display: block;
                  margin: 10px auto;
              }
      
              .content {
                  padding: 20px;
                  background-color: #fff;
                  border-radius: 4px;
              }
      
              .code {
                  font-size: 18px;
                  font-weight: bold;
                  text-align: center;
                  margin: 20px 0;
                  background-color: #f2f2f2;
                  padding: 10px;
                  border-radius: 4px;
                  display: inline-block;
              }
      
              .footer {
                  text-align: center;
                  padding: 10px 0;
              }
      
              /* Highlighting */
              .highlighted {
                  font-weight: bold;
              }
          </style>
      </head>
      
      <body>
          <div class="container">
              <div class="header">
                  <img src="https://app.apidon.com/og.png" alt="Apidon" class="logo" />
              </div>
              <div class="content">
                  <p>Hello, ${operationFromUsername}</p>
                  <p>To verify your email address, please enter the following code:</p>
                  <h2 class="code">${verificationCode}</h2>
                  <p>If you have any questions, please don't hesitate to contact us at <a href="mailto:[support@apidon.com]">support@apidon.com</a> or visit our Help Center at <a href="[https://apidon.com]">Apidon</a>.</p>
              </div>
              <div class="footer">
                  <p>Sincerely,</p>
                  <p>The Apidon Team</p>
              </div>
          </div>
      </body>
      
      </html>
      `,
    };

    await sg.send(message);
  } catch (error) {
    console.error("Error while sending verification email: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  return res.status(200).send("Internal Server Error");
}

function generateSixDigitNumber(): number {
  // Generate a random number between 100000 and 999999
  return Math.floor(100000 + Math.random() * 900000);
}
