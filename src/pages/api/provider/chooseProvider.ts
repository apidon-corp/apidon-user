import getDisplayName from "@/apiUtils";
import { DealAPIBody, InteractedPostObject } from "@/components/types/API";
import {
  CommentedPostArrayObject,
  LikedPostArrayObject,
  UploadedPostArrayObject,
} from "@/components/types/User";

import { firestore } from "@/firebase/adminApp";
import AsyncLock from "async-lock";

import { NextApiRequest, NextApiResponse } from "next";

const lock = new AsyncLock();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { providerName } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  if (!providerName) return res.status(422).send("Invalid Prop or Props");

  await lock.acquire(`chooseProvider-${operationFromUsername}`, async () => {
    let response;

    /**
     * We'll create interactedPostDocPathArray
     * 1-) Getting like and comment informations from "commentedPostsArray" array, "likedPostsArray" array and "uploadedPostsArray"...
     *                      ...from "user/personal/postInteractions" doc
     * 2-) Then combine all thsese paths.
     * 3-) Remove duplacitions
     */
    let interactedPostObjectsArray: InteractedPostObject[] = [];
    try {
      const postInteractionsDoc = await firestore
        .doc(`users/${operationFromUsername}/personal/postInteractions`)
        .get();
      if (postInteractionsDoc.exists) {
        const likedPostsArray = postInteractionsDoc.data()!
          .likedPostsArray as LikedPostArrayObject[];
        const commentedPostsArray = postInteractionsDoc.data()!
          .commentedPostsArray as CommentedPostArrayObject[];
        const uploadedPostsArray = postInteractionsDoc.data()!
          .uploadedPostsArray as UploadedPostArrayObject[];

        interactedPostObjectsArray = [
          ...likedPostsArray,
          ...commentedPostsArray,
          ...uploadedPostsArray,
        ];

        interactedPostObjectsArray = Array.from(
          new Set([...interactedPostObjectsArray])
        );
      }
    } catch (error) {
      console.error(
        "Error while creating interactedPostObjectsArray on choosing Provider...",
        error
      );
      return res.status(500).send("Internal Server Error");
    }

    const body: DealAPIBody = {
      username: operationFromUsername,
      interactedPostsObjectsArray: [...interactedPostObjectsArray],
      provider: providerName,
    };
    try {
      response = await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT_TO_APIDON_PROVIDER_SERVER}/client/deal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: process.env
              .NEXT_PUBLIC_API_KEY_BETWEEN_SERVICES as string,
          },
          body: JSON.stringify({ ...body }),
        }
      );
    } catch (error) {
      console.error("Error while fetching deal api", error);
      return res.status(503).send("Internal Server Error");
    }

    if (!response.ok) {
      console.error("Error from deal api", await response.text());
      return res.status(503).send("Internal Server Error");
    }

    const { dealResult } = await response.json();

    try {
      await firestore
        .doc(`users/${operationFromUsername}/provider/currentProvider`)
        .set({
          ...dealResult,
        });
    } catch (error) {
      console.error("Error while creating doc for choosen proivder", error);
      return res.status(503).send("Firebase Error");
    }

    return res.status(200).send("Success");
  });
}
