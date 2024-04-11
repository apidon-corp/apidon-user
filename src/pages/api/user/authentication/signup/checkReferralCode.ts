import { appCheck, firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { referralCode } = req.body;

  // authorization
  if (!authorization) {
    return res.status(401).send("Authentication cannot be established.");
  }
  try {
    await appCheck.verifyToken(authorization);
  } catch (error) {
    return res.status(401).send("Authentication cannot be established.");
  }

  if (req.method !== "POST") return res.status(405).send("Method not allowed!");

  if (referralCode === undefined || !referralCode) {
    return res.status(422).send("Invalid referral code.");
  }

  try {
    const referralCodeDocSnapshot = await firestore
      .doc(`/references/${referralCode}`)
      .get();
    if (!referralCodeDocSnapshot.exists)
      return res.status(422).send("Referral code is invalid.");

    const data = referralCodeDocSnapshot.data();

    if (data === undefined) {
      console.error("Refferal code exists but its data is undefined.");
      return res.status(500).send("Internal server error");
    }

    const inProcess = data.inProcess;
    const isUsed = data.isUsed;

    if (isUsed || inProcess) {
      return res.status(422).send("Referral code has already been used.");
    }

    return res.status(200).send("Success");
  } catch (error) {
    console.error("Error on checking referral code: \n", error);
    return res.status(422).send("Referral code is invalid.");
  }
}
