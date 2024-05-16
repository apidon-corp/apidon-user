import getDisplayName from "@/apiUtils";
import { FrenletServerData } from "@/components/types/Frenlet";
import { INotificationServerData } from "@/components/types/User";
import { fieldValue, firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

async function handleAuthorization(key: string | undefined) {
  if (key === undefined) {
    console.error("Unauthorized attemp to integrateModel API.");
    return false;
  }

  const operationFromUsername = await getDisplayName(key);
  if (!operationFromUsername) return false;

  return operationFromUsername;
}

function checkProps(fren: string, message: string) {
  if (!fren || !message) {
    console.error("Fren or message is undefined.");
    return false;
  }
  return true;
}

async function checkFrenStatus(fren: string, username: string) {
  try {
    const frenSnapshotAsFollower = await firestore
      .doc(`/users/${username}/followers/${fren}`)
      .get();
    if (!frenSnapshotAsFollower.exists) {
      console.error("Fren is not following requester.");
      return false;
    }

    const frenSnapshotAsFollowing = await firestore
      .doc(`/users/${username}/followings/${fren}`)
      .get();
    if (!frenSnapshotAsFollowing.exists) {
      console.error("Requester is not following fren.");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error while checking fren status: \n", error);
    return false;
  }
}

async function createFrenletForSender(
  username: string,
  fren: string,
  message: string
) {
  let frenletServerData: FrenletServerData = {
    commentCount: 0,
    comments: [],
    frenletDocId: "",
    frenletSender: username,
    frenletReceiver: fren,
    likeCount: 0,
    likes: [],
    message: message,
    replies: [],
    ts: Date.now(),
  };

  try {
    const createdOutgoingrenletDoc = await firestore
      .collection(`/users/${username}/frenlets/frenlets/outgoing`)
      .add({ ...frenletServerData });

    await createdOutgoingrenletDoc.update({
      frenletDocId: createdOutgoingrenletDoc.id,
    });

    frenletServerData = {
      ...frenletServerData,
      frenletDocId: createdOutgoingrenletDoc.id,
    };

    return frenletServerData;
  } catch (error) {
    console.error("Error while creating frenlet for sender: \n", error);
    return false;
  }
}

async function createFrenletForReceiver(
  fren: string,
  createdFrenletDocData: FrenletServerData
) {
  try {
    await firestore
      .doc(
        `/users/${fren}/frenlets/frenlets/incoming/${createdFrenletDocData.frenletDocId}`
      )
      .set({ ...createdFrenletDocData });

    return true;
  } catch (error) {
    console.error("Error while creating frenlet for receiver: \n", error);
    return false;
  }
}

async function createFrenlet(username: string, fren: string, message: string) {
  const createdFrenletDocData = await createFrenletForSender(
    username,
    fren,
    message
  );
  if (!createdFrenletDocData) return false;

  const frenletCreateForReceiverResult = await createFrenletForReceiver(
    fren,
    createdFrenletDocData
  );
  if (!frenletCreateForReceiverResult) return false;

  return createdFrenletDocData;
}

/**
 * Sends notification to receiver.
 * @param username
 * @param fren
 * @returns Path of notification doc.
 */
async function sendNotification(username: string, fren: string) {
  const notificationData: INotificationServerData = {
    cause: "frenlet",
    notificationTime: Date.now(),
    seen: false,
    sender: username,
  };

  try {
    const createdNotificationDoc = await firestore
      .collection(`/users/${fren}/notifications`)
      .add({
        ...notificationData,
      });

    return createdNotificationDoc.path;
  } catch (error) {
    console.error("Error while sending notification: \n", error);
    return false;
  }
}

async function updateFrenScore(fren: string) {
  try {
    await firestore.doc(`/users/${fren}`).update({
      frenScore: fieldValue.increment(1),
    });

    return true;
  } catch (error) {
    console.error("Error while increasing fren score: \n", error);
    return false;
  }
}

async function rollback(
  createFrenletResult: false | FrenletServerData,
  sendNotificationResult: false | string,
  updateFrenScoreResult: boolean,
  fren: string
) {
  try {
    if (createFrenletResult) {
      await firestore
        .doc(
          `/users/${createFrenletResult.frenletSender}/frenlets/frenlets/outgoing/${createFrenletResult.frenletDocId}`
        )
        .delete();
      await firestore
        .doc(
          `/users/${createFrenletResult.frenletReceiver}/frenlets/frenlets/incoming/${createFrenletResult.frenletDocId}`
        )
        .delete();
    }
    if (sendNotificationResult) {
      await firestore.doc(sendNotificationResult).delete();
    }
    if (updateFrenScoreResult) {
      await firestore.doc(`/users/${fren}`).update({
        frenScore: fieldValue.increment(-1),
      });
    }
    return true;
  } catch (error) {
    console.error("Error while rolling back: \n", error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { authorization } = req.headers;
  const { fren, message } = req.body;

  const username = await handleAuthorization(authorization);
  if (!username) return res.status(401).send("Unauthorized");

  const checkPropsResult = checkProps(fren, message);
  if (!checkPropsResult) return res.status(500).send("Internal Server Error");

  const frenStatus = await checkFrenStatus(fren, username);
  if (!frenStatus) return res.status(400).send("Bad Request");

  const [createFrenletResult, sendNotificationResult, updateFrenScoreResult] =
    await Promise.all([
      createFrenlet(username, fren, message),
      sendNotification(username, fren),
      updateFrenScore(fren),
    ]);

  if (
    !createFrenletResult ||
    !sendNotificationResult ||
    !updateFrenScoreResult
  ) {
    await rollback(
      createFrenletResult,
      sendNotificationResult,
      updateFrenScoreResult,
      fren
    );
    return res.status(500).send("Internal Server Error");
  }

  return res.status(200).json({
    frenlet: createFrenletResult,
  });
}
