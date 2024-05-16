import getDisplayName from "@/apiUtils";
import { FrenletServerData } from "@/components/types/Frenlet";
import { fieldValue, firestore } from "@/firebase/adminApp";
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

function checkProps(message: string, frenletDocPath: string) {
  if (!message || !frenletDocPath) return false;
  return true;
}

async function checkCanReply(username: string, frenletDocPath: string) {
  try {
    const frenletDocSnapshot = await firestore.doc(frenletDocPath).get();
    if (!frenletDocSnapshot.exists) {
      console.error("Frenlet doc not found.");
      return false;
    }

    const frenletDocData = frenletDocSnapshot.data() as FrenletServerData;

    if (frenletDocData === undefined) {
      console.error("Frenlet doc data is undefined.");
      return false;
    }

    if (
      [frenletDocData.frenletSender, frenletDocData.frenletReceiver].includes(
        username
      )
    ) {
      return {
        sender: frenletDocData.frenletSender,
        receiver: frenletDocData.frenletReceiver,
        frenletId: frenletDocData.frenletDocId,
      };
    }

    return false;
  } catch (error) {
    console.error("Error on checking canReply: \n", error);
    return false;
  }
}

async function createReplyForSender(
  username: string,
  frenletDocPath: string,
  message: string
) {
  try {
    await firestore.doc(frenletDocPath).update({
      replies: fieldValue.arrayUnion({
        message: message,
        sender: username,
        ts: Date.now(),
      }),
    });
    return true;
  } catch (error) {
    console.error("Error on creating reply for sender: \n", error);
    return false;
  }
}

async function createReplyForReceiver(
  username: string,
  frenletDocPath: string,
  message: string
) {
  try {
    await firestore.doc(frenletDocPath).update({
      replies: fieldValue.arrayUnion({
        message: message,
        sender: username,
        ts: Date.now(),
      }),
    });
    return true;
  } catch (error) {
    console.error("Error on creating reply for receiver: \n", error);
    return false;
  }
}

async function createReply(
  receiver: string,
  sender: string,
  frenletId: string,
  message: string
) {
  const [senderResult, receiverResult] = await Promise.all([
    createReplyForSender(
      sender,
      `/users/${sender}/frenlets/frenlets/outgoing/${frenletId}`,
      message
    ),
    createReplyForReceiver(
      receiver,
      `/users/${receiver}/frenlets/frenlets/incoming/${frenletId}`,
      message
    ),
  ]);

  if (!senderResult || !receiverResult) return false;
  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { message, frenletDocPath } = req.body;

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const username = await handleAuthorization(authorization);
  if (!username) return res.status(401).send("Unauthorized");

  const checkPropsResult = checkProps(username, frenletDocPath);
  if (!checkPropsResult) return res.status(422).send("Invalid Request");

  const canReply = await checkCanReply(username, frenletDocPath);
  if (!canReply) return res.status(401).send("Unauthorized");

  const result = await createReply(
    canReply.receiver,
    canReply.sender,
    canReply.frenletId,
    message
  );
  if (!result) return res.status(500).send("Internal Server Error");

  return res.status(200).send("OK");
}
