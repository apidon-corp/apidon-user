import getDisplayName from "@/apiUtils";
import {
  FrenletServerData,
  RepletServerData,
} from "@/components/types/Frenlet";
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

function checkProps(frenletDocPath: string, replet: RepletServerData) {
  if (!frenletDocPath || !replet) {
    console.error("frenletDocPath or replet is undefined.");
    return false;
  }
  return true;
}

async function checkCanDeleteReplet(
  deleteRequester: string,
  frenletDocPath: string,
  replet: RepletServerData
) {
  try {
    const frenletDocSnapshot = await firestore.doc(frenletDocPath).get();
    if (!frenletDocSnapshot.exists) {
      console.error("Frenlet doc does not exist.");
      return false;
    }

    const frenletDocData = frenletDocSnapshot.data() as FrenletServerData;
    if (frenletDocData === undefined) {
      console.error("Frenlet doc data is undefined.");
      return false;
    }

    const repletToBeDeleted = frenletDocData.replies.find(
      (r) =>
        r.message === replet.message &&
        r.sender === replet.sender &&
        r.ts == replet.ts
    );

    if (!repletToBeDeleted) {
      console.error("Replet to be deleted not found.");
      return false;
    }

    const usersCanDeleteThisReplet = [
      frenletDocData.frenletSender,
      frenletDocData.frenletReceiver,
      repletToBeDeleted.sender,
    ];

    if (!usersCanDeleteThisReplet.includes(deleteRequester)) return false;

    return {
      repletToBeDeleted: repletToBeDeleted,
      frenletDocData: frenletDocData,
    };
  } catch (error) {
    console.error("Error on checking canDeleteReplet: \n", error);
    return false;
  }
}

async function deleteRepletForReceiver(
  frenletDocPathForReceiver: string,
  repletToBeDeleted: RepletServerData
) {
  try {
    await firestore.doc(frenletDocPathForReceiver).update({
      replies: fieldValue.arrayRemove({ ...repletToBeDeleted }),
    });
    return true;
  } catch (error) {
    console.error("Error while deleting replet for receiver: \n", error);
    return false;
  }
}

async function deleteRepletForSender(
  frenletDocPathForSender: string,
  repletToBeDeleted: RepletServerData
) {
  try {
    await firestore.doc(frenletDocPathForSender).update({
      replies: fieldValue.arrayRemove({ ...repletToBeDeleted }),
    });
    return true;
  } catch (error) {
    console.error("Error while deleting replet for sender: \n", error);
    return false;
  }
}

async function deleteReplet(
  frenletDocData: FrenletServerData,
  replet: RepletServerData
) {
  const deleteRepletForReceiverResult = await deleteRepletForReceiver(
    `/users/${frenletDocData.frenletReceiver}/frenlets/frenlets/incoming/${frenletDocData.frenletDocId}`,
    replet
  );
  if (!deleteRepletForReceiverResult) return false;

  const deleteRepletForSenderResult = await deleteRepletForSender(
    `/users/${frenletDocData.frenletSender}/frenlets/frenlets/outgoing/${frenletDocData.frenletDocId}`,
    replet
  );
  if (!deleteRepletForSenderResult) return false;

  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { frenletDocPath, replet } = req.body;

  const username = await handleAuthorization(authorization);
  if (!username) return res.status(401).send("Unauthorized");

  const checkPropsResult = checkProps(frenletDocPath, replet);
  if (!checkPropsResult) return res.status(422).send("Invalid Request");

  const checkCanDeleteRepletResult = await checkCanDeleteReplet(
    username,
    frenletDocPath,
    replet
  );
  if (!checkCanDeleteRepletResult) return res.status(403).send("Forbidden");

  const deleteRepletResult = await deleteReplet(
    checkCanDeleteRepletResult.frenletDocData,
    checkCanDeleteRepletResult.repletToBeDeleted
  );
  if (!deleteRepletResult) return res.status(500).send("Internal Server Error");

  return res.status(200).send("OK");
}
