import getDisplayName from "@/apiUtils";
import { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "../../../firebase/adminApp";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { unSeenNotificationsDocsIds } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  let updateNotificationDocsPromises = [];
  for (const unSeenNotificationDocId of unSeenNotificationsDocsIds) {
    updateNotificationDocsPromises.push(
      updateNotificationDoc(unSeenNotificationDocId, operationFromUsername)
    );
  }

  try {
    await Promise.all(updateNotificationDocsPromises);
  } catch (error) {
    console.error(
      "Error while seenNotification. (We were updating notification doc)",
      error
    );
    return res.status(502).send("Firebase Error");
  }

  return res.status(200).send("Success");
}

async function updateNotificationDoc(
  docId: string,
  operationFromUsername: string
) {
  await firestore
    .doc(`users/${operationFromUsername}/notifications/${docId}`)
    .update({
      seen: true,
    });
}
