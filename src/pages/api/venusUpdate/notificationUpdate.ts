import { NotificationData, NotificationDocData } from "@/components/types/User";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

const handleAuthorization = (authorization: string | undefined) => {
  const updateAPIKey = process.env.VENUS_UPDATE_KEY;
  if (!updateAPIKey) return false;

  if (!authorization) return false;

  return updateAPIKey === authorization;
};

async function getAllUsers() {
  try {
    const usersCollectionQuery = await firestore.collection("/usernames").get();

    const allUsernames = usersCollectionQuery.docs.map((u) => u.id);
    return allUsernames;
  } catch (error) {
    console.error("Error on getting all users: \n", error);
    return false;
  }
}

async function updateNotifications(username: string) {
  const newNotificationArray: NotificationData[] = [];

  try {
    const notificationCollection = await firestore
      .collection(`/users/${username}/notifications`)
      .get();

    for (const notificatonDoc of notificationCollection.docs) {
      const notificatonOldData = notificatonDoc.data() as {
        cause: "like" | "follow" | "comment" | "frenlet";
        sender: string;
        notificationTime: number;
        seen: boolean;
      };

      if (!notificatonOldData) return false;

      const newNotificationObject: NotificationData = {
        cause: notificatonOldData.cause,
        sender: notificatonOldData.sender,
        ts: notificatonOldData.notificationTime,
      };

      newNotificationArray.push(newNotificationObject);
    }

    const newNotificationDocData: NotificationDocData = {
      notifications: newNotificationArray,
      lastOpenedTime: Date.now(),
    };

    await firestore
      .doc(`/users/${username}/notifications/notifications`)
      .set({ ...newNotificationDocData });

    return true;
  } catch (error) {
    console.error("Error on updating notifications: \n", error);
    return false;
  }
}

async function executeUpdateNotifications(usernames: string[]) {
  try {
    await Promise.all(usernames.map((u) => updateNotifications(u)));
    return true;
  } catch (error) {
    console.error("Error on executing updateNotifications: \n", error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;

  const authResult = handleAuthorization(authorization);
  if (!authResult) return res.status(401).send("Unauthorized");

  const allUsernames = await getAllUsers();
  if (!allUsernames) return res.status(500).send("Internal Server Error");

  const updateNotificationsResult = await executeUpdateNotifications(
    allUsernames
  );
  if (!updateNotificationsResult)
    return res.status(500).send("Internal Server Error");

  return res.status(200).send("OK");
}
