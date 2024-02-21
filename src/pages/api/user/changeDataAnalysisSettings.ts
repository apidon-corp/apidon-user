import getDisplayName from "@/apiUtils";
import { DataAnalysisPreferencesInServer } from "@/components/types/User";
import { firestore } from "@/firebase/adminApp";
import AsyncLock from "async-lock";
import { NextApiRequest, NextApiResponse } from "next";

const lock = new AsyncLock();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const dataAnalysisPreferences = req.body as DataAnalysisPreferencesInServer;

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("Unauthorized");

  let operationSuccessfull = true;

  await lock.acquire(
    `changeDataAnalysisSettings-${operationFromUsername}`,
    async () => {
      try {
        await firestore
          .doc(
            `/users/${operationFromUsername}/personal/settings/dataAnalysisSettings/postAnalysisSettings`
          )
          .set(dataAnalysisPreferences);
      } catch (error) {
        console.error(
          "Erron on data analysis setting change on API while setting settings doc...",
          error
        );
        operationSuccessfull = false;
      }
    }
  );
  if (!operationSuccessfull)
    return res.status(500).send("Internal Server Error");

  return res.status(200).send("Success");
}
