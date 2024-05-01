import getDisplayName from "@/apiUtils";
import { ActiveProviderInformation } from "@/components/types/User";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const operationFromUsername = await getDisplayName(authorization as string);

  if (!operationFromUsername) return res.status(401).send("Unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  let apiResponse: ActiveProviderInformation;

  try {
    const currentProviderDoc = await firestore
      .doc(`/users/${operationFromUsername}/provider/currentProvider`)
      .get();

    if (!currentProviderDoc.exists) {
      // There is no current provider doc.

      // We need to send avaliable options to user.

      const response = await fetch(
        `${process.env.API_ENDPOINT_TO_APIDON_PROVIDER_SERVER}/client/provideShowcase`,
        {
          method: "POST",
          headers: {
            authorization: process.env.API_KEY_BETWEEN_SERVICES as string,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Error while getting provider options: \n ${await response.text()}`
        );
      }

      const result = await response.json();

      apiResponse = {
        isThereActiveProvider: false,
        providerOptions: result.providersShowcaseDatas,
      };
      return res.status(200).json({ ...apiResponse });
    }

    const currentProviderDocData = currentProviderDoc.data();

    if (currentProviderDocData === undefined)
      throw new Error("Current Proivder Doc Data is undefined");

    const activeProviderName = currentProviderDocData.name;
    const startTime = currentProviderDocData.startTime;

    if (activeProviderName === undefined || !activeProviderName) {
      throw new Error("Active Provider Name is undefined or null");
    }

    if (startTime === undefined || !startTime) {
      throw new Error("Start time is undefined or null");
    }

    // We are communucating with provider database now.
    const response = await fetch(
      `${process.env.API_ENDPOINT_TO_APIDON_PROVIDER_SERVER}/client/provideProviderInformation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: process.env.API_KEY_BETWEEN_SERVICES as string,
        },
        body: JSON.stringify({
          providerName: activeProviderName,
          startTime: startTime,
          client: operationFromUsername,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Response from provideProviderInformation (Provider Side) is not okay: ${await response.text()}`
      );
    }

    const result = (await response.json()) as ActiveProviderInformation;

    apiResponse = result;

    return res.status(200).json({ ...apiResponse });
  } catch (error) {
    console.error("Error while creating provider information: \n", error);
    return res.status(500).send("Internal Server Error");
  }
}
