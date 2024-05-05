import getDisplayName from "@/apiUtils";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { score } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("Unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  if (!score) return res.status(422).send("Invalid Prop or Props");

  let currentProviderDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
  try {
    currentProviderDoc = await firestore
      .doc(`users/${operationFromUsername}/provider/currentProvider`)
      .get();
  } catch (error) {
    console.error(
      "Error while updating rate. (We were looking for current provider of user.)",
      error
    );
    return res.status(503).send("Firebase Error");
  }

  if (!currentProviderDoc.exists) {
    console.error(
      "Error on rate provider. Current provider doc doesn't exist."
    );
    return res.status(503).send("Firebase Error");
  }

  // update current user doc
  try {
    await firestore
      .doc(`users/${operationFromUsername}/provider/currentProvider`)
      .update({
        userScore: score,
      });
  } catch (error) {
    console.error(
      "Error while rating provider. (We were updating current provide doc",
      error
    );
    return res.status(503).send("Firebase Error");
  }

  try {
    await fetch(
      `${process.env.API_ENDPOINT_TO_APIDON_PROVIDER_SERVER}/client/takeRate`,
      {
        method: "POST",
        headers: {
          authorization: process.env.API_KEY_BETWEEN_SERVICES as string,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score: score,
          provider: currentProviderDoc.data()?.name,
          username: operationFromUsername,
          startTime: currentProviderDoc.data()?.startTime,
        }),
      }
    );
  } catch (error) {
    console.error(
      "Error while rating provider. (We were fetching the getRate API...",
      error
    );
    return res.status(503).send("Internal Server Error");
  }

  return res.status(200).send("Success");
}
