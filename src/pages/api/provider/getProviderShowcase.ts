import getDisplayName from "@/apiUtils";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("Unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  let providersShowcaseDatas;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_ENDPOINT_TO_APIDON_PROVIDER_SERVER}/client/provideShowcase`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: process.env.API_KEY_BETWEEN_SERVICES as string,
        },
      }
    );
    if (!response.ok) {
      throw new Error(
        `Response from provideShowcase(provider-side) is not okay: ${await response.text()}`
      );
    }
    const result = await response.json();
    providersShowcaseDatas = {
      providersShowcaseDatas: result.providersShowcaseDatas,
    };
  } catch (error) {
    console.error("Error while getting provider showcase data: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  return res.status(200).json({ ...providersShowcaseDatas });
}