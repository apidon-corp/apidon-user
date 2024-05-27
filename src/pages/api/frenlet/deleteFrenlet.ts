import getDisplayName from "@/apiUtils";
import { FrenletServerData } from "@/components/types/Frenlet";
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

function checkProps(frenletDocPath: string) {
  if (!frenletDocPath) {
    console.error("frenletDocPath is undefined to delete.");
    return false;
  }
  return true;
}

async function checkCanDeleteFrenlet(
  frenletDocPath: string,
  deleteRequester: string
) {
  try {
    const frenletDocSnapshot = await firestore.doc(frenletDocPath).get();
    if (!frenletDocSnapshot.exists) {
      console.error("frenletDoc doesn't exist");
      return false;
    }

    const frenletDocData = frenletDocSnapshot.data() as FrenletServerData;
    if (frenletDocData === undefined) {
      console.error("frenletDocData is undefined");
      return false;
    }

    const usersCanDelete = [
      frenletDocData.frenletSender,
      frenletDocData.frenletReceiver,
    ];
    if (!usersCanDelete.includes(deleteRequester)) {
      console.error("User can't delete frenlet");
      return false;
    }

    return frenletDocData;
  } catch (error) {
    console.error("Error while checking can delete frenlet: \n", error);
    return false;
  }
}

async function deleteFrenletForReceiver(frenletDocPathForReceiver: string) {
  try {
    await firestore.doc(frenletDocPathForReceiver).delete();
    return true;
  } catch (error) {
    console.error("Error while deleting frenletDoc for receiver: \n", error);
    return false;
  }
}

async function deleteFrenletForSender(frenletDocPathForSender: string) {
  try {
    await firestore.doc(frenletDocPathForSender).delete();
    return true;
  } catch (error) {
    console.error("Error while deleting frenletDoc for sender: \n", error);
    return false;
  }
}

async function decreaseFrenScore(frenletReceiver: string) {
  try {
    const userDocRef = firestore.doc(`/users/${frenletReceiver}`);

    await userDocRef.update({
      frenScore: fieldValue.increment(-1),
    });

    return true;
  } catch (error) {
    console.error("Error while decreasing fren score: \n", error);
    return false;
  }
}

async function deleteNotification(
  frenletReceiver: string,
  frenletSender: string,
  ts: number
) {
  try {
    const notificationDocQuery = await firestore
      .collection(`/users/${frenletReceiver}/notifications`)
      .where("cause", "==", "frenlet")
      .where("notificationTime", "==", ts)
      .where("sender", "==", frenletSender)
      .get();

    if (notificationDocQuery.empty) {
      console.error("Notification doc not found");
      return false;
    }

    await notificationDocQuery.docs[0].ref.delete();
    return true;
  } catch (error) {
    console.error("Error while deleting notification: \n", error);
    return false;
  }
}

async function deleteFrenlet(frenletDocData: FrenletServerData) {
  const [
    deleteFrenletForReceiverResult,
    deleteFrenletForSenderResult,
    deleteNotificationResult,
    decreaseFrenScoreResult,
  ] = await Promise.all([
    deleteFrenletForReceiver(
      `/users/${frenletDocData.frenletReceiver}/frenlets/frenlets/incoming/${frenletDocData.frenletDocId}`
    ),
    deleteFrenletForSender(
      `/users/${frenletDocData.frenletSender}/frenlets/frenlets/outgoing/${frenletDocData.frenletDocId}`
    ),
    deleteNotification(
      frenletDocData.frenletReceiver,
      frenletDocData.frenletSender,
      frenletDocData.ts
    ),
    decreaseFrenScore(frenletDocData.frenletReceiver),
  ]);

  if (
    !deleteFrenletForReceiverResult ||
    !deleteFrenletForSenderResult ||
    !deleteNotificationResult ||
    !decreaseFrenScoreResult
  )
    return false;

  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { frenletDocPath } = req.body;

  const username = await handleAuthorization(authorization);
  if (!username) return res.status(401).send("UnAuthorized");

  const checkPropsResult = checkProps(frenletDocPath);
  if (!checkPropsResult) return res.status(422).send("Invalid prop");

  const checkCanDeleteFrenletResult = await checkCanDeleteFrenlet(
    frenletDocPath,
    username
  );
  if (!checkCanDeleteFrenletResult) return res.status(401).send("UnAuthorized");

  const deleteFrenletResult = await deleteFrenlet(checkCanDeleteFrenletResult);
  if (!deleteFrenletResult)
    return res.status(500).send("Internal Server Error");

  return res.status(200).send("OK");
}
