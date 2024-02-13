import getDisplayName from "@/apiUtils";
import {
  INotificationServerData,
  LikeDataForUsersPersonal,
  LikedPostArrayObject,
} from "@/components/types/User";
import AsyncLock from "async-lock";
import { NextApiRequest, NextApiResponse } from "next";

import { fieldValue, firestore } from "../../../firebase/adminApp";
import { PostLikeActionAPIBody } from "@/components/types/API";

const lock = new AsyncLock();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { opCode, postDocPath } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername)
    return res.status(401).json({ error: "unauthorized" });

  if (req.method !== "POST") return res.status(405).json("Method not allowed");

  if (
    (opCode !== 1 && opCode !== -1) ||
    !postDocPath ||
    !operationFromUsername
  ) {
    return res.status(422).json({ error: "Invalid prop or props" });
  }

  await lock.acquire(`postLikeApi-${operationFromUsername}}`, async () => {
    // Checks if user already liked this post.. With first getting information like below.
    // But this method checks from post likes. Not from user's likes.

    const operationFromHaveLikeAlready: boolean = (
      await firestore.doc(`${postDocPath}/likes/${operationFromUsername}`).get()
    ).exists;

    // If like request came... we want to make sure we didn't like before.
    if (opCode === 1) {
      if (operationFromHaveLikeAlready) {
        console.error("Error while like operation. (Detected already liked.)");
        return res.status(422).json({ error: "Invalid prop or props" });
      }
    }
    // If de-like request came, we want to make sure if we liked.
    else {
      if (!operationFromHaveLikeAlready) {
        console.error("Error on like operation. (Detected already not-liked.)");
        return res.status(422).json({ error: "Invalid prop or props" });
      }
    }

    // Increases or decreases post like count...
    try {
      await firestore.doc(postDocPath).update({
        likeCount: fieldValue.increment(opCode as number),
      });
    } catch (error) {
      console.error("Error while like operation, we were on increment", error);
      return res.status(503).json({ error: "Firebase error" });
    }

    // Getting Like Timestamp
    const likeTimestamp = Date.now();

    // At this part, we are adding like activity to like acitivities.
    try {
      if (opCode === 1) {
        const likeObject: LikeDataForUsersPersonal = {
          ts: likeTimestamp,
          postPath: postDocPath,
        };
        await firestore
          .collection(
            `users/${operationFromUsername}/personal/postInteractions/likedPosts`
          )
          .add({ ...likeObject });

        /**
         * We are adding this like info to an array to analyze faster.
         */
        const likedPostsArrayObject: LikedPostArrayObject = {
          timestamp: Date.now(),
          postDocPath: postDocPath,
        };

        const postInteractionsDoc = await firestore
          .doc(`users/${operationFromUsername}/personal/postInteractions`)
          .get();
        if (!postInteractionsDoc.exists) {
          await firestore
            .doc(`users/${operationFromUsername}/personal/postInteractions`)
            .set({
              likedPostsArray: fieldValue.arrayUnion(likedPostsArrayObject),
            });
        } else {
          await firestore
            .doc(`users/${operationFromUsername}/personal/postInteractions`)
            .update({
              likedPostsArray: fieldValue.arrayUnion(likedPostsArrayObject),
            });
        }

        await firestore
          .doc(`users/${operationFromUsername}/personal/postInteractions`)
          .update({
            likedPostsArray: fieldValue.arrayUnion(likedPostsArrayObject),
          });
      } else {
        const query = firestore
          .collection(
            `users/${operationFromUsername}/personal/postInteractions`
          )
          .where("postPath", "==", postDocPath);

        const queryResult = await query.get();

        for (const doc of queryResult.docs) {
          await doc.ref.delete();
        }
      }
    } catch (error) {
      console.error(
        "Error while updating personal/postActivities of user.",
        error
      );
      return res.status(503).json({ error: "Firebase error" });
    }

    // At this part, we are adding like data to post. Info is who liked and when.
    try {
      if (opCode === 1) {
        await firestore
          .doc(`${postDocPath}/likes/${operationFromUsername}`)
          .set({
            likeTime: likeTimestamp,
          });
      } else {
        await firestore
          .doc(`${postDocPath}/likes/${operationFromUsername}`)
          .delete();
      }
    } catch (error) {
      console.error(
        "Error while like operation, we were creating or deleting new like doc.",
        error
      );
      return res.status(503).json({ error: "Firebase error" });
    }

    // Classification Part (If we liked)
    if (opCode === 1) {
      let startTime: number;
      let providerId: string;
      try {
        const currentProviderDoc = await firestore
          .doc(`users/${operationFromUsername}/provider/currentProvider`)
          .get();
        if (!currentProviderDoc.exists)
          throw new Error("User's provider doc doesn't exist.");
        startTime = currentProviderDoc.data()!.startTime;
        providerId = currentProviderDoc.data()!.name;
      } catch (error) {
        console.error("Erron while getting currentProviderDoc: ", error);
        return res.status(500).send("Internal Server Error");
      }

      const likeActionBody: PostLikeActionAPIBody = {
        username: operationFromUsername,
        providerId: providerId,
        startTime: startTime,
        postDocPath: postDocPath,
      };

      try {
        let response = await fetch(
          `${process.env.NEXT_PUBLIC_API_ENDPOINT_TO_APIDON_PROVIDER_SERVER}/client/classification/likeAction`,
          {
            method: "POST",
            headers: {
              authorization: process.env
                .NEXT_PUBLIC_API_KEY_BETWEEN_SERVICES as string,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...likeActionBody }),
          }
        );
        if (!response.ok) {
          throw new Error(
            `likeAction from provider API side's response not okay: ${await response.text()} `
          );
        }
      } catch (error) {
        console.error(
          "Error on fetch to likeAction API at Provider side: ",
          error
        );
        return res.status(500).send("Internal Server Error.");
      }
    }

    // Notification part....
    // In below, we are getting post sender to send notifitcation.
    let postSenderUsername = "";
    try {
      postSenderUsername = (await firestore.doc(postDocPath).get()).data()
        ?.senderUsername;
    } catch (error) {
      console.error("Error while like. (We were getting post sender username");
    }

    // Send Notification
    if (postSenderUsername)
      if (operationFromUsername !== postSenderUsername)
        try {
          if (opCode === 1) {
            const newLikeNotificationObject: INotificationServerData = {
              seen: false,
              notificationTime: likeTimestamp,
              sender: operationFromUsername,
              cause: "like",
            };

            await firestore
              .collection(`users/${postSenderUsername}/notifications`)
              .add({ ...newLikeNotificationObject });
          } else {
            const postSenderUsername = (
              await firestore.doc(postDocPath).get()
            ).data()?.senderUsername;

            const likeNotificationDoc = (
              await firestore
                .collection(`users/${postSenderUsername}/notifications`)
                .where("cause", "==", "like")
                .where("sender", "==", operationFromUsername)
                .get()
            ).docs[0];

            if (likeNotificationDoc) await likeNotificationDoc.ref.delete();
          }
        } catch (error) {
          console.error(
            "Error while like. (We were sending or deleting notification)",
            error
          );
          return res.status(503).json({ error: "Firebase error" });
        }

    return res.status(200).json({});
  });
}
