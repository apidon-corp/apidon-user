import getDisplayName, { handleServerWarm } from "@/apiUtils";
import { fieldValue, firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  handleServerWarm(req, res);

  const { authorization } = req.headers;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("Unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  // check if user has right to withdraw
  let currentProviderDocOfUser: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
  try {
    currentProviderDocOfUser = await firestore
      .doc(`users/${operationFromUsername}/provider/currentProvider`)
      .get();
  } catch (error) {
    console.error(
      "Error while skipping withdraw. We were getting current provider doc of user",
      error
    );
    return res.status(503).send("Firebase Error");
  }

  if (!currentProviderDocOfUser.exists) {
    console.error(
      "Error while skipping withdraw. User has even no current provider doc."
    );
    return res.status(422).send("No Provider");
  }

  const dealEndTimeInServer = currentProviderDocOfUser.data()
    ?.endTime as number;
  const dealStartTimeInServer = currentProviderDocOfUser.data()
    ?.startTime as number;

  const currentTime = Date.now();
  const userHasWithdrawRight = currentTime >= dealEndTimeInServer;

  if (!userHasWithdrawRight) {
    console.error(
      "Error on withdraw. User has no right to withdraw",
      "Deal End Time: ",
      dealEndTimeInServer,
      "Server Current Time: ",
      currentTime
    );
    return res.status(422).send("No Right to Withdraw");
  }

  const yieldValue = currentProviderDocOfUser.data()?.yield as string;

  if (!yieldValue) {
    console.error("Error on withdraw. (We were looking for yield.");
    return res.status(503).send("Internal Server Error");
  }

  const currentProviderName = currentProviderDocOfUser.data()?.name as string;

  try {
    await firestore
      .doc(
        `users/${operationFromUsername}/provider/old-${currentProviderName}-${dealStartTimeInServer}`
      )
      .set({
        ...currentProviderDocOfUser.data(),
      });
  } catch (error) {
    console.error(
      "Error on skipping withdraw.. (we were adding old doc)",
      error
    );
    return res.status(503).send("Firebase Error");
  }

  try {
    await firestore
      .doc(`users/${operationFromUsername}/provider/currentProvider`)
      .delete();
  } catch (error) {
    console.error(
      "Error on skipping withdraw. (We were deleting currentProviderDoc",
      error
    );
    return res.status(503).send("Firebase Error");
  }

  let response;
  try {
    response = await fetch(
      `${process.env.API_ENDPOINT_TO_APIDON_PROVIDER_SERVER}/client/finishWithdraw`,
      {
        method: "POST",
        headers: {
          authorization: process.env.API_KEY_BETWEEN_SERVICES as string,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: operationFromUsername,
          provider: currentProviderName,
          startTime: dealStartTimeInServer,
        }),
      }
    );
  } catch (error) {
    console.error(
      "Error on withdraw skipping. (We were fetching finishWithdraw API)",
      error
    );
    return res.status(503).send("Internal Server Error");
  }

  if (!response.ok) {
    console.error(
      "Error on withdraw from finishWithdraw-API",
      await response.text()
    );
    return res.status(503).send("Internal Server Error");
  }

  // We need to update "debtsNotCollected" doc and its "debtsNotCollected" field.

  const yieldValueNumber = Number(yieldValue);

  try {
    const debtsNotCollectedDocSnapshot = await firestore
      .doc(`/users/${operationFromUsername}/provider/debtsNotCollected`)
      .get();

    if (debtsNotCollectedDocSnapshot.exists) {
      await debtsNotCollectedDocSnapshot.ref.update({
        debtsNotCollected: fieldValue.increment(yieldValueNumber),
      });
    } else {
      // Create new doc and set the value.
      await debtsNotCollectedDocSnapshot.ref.set({
        debtsNotCollected: yieldValueNumber,
      });
    }
  } catch (error) {
    console.error(
      "Error on updating debsNotCollectedDoc and its 'debtsNotCollected' field: \n",
      error
    );
    return res.status(500).send("Internal Server Error");
  }

  return res.status(200).send("Success");
}
