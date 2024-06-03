import getDisplayName, { handleServerWarm } from "@/apiUtils";
import { FrenletServerData } from "@/components/types/Frenlet";
import { fieldValue, firestore } from "@/firebase/adminApp";
import AsyncLock from "async-lock";
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

function checkProps(action: string, frenletDocPath: string) {
  if (!action || !frenletDocPath) return false;
  if (!(action === "like" || action === "delike")) return false;

  return true;
}

/**
 * Returns already liked status and data of frenlet.
 * @param frenletDocPath
 * @param username
 * @returns
 */
async function getLikeStatusOfUser(frenletDocPath: string, username: string) {
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

    const likeSenders = frenletDocData.likes.map((like) => like.sender);

    return {
      likeStatus: likeSenders.includes(username),
      frenletDocData: frenletDocData,
    };
  } catch (error) {
    console.error("Error on getting like status of user: \n", error);
    return false;
  }
}

async function updateReceiverFrenletDoc(
  receiverFrenletDocPath: string,
  action: "like" | "delike",
  likeObject: { sender: string; ts: number }
) {
  try {
    const receiverFrenletDoc = firestore.doc(receiverFrenletDocPath);
    await receiverFrenletDoc.update({
      likeCount: fieldValue.increment(action === "like" ? 1 : -1),
      likes:
        action === "like"
          ? fieldValue.arrayUnion(likeObject)
          : fieldValue.arrayRemove(likeObject),
    });
    return true;
  } catch (error) {
    console.error("Error on updating receiver frenlet doc: \n", error);
    return false;
  }
}

async function updateSenderFrenletDoc(
  senderFrenletDocPath: string,
  action: "like" | "delike",
  likeObject: { sender: string; ts: number }
) {
  try {
    const senderFrenletDoc = firestore.doc(senderFrenletDocPath);
    await senderFrenletDoc.update({
      likeCount: fieldValue.increment(action === "like" ? 1 : -1),
      likes:
        action === "like"
          ? fieldValue.arrayUnion(likeObject)
          : fieldValue.arrayRemove(likeObject),
    });
    return true;
  } catch (error) {
    console.error("Error on updating sender frenlet doc: \n", error);
    return false;
  }
}

async function like(
  username: string,
  likeStatusOfUser: boolean,
  frenletDocData: FrenletServerData
) {
  if (likeStatusOfUser) return false;

  const likeObject: { sender: string; ts: number } = {
    sender: username,
    ts: Date.now(),
  };

  const [updateReceiverFrenletDocResult, updateSenderFrenletDocResult] =
    await Promise.all([
      updateReceiverFrenletDoc(
        `/users/${frenletDocData.frenletReceiver}/frenlets/frenlets/incoming/${frenletDocData.frenletDocId}`,
        "like",
        likeObject
      ),
      updateSenderFrenletDoc(
        `/users/${frenletDocData.frenletSender}/frenlets/frenlets/outgoing/${frenletDocData.frenletDocId}`,
        "like",
        likeObject
      ),
    ]);

  if (!updateReceiverFrenletDocResult || !updateSenderFrenletDocResult)
    return false;

  return true;
}

async function delike(
  username: string,
  likeStatusOfUser: boolean,
  frenletDocData: FrenletServerData
) {
  if (!likeStatusOfUser) return false;

  const likeObject = frenletDocData.likes.find((l) => l.sender === username);
  if (!likeObject) return false;

  const [updateReceiverFrenletDocResult, updateSenderFrenletDocResult] =
    await Promise.all([
      updateReceiverFrenletDoc(
        `/users/${frenletDocData.frenletReceiver}/frenlets/frenlets/incoming/${frenletDocData.frenletDocId}`,
        "delike",
        likeObject
      ),
      updateSenderFrenletDoc(
        `/users/${frenletDocData.frenletSender}/frenlets/frenlets/outgoing/${frenletDocData.frenletDocId}`,
        "delike",
        likeObject
      ),
    ]);

  if (!updateReceiverFrenletDocResult || !updateSenderFrenletDocResult)
    return false;

  return true;
}

const lock = new AsyncLock();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  handleServerWarm(req, res);

  const { authorization } = req.headers;
  const { frenletDocPath, action } = req.body;

  const username = await handleAuthorization(authorization);
  if (!username) return res.status(401).send("Unauthorized");

  const checkPropsResult = checkProps(action, frenletDocPath);
  if (!checkPropsResult) return res.status(422).send("Invalid Request");

  try {
    await lock.acquire(username, async () => {
      const likeStatusOfUser = await getLikeStatusOfUser(
        frenletDocPath,
        username
      );
      if (!likeStatusOfUser)
        return res.status(500).send("Internal Server Error");

      if (action === "like") {
        const likeResult = await like(
          username,
          likeStatusOfUser.likeStatus,
          likeStatusOfUser.frenletDocData
        );
        if (!likeResult) return res.status(500).send("Internal Server Error");
        return res.status(200).send("OK");
      }

      if (action === "delike") {
        const delikeResult = await delike(
          username,
          likeStatusOfUser.likeStatus,
          likeStatusOfUser.frenletDocData
        );
        if (!delikeResult) return res.status(500).send("Internal Server Error");
        return res.status(200).send("OK");
      }
    });
  } catch (error) {
    console.error("Error on acquiring lock for like operation: \n", error);
    return res.status(500).send("Internal Server Error");
  }
}
