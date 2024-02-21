import getDisplayName from "@/apiUtils";
import { INotificationServerData } from "@/components/types/User";
import AsyncLock from "async-lock";
import { NextApiRequest, NextApiResponse } from "next";
import { fieldValue, firestore } from "../../../firebase/adminApp";

const lock = new AsyncLock();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { operationTo: operationToUsername, opCode } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("Unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  if (
    !operationFromUsername ||
    !operationToUsername ||
    (opCode !== 1 && opCode !== -1)
  ) {
    return res.status(422).send("Invalid Prop or Props");
  }

  await lock.acquire(`followApi-${operationFromUsername}`, async () => {
    const doesOperationFromFollowOperationTo = (
      await firestore
        .doc(`users/${operationFromUsername}/followings/${operationToUsername}`)
        .get()
    ).exists;

    if (opCode === 1) {
      if (doesOperationFromFollowOperationTo) {
        console.error(
          "Error while follow operation. (Detected already followed.)"
        );
        return res.status(422).send("Invalid Prop or Props");
      }
    } else if (opCode === -1) {
      if (!doesOperationFromFollowOperationTo) {
        console.error(
          "Error while follow operation. (Detected already not-followed.)"
        );
        return res.status(422).send("Invalid Prop or Props");
      }
    }
    try {
      const props: followOperationInterface = {
        opCode: opCode,
        operationFromUsername: operationFromUsername,
        operationToUsername: operationToUsername,
      };
      await Promise.all([handleOperationFrom(props), handleOperationTo(props)]);
    } catch (error) {
      console.error("Error while follow operation", error);
      return res.status(503).send("Firebase Error");
    }

    try {
      if (opCode === 1) {
        const newFollowNotificationObject: INotificationServerData = {
          cause: "follow",
          notificationTime: Date.now(),
          seen: false,
          sender: operationFromUsername,
        };

        await firestore
          .collection(`users/${operationToUsername}/notifications`)
          .add({ ...newFollowNotificationObject });
      } else {
        const followNotificationDoc = (
          await firestore
            .collection(`users/${operationToUsername}/notifications`)
            .where("cause", "==", "follow")
            .where("sender", "==", operationFromUsername)
            .get()
        ).docs[0];

        if (followNotificationDoc) await followNotificationDoc.ref.delete();
      }
    } catch (error) {
      console.error(
        "Error while follow. (We were sending notification)",
        error
      );
      return res.status(503).send("Firebase Error");
    }

    return res.status(200).send("Success");
  });
}

interface followOperationInterface {
  operationFromUsername: string;
  opCode: number;
  operationToUsername: string;
}

async function handleOperationFrom(props: followOperationInterface) {
  try {
    await firestore.doc(`users/${props.operationFromUsername}`).update({
      followingCount: fieldValue.increment(props.opCode),
    });
    if (props.opCode === 1) {
      await firestore
        .doc(
          `users/${props.operationFromUsername}/followings/${props.operationToUsername}`
        )
        .set({
          followTime: Date.now(),
        });
    } else {
      await firestore
        .doc(
          `users/${props.operationFromUsername}/followings/${props.operationToUsername}`
        )
        .delete();
    }
  } catch (error) {
    throw new Error(
      `Error while follow operation from HANDLE-OPERATION-FROM: ${error} `
    );
  }
}

async function handleOperationTo(props: followOperationInterface) {
  try {
    await firestore.doc(`users/${props.operationToUsername}`).update({
      followerCount: fieldValue.increment(props.opCode),
    });

    if (props.opCode === 1) {
      await firestore
        .doc(
          `users/${props.operationToUsername}/followers/${props.operationFromUsername}`
        )
        .set({
          followTime: Date.now(),
        });
    } else {
      await firestore
        .doc(
          `users/${props.operationToUsername}/followers/${props.operationFromUsername}`
        )
        .delete();
    }
  } catch (error) {
    throw new Error(
      `Error while follow operation from HANDLE-OPERATION-TO: ${error} `
    );
  }
}
