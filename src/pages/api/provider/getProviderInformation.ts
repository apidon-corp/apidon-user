import getDisplayName from "@/apiUtils";
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
  const { providerName } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("Unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  if (!providerName) return res.status(422).send("Invalid Prop or Props");

  let providerInformation;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_ENDPOINT_TO_APIDON_PROVIDER_SERVER}/client/provideProviderInformation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: process.env.API_KEY_BETWEEN_SERVICES as string,
        },
        body: JSON.stringify({
          providerName: providerName,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Response from providerProviderInformation API is not okay: ${await response.text()}`
      );
    }
    const result = await response.json();

    providerInformation = {
      providerInformation: result.providerInformation,
    };
  } catch (error) {
    console.error("Error while getting provider information: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  return res.status(200).json({ ...providerInformation });
}
