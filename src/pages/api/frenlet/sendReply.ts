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

async function checkCanReply(replySender: string, frenletDocPath: string) {
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
        replySender
      )
    )
      return {
        sender: frenletDocData.frenletSender,
        receiver: frenletDocData.frenletReceiver,
        frenletId: frenletDocData.frenletDocId,
      };

    const followersCollectionSnapshot = await firestore
      .collection(`/users/${replySender}/followers`)
      .get();
    const followers = followersCollectionSnapshot.docs.map((doc) => doc.id);

    const followingsCollectionSnapshot = await firestore
      .collection(`/users/${replySender}/followings`)
      .get();
    const followings = followingsCollectionSnapshot.docs.map((doc) => doc.id);

    const mainCharactersFollowsThisGuy =
      followers.includes(frenletDocData.frenletSender) &&
      followers.includes(frenletDocData.frenletReceiver);

    const replySenderFollowsTheseGuys =
      followings.includes(frenletDocData.frenletSender) &&
      followings.includes(frenletDocData.frenletReceiver);

    if (mainCharactersFollowsThisGuy && replySenderFollowsTheseGuys) {
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
  replySender: string,
  frenletDocPath: string,
  message: string
) {
  try {
    await firestore.doc(frenletDocPath).update({
      replies: fieldValue.arrayUnion({
        message: message,
        sender: replySender,
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
  replySender: string,
  frenletDocPath: string,
  message: string
) {
  try {
    await firestore.doc(frenletDocPath).update({
      replies: fieldValue.arrayUnion({
        message: message,
        sender: replySender,
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
  frenletReceiver: string,
  frenletSender: string,
  frenletId: string,
  replySender: string,
  message: string
) {
  const [senderResult, receiverResult] = await Promise.all([
    createReplyForSender(
      replySender,
      `/users/${frenletSender}/frenlets/frenlets/outgoing/${frenletId}`,
      message
    ),
    createReplyForReceiver(
      replySender,
      `/users/${frenletReceiver}/frenlets/frenlets/incoming/${frenletId}`,
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

  const replySender = await handleAuthorization(authorization);
  if (!replySender) return res.status(401).send("Unauthorized");

  const checkPropsResult = checkProps(replySender, frenletDocPath);
  if (!checkPropsResult) return res.status(422).send("Invalid Request");

  const canReply = await checkCanReply(replySender, frenletDocPath);
  if (!canReply) return res.status(401).send("Unauthorized");

  const result = await createReply(
    canReply.receiver,
    canReply.sender,
    canReply.frenletId,
    replySender,
    message
  );
  if (!result) return res.status(500).send("Internal Server Error");

  return res.status(200).send("OK");
}
