import { UserInServer } from "@/components/types/User";
import { auth, firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { eu } = req.body;

  // authorization...

  // Method Testing...
  if (req.method !== "POST") return res.status(405).send("Method not allowed!");

  // Prop Checking
  if (eu === undefined || !eu) {
    console.error("EU is undefined");
    return res.status(422).send("Invalid Prop or Props");
  }

  // Checking Type of EU

  const emailRegex =
    /^[A-Za-z0-9._%+-]+@(gmail|yahoo|outlook|aol|icloud|protonmail|yandex|mail|zoho)\.(com|net|org)$/i;
  const emailRegexTestResult = emailRegex.test(eu);

  const usernameRegex = /^[a-z0-9]{4,20}$/;
  const usernameRegexTestResult = usernameRegex.test(eu);

  if (!emailRegexTestResult && !usernameRegexTestResult) {
    console.error("Both email and username regex's are failed.");
    return res.status(422).send("Invalid Username or Email.");
  }

  if (emailRegexTestResult && usernameRegexTestResult) {
    console.error("Both email and username regex's are succeed.");
    return res.status(500).send("Internal Server Error");
  }

  // Check Linked Account with Username
  if (usernameRegexTestResult)
    try {
      const userDocSnapshot = await firestore.doc(`/users/${eu}`).get();
      if (!userDocSnapshot.exists) {
        console.warn("No user in database with given username.");
        return res.status(422).send("No account found with this username.");
      }

      const userDocData = userDocSnapshot.data() as UserInServer;

      if (userDocData === undefined) {
        console.error(
          "User's doc data is undefined even if it has a doc with its username"
        );
        return res.status(500).send("Internal Server Error");
      }

      const username = userDocData.username;
      const email = userDocData.email;

      if (username === undefined) {
        console.error(
          "Username (displayname) is undefined even if there is an account."
        );
        return res.status(500).send("Internal Server Error");
      }
      if (email === undefined) {
        console.error("Email is undefined even if there is an account.");
        return res.status(500).send("Internal Server Error");
      }

      return res.status(200).json({
        username: username,
        email: email,
      });
    } catch (error) {
      console.error(`${error}`);
      return res.status(500).send("Internal Server Error");
    }

  // Check Linked Account with Email
  if (emailRegexTestResult) {
    let username;
    let email;
    try {
      const userCredentials = await auth.getUserByEmail(eu);
      username = userCredentials.displayName;
      email = userCredentials.email;
    } catch (error) {
      console.warn(
        "Error while getting user credentials with email: \n",
        error
      );
      return res.status(422).send("No account with found with this email.");
    }

    if (username === undefined) {
      console.error(
        "Username (displayname) is undefined even if there is an account."
      );
      return res.status(500).send("Internal Server Error");
    }
    if (email === undefined) {
      console.error("Email is undefined even if there is an account.");
      return res.status(500).send("Internal Server Error");
    }

    return res.status(200).json({
      username: username,
      email: email,
    });
  }
}
