import getDisplayName, { isWarmingRequest } from "@/apiUtils";
import { NotificationData, NotificationDocData } from "@/components/types/User";
import AsyncLock from "async-lock";
import { NextApiRequest, NextApiResponse } from "next";
import { fieldValue, firestore } from "../../../firebase/adminApp";

const lock = new AsyncLock();

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};
async function handleAuthorization(key: string | undefined) {
  if (key === undefined) {
    console.error("Unauthorized attemp to sendReply API.");
    return false;
  }

  const operationFromUsername = await getDisplayName(key);
  if (!operationFromUsername) return false;

  return operationFromUsername;
}

function checkProps(operationTo: string, opCode: number) {
  if (!operationTo || !opCode) {
    console.error("Both operationTo and opCode is undefined.");
    return false;
  }

  if (!(opCode == -1 || opCode === 1)) {
    console.error("Invalid action");
    return false;
  }

  return true;
}

async function checkFollowStatus(username: string, operationTo: string) {
  try {
    const followingsSnapshot = await firestore
      .collection(`/users/${username}/followings`)
      .get();

    const followingsUsernames = followingsSnapshot.docs.map((doc) => doc.id);
    return {
      followStatus: followingsUsernames.includes(operationTo),
    };
  } catch (error) {
    console.error("Error while checking follow status", error);
    return false;
  }
}

function checkRequestValid(action: number, isFollowing: boolean) {
  if (action === -1 && !isFollowing) return false;
  if (action === 1 && isFollowing) return false;
  return true;
}

async function updateRequesterFollowings(
  username: string,
  operationTo: string,
  action: number,
  ts: number
) {
  try {
    if (action === -1) {
      await firestore
        .doc(`/users/${username}/followings/${operationTo}`)
        .delete();
    }
    if (action === 1) {
      await firestore.doc(`/users/${username}/followings/${operationTo}`).set({
        followTime: ts,
      });
    }

    return true;
  } catch (error) {
    console.error("Error while updating requester followings", error);
    return false;
  }
}

async function updateOperationToFollowers(
  operationTo: string,
  operationFrom: string,
  action: number,
  ts: number
) {
  try {
    if (action === -1) {
      await firestore
        .doc(`/users/${operationTo}/followers/${operationFrom}`)
        .delete();
    }
    if (action === 1) {
      await firestore
        .doc(`/users/${operationTo}/followers/${operationFrom}`)
        .set({
          followTime: ts,
        });
    }

    return true;
  } catch (error) {
    console.error("Error while updating operationTo followers", error);
    return false;
  }
}

async function updateRequesterFollowingCount(username: string, action: number) {
  try {
    const requesterDocRef = firestore.doc(`/users/${username}`);
    await requesterDocRef.update({
      followingCount: fieldValue.increment(action),
    });
    return true;
  } catch (error) {
    console.error("Error while updating requester following count", error);
    return false;
  }
}

async function updateOperationToFollowerCount(
  operationTo: string,
  action: number
) {
  try {
    const operationToDocRef = firestore.doc(`/users/${operationTo}`);
    await operationToDocRef.update({
      followerCount: fieldValue.increment(action),
    });
    return true;
  } catch (error) {
    console.error("Error while updating operationTo followers count", error);
    return false;
  }
}

async function sendNotification(
  operationFrom: string,
  operationTo: string,
  action: number,
  ts: number
) {
  try {
    const notificationData: NotificationData = {
      cause: "follow",
      sender: operationFrom,
      ts: ts,
    };

    const notificationDocRef = firestore.doc(
      `/users/${operationTo}/notifications/notifications`
    );

    if (action === 1) {
      await notificationDocRef.update({
        notifications: fieldValue.arrayUnion(notificationData),
      });
    }

    if (action === -1) {
      const notificationDocSnapshot = await notificationDocRef.get();
      if (!notificationDocSnapshot.exists) {
        console.error("Notification doc does not exist");
        return false;
      }

      const notificationDocData =
        notificationDocSnapshot.data() as NotificationDocData;

      if (!notificationDocData) {
        console.error("NotificationDocData is undefined");
        return false;
      }

      const notifications = notificationDocData.notifications;

      const deletedNotificationObject = notifications.find(
        (a) => a.cause === "follow" && a.sender === operationFrom
      );
      if (!deletedNotificationObject) {
        console.error("Deleted object is undefined");
        return false;
      }

      await notificationDocRef.update({
        notifications: fieldValue.arrayRemove(deletedNotificationObject),
      });
    }

    return true;
  } catch (error) {
    console.error("Error while sending notification", error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const isWarmingRequestResult = isWarmingRequest(req);
  if (isWarmingRequestResult) return res.status(200).send("OK");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { authorization } = req.headers;
  const { operationTo: operationToUsername, opCode } = req.body;

  const username = await handleAuthorization(authorization);
  if (!username) return res.status(401).send("Unauthorized");

  const checkPropsResult = checkProps(operationToUsername, opCode);
  if (!checkPropsResult) return res.status(422).send("Invalid Request");

  try {
    await lock.acquire(username, async () => {
      const followStatus = await checkFollowStatus(
        username,
        operationToUsername
      );
      if (!followStatus) return res.status(500).send("Internal Server Error");

      const checkRequestValidResult = checkRequestValid(
        opCode,
        followStatus.followStatus
      );
      if (!checkRequestValidResult)
        return res.status(422).send("Invalid Request");

      const ts = Date.now();

      const [
        updateRequesterFollowingsResult,
        updateOperationToFollowersResult,
        updateRequesterFollowingCountResult,
        updateOperationToFollowerCountResult,
        sendNotificationResult,
      ] = await Promise.all([
        updateRequesterFollowings(username, operationToUsername, opCode, ts),
        updateOperationToFollowers(operationToUsername, username, opCode, ts),
        updateRequesterFollowingCount(username, opCode),
        updateOperationToFollowerCount(operationToUsername, opCode),
        sendNotification(username, operationToUsername, opCode, ts),
      ]);

      if (
        !updateRequesterFollowingsResult ||
        !updateOperationToFollowersResult ||
        !updateRequesterFollowingCountResult ||
        !updateOperationToFollowerCountResult ||
        !sendNotificationResult
      ) {
        return res.status(500).send("Internal Server Error");
      }

      return res.status(200).send("OK");
    });
  } catch (error) {
    console.error("Error on acquiring lock for follow operation: \n", error);
    return res.status(500).send("Internal Server Error");
  }
}
