import getDisplayName from "@/apiUtils";
import { FrenletServerData } from "@/components/types/Frenlet";
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

function handleProps(frenletDocPath: string) {
  if (!frenletDocPath) return false;
  return true;
}

async function getUpdatedFrenlet(frenletDocPath: string) {
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

    return frenletDocData;
  } catch (error) {
    console.error("Error on getting frenlet doc: \n", error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { frenletDocPath } = req.body;

  const username = handleAuthorization(authorization);
  if (!username) return res.status(401).send("Unauthorized");

  const checkPropsResult = handleProps(frenletDocPath);
  if (!checkPropsResult) return res.status(422).send("Invalid Request");

  const updatedFrenletData = await getUpdatedFrenlet(frenletDocPath);
  if (!updatedFrenletData) return res.status(500).send("Internal Server Error");

  return res.status(200).json({
    frenletData: updatedFrenletData,
  });
}
