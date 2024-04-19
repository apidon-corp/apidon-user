import { appCheck, firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

import * as sg from "@sendgrid/mail";
import { error } from "console";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { email } = req.body;

  if (!authorization) {
    return res.status(500).json({
      cause: "server",
      message: "Secure connection cannot be established.",
    });
  }

  try {
    await appCheck.verifyToken(authorization);
  } catch (error) {
    return res.status(500).json({
      cause: "server",
      message: "Secure connection cannot be established.",
    });
  }

  if (req.method !== "POST")
    return res.status(405).json({
      cause: "server",
      message: "Method not allowed.",
    });

  if (email === undefined || !email) {
    return res.status(500).json({
      cause: "server",
      message: "Internal Server Error",
    });
  }

  // Check Email
  const emailRegex =
    /^[A-Za-z0-9._%+-]+@(gmail|yahoo|outlook|aol|icloud|protonmail|yandex|mail|zoho)\.(com|net|org)$/i;
  const regexTestResult = emailRegex.test(email);

  if (!regexTestResult)
    return res.status(422).json({
      cause: "email",
      message: "Invalid Email.",
    });

  // Creating verification code...
  const verificationCode = generateSixDigitNumber();
  try {
    const verificationCodeDoc = await firestore
      .doc(`emailVerifications/${email}`)
      .set({
        code: verificationCode,
      });
  } catch (error) {
    console.error(
      "Error while creating verificationCode doc in firestore: \n",
      error
    );
    return res.status(500).json({
      cause: "server",
      message: "Internal Server Error",
    });
  }

  // Send Email Verification Code
  const sgApiKey = process.env.SENDGRID_EMAIL_SERVICE_API_KEY;
  if (!sgApiKey) {
    console.error("Error on getting email verification api key: \n");
    return res.status(500).json({
      cause: "server",
      message: "Internal Server Error",
    });
  }

  try {
    sg.setApiKey(sgApiKey);
    const message = {
      to: email,
      from: "auth@apidon.com",
      subject: "Verification Code for Apidon",
      text: `Hello, your verification code is: ${verificationCode}`,
    };

    await sg.send(message);
  } catch (error) {
    console.error("Error on sending verification code: \n", error);
    return res.status(500).json({
      cause: "server",
      message: "Internal Server Error",
    });
  }

  return res.status(200).send("Verification email successfully sent.");
}

function generateSixDigitNumber(): number {
  // Generate a random number between 100000 and 999999
  return Math.floor(100000 + Math.random() * 900000);
}
