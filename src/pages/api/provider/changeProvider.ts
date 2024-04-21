import getDisplayName from "@/apiUtils";
import { DealAPIBody, InteractedPostObject } from "@/components/types/API";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { providerName } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("Unauthorized");

  if (!providerName || providerName === undefined) {
    return res.status(422).send("Invalid prop or props.");
  }

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  /** To change provider
   * user need to have one active provider. (endTime shouldn't be passed.)
   * User shouldn't change to same active provider.
   */

  try {
    const currentProviderDocSnapshot = await firestore
      .doc(`/users/${operationFromUsername}/provider/currentProvider`)
      .get();

    if (!currentProviderDocSnapshot.exists) {
      console.error("currentProviderDocSnapshot doesn't exist.");
      return res.status(500).send("Internal Server Error");
    }

    const currentProviderDocData = currentProviderDocSnapshot.data();

    if (currentProviderDocData === undefined) {
      console.error("currentProviderDocData has no data in it (undefined)");
      return res.status(500).send("Internal Server Error");
    }

    // Same Provider Checking (user shouldn't change to same provider..)

    if (providerName === currentProviderDocData.name) {
      console.error("You can not change to same provider");
      return res.status(500).send("Internal Server Error");
    }

    const endTime = currentProviderDocData.endTime;
    if (!endTime || endTime === undefined) {
      console.error("endTime is null and undefined.");
      return res.status(500).send("Internal Server Error");
    }

    const currentTime = Date.now();

    // Comparison
    if (currentTime >= endTime) {
      console.error(
        "endTime is passed. User need to choose new provider not change."
      );
      return res.status(500).send("Internal Server Error");
    }

    // Creating old provider doc...
    await firestore
      .doc(
        `users/${operationFromUsername}/provider/old-${currentProviderDocData.name}-${currentProviderDocData.startTime}`
      )
      .set({
        ...currentProviderDocData,
      });

    // Updating showcase and other "old" datas on provider side.
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_ENDPOINT_TO_APIDON_PROVIDER_SERVER}/client/finishWithdraw`,
      {
        method: "POST",
        headers: {
          authorization: process.env.API_KEY_BETWEEN_SERVICES as string,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: operationFromUsername,
          provider: currentProviderDocData.name,
          startTime: currentProviderDocData.startTime,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "Error on withdraw from finishWithdraw-API",
        await response.text()
      );
      return res.status(503).send("Internal Server Error");
    }

    // Everthing alright
  } catch (error) {
    console.error(
      "Error on checking prequerties for changing provider: \n",
      error
    );
    return res.status(500).send("Internal Server Error");
  }

  // Getting needed data to feed provider to analyze user.
  let interactedPostObjectsArray: InteractedPostObject[] = [];
  try {
    const postInteractionsDoc = await firestore
      .doc(`users/${operationFromUsername}/personal/postInteractions`)
      .get();

    if (postInteractionsDoc.exists) {
      const postInteractionsDocData = postInteractionsDoc.data();

      if (postInteractionsDocData !== undefined) {
        const likedPostsArray = postInteractionsDocData.likedPostsArray
          ? postInteractionsDocData.likedPostsArray
          : [];

        const commentedPostsArray = postInteractionsDocData.commentedPostsArray
          ? postInteractionsDocData.commentedPostsArray
          : [];

        const uploadedPostsArray = postInteractionsDocData.uploadedPostsArray
          ? postInteractionsDocData.uploadedPostsArray
          : [];

        interactedPostObjectsArray = [
          ...likedPostsArray,
          ...commentedPostsArray,
          ...uploadedPostsArray,
        ];

        interactedPostObjectsArray = Array.from(
          new Set([...interactedPostObjectsArray])
        );
      }
    }
  } catch (error) {
    console.error(
      "Error while creating interactedPostObjectsArray on choosing Provider...",
      error
    );
    return res.status(500).send("Internal Server Error");
  }

  // Communicate with "deal", "finishWithdraw" APIs from "provider" side
  try {
    const body: DealAPIBody = {
      username: operationFromUsername,
      interactedPostsObjectsArray: [...interactedPostObjectsArray],
      provider: providerName,
    };

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_ENDPOINT_TO_APIDON_PROVIDER_SERVER}/client/deal`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: process.env.API_KEY_BETWEEN_SERVICES as string,
        },
        body: JSON.stringify({ ...body }),
      }
    );

    if (!response.ok) {
      console.error("Error from deal api", await response.text());
      return res.status(503).send("Internal Server Error");
    }

    const { dealResult } = await response.json();

    // Updating current user provider doc.
    await firestore
      .doc(`users/${operationFromUsername}/provider/currentProvider`)
      .set({
        ...dealResult,
      });

    return res.status(200).send("Success");
  } catch (error) {
    console.error("Error on fetching to dealAPI: \n", error);
    return res.status(500).send("Internal Server Error");
  }
}
