import getDisplayName from "@/apiUtils";
import {
  GetCollectionResponse,
  GetDocResponse,
  QuerySettings,
} from "@/components/types/API";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { collectionPath } = req.body;
  const querySettings: QuerySettings | undefined = req.body.querySettings;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  if (!collectionPath) return res.status(422).send("Invalid Prop or Props");

  /**
   * Check if document exists
   * If exists, return data
   */
  try {
    let collectionSnapshot;
    if (!querySettings) {
      collectionSnapshot = await firestore.collection(collectionPath).get();
    } else {
      collectionSnapshot = await firestore
        .collection(collectionPath)
        .orderBy(querySettings.orderBy)
        .startAt(querySettings.startAt)
        .endAt(querySettings.endAt)
        .get();
    }

    const docs = collectionSnapshot.docs;

    let docsArray: GetDocResponse[] = [];
    for (const doc of docs) {
      const docObject: GetDocResponse = {
        data: { ...doc.data() },
        ref: {
          id: doc.ref.id,
          path: doc.ref.path,
        },
        isExists: doc.exists,
      };

      docsArray.push(docObject);
    }

    const getCollectionResponse: GetCollectionResponse = {
      docsArray: [...docsArray],
    };

    return res.status(200).json({ ...getCollectionResponse });
  } catch (error) {
    console.error("Error on readDatabase API: ", error);
    return res.status(400).send(error);
  }
}
