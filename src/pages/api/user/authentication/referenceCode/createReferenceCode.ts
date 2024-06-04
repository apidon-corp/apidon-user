import { ReferenceDocData } from "@/components/types/User";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

function handleAuthorization(authorization: string | undefined) {
  if (!authorization) {
    console.error("Authorization key is undefined.");
    return false;
  }

  const apiKey = process.env.CREATE_REFERRAL_CODE_KEY;
  if (!apiKey) {
    console.error("API KEY is undefined from .env file.");
    return false;
  }

  return authorization === apiKey;
}

async function createReferenceCode() {
  const newReferenceDocData: ReferenceDocData = {
    inProcess: false,
    isUsed: false,
    ts: 0,
    whoUsed: "",
  };

  try {
    const createdReferenceDoc = await firestore
      .collection("/references")
      .add({ ...newReferenceDocData });

    const docId = createdReferenceDoc.id;

    return docId;
  } catch (error) {
    console.error("Error on creating reference code: \n", error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  const { authorization } = req.headers;

  const authorizationResult = handleAuthorization(authorization);
  if (!authorizationResult) return res.status(401).send("Unauthorized");

  const createReferenceCodeResult = await createReferenceCode();
  if (!createReferenceCodeResult)
    return res.status(500).send("Internal server error");

  return res.status(200).json({ referenceCode: createReferenceCodeResult });
}
