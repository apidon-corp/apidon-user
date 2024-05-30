import getDisplayName from "@/apiUtils";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

async function handleAuthorization(key: string | undefined) {
  if (key === undefined) {
    console.error("Unauthorized attemp to sendReply API.");
    return false;
  }

  const operationFromUsername = await getDisplayName(key);
  if (!operationFromUsername) return false;

  return operationFromUsername;
}

async function updateLastOpenedTime(username: string) {
  try {
    const notificationsDoc = firestore.doc(
      `/users/${username}/notifications/notifications`
    );

    await notificationsDoc.update({
      lastOpenedTime: Date.now(),
    });

    return true;
  } catch (error) {
    console.error("Error updating lastOpenedTime: ", error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;

  const username = await handleAuthorization(authorization);
  if (!username) return res.status(401).send("Unauthorized");

  const updateLastOpenedTimeResult = await updateLastOpenedTime(username);
  if (!updateLastOpenedTimeResult)
    return res.status(500).send("Internal Server Error");

  return res.status(200).send("OK");
}
