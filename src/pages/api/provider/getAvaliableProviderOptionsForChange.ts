import getDisplayName, { handleServerWarm } from "@/apiUtils";
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

  // Get Avaliable Provider Data from Provider Side.
  try {
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
    const providersShowcaseDatas = result.providersShowcaseDatas;

    if (!result || result === undefined) {
      throw new Error("Result is null or undefined");
    }
    if (!providersShowcaseDatas || providersShowcaseDatas === undefined) {
      throw new Error("Provider Showcase Data is null or undefined");
    }

    // Everthing alright
    return res.status(200).json({
      providersShowcaseDatas: providersShowcaseDatas,
    });
  } catch (error) {
    console.error("Error on fetching to 'provideShowcase' API: \n", error);
    return res.status(500).send("Internal Server Error");
  }
}
