import getDisplayName from "@/apiUtils";
import { GetDocResponse } from "@/components/types/API";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { docPath } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  if (!docPath) return res.status(422).send("Invalid Prop or Props");

  /**
   * Check if document exists
   * If exists, return data
   */
  try {
    const documentSnapshot = await firestore.doc(docPath).get();

    const response: GetDocResponse = {
      data: { ...documentSnapshot.data() },
      ref: {
        id: documentSnapshot.ref.id,
        path: documentSnapshot.ref.path,
      },
      isExists: documentSnapshot.exists,
    };
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error on readDatabase API: ", error);
    return res.status(400).send(error);
  }
}
