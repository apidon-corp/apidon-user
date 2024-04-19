import getDisplayName from "@/apiUtils";
import { auth, firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { verificationCode } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("Unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  if (!verificationCode) {
    return res.status(422).send("Invalid Prop or Props");
  }

  // Code validity checking
  const verificationCodeRegex = /^\d{6}$/;
  const regexTestResult = verificationCodeRegex.test(verificationCode);
  if (!regexTestResult) {
    console.error("Regex test result of verification code is false.");
    return res.status(422).send("Invalid prop or props");
  }

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

  // Verify verification code
  try {
    const verificationCodeDocSnapshot = await firestore
      .doc(`emailVerifications/${email}`)
      .get();

    if (!verificationCodeDocSnapshot.exists) {
      console.error("Verification doc snapshot doesn't exist.");
      return res.status(500).send("Internal Server Error");
    }

    const verificationCodeDocData = verificationCodeDocSnapshot.data();

    if (verificationCodeDocData === undefined) {
      console.error("Verification doc data is undefined");
      return res.status(500).send("Internal Server Error");
    }

    let codeInServer = verificationCodeDocData.code;

    if (!codeInServer) {
      console.error("Code in server is null or undefined.");
      return res.status(500).send("Internal Server Error");
    }
    codeInServer = codeInServer.toString();

    // Direct Comparison
    if (verificationCode !== codeInServer) {
      console.warn("Verification code is false.");
      return res.status(500).send("Internal Server Error");
    }

    // Update auth object
    const authObject = await auth.getUserByEmail(email);

    const uid = authObject.uid;

    if (!uid) {
      console.error("UID of user is null or undefined.");
      return res.status(500).send("Internal Server Error");
    }

    await auth.updateUser(uid, {
      emailVerified: true,
    });

    // Everything is alright but we need to delete doc.
    await verificationCodeDocSnapshot.ref.delete();
  } catch (error) {
    console.error("Error on verifying code: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  return res.status(200).send("Success");
}
