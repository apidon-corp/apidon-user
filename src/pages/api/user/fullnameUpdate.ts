import getDisplayName from "@/apiUtils";
import AsyncLock from "async-lock";
import { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "../../../firebase/adminApp";

const lock = new AsyncLock();

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { newRequestedUsername } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const fullnameRegex = /^\p{L}{1,20}(?: \p{L}{1,20})*$/u;
  if (!fullnameRegex.test(newRequestedUsername)) {
    console.error(
      "Error while updating fullname. (fullname regex couldn't pass)"
    );
    return res.status(422).send("Invalid Prop or Props");
  }

  await lock.acquire(`fullnameUpdateAPI-${operationFromUsername}`, async () => {
    try {
      await firestore.doc(`users/${operationFromUsername}`).update({
        fullname: newRequestedUsername,
      });
    } catch (error) {
      console.error(
        "Error while updating username. (We were updating userdoc)",
        error
      );
      return res.status(503).send("Firebase Error");
    }

    return res.status(200).send("Success");
  });
}
