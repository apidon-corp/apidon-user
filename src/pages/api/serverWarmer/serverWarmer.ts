import { NextApiRequest, NextApiResponse } from "next";

const handleAuthorization = (authorization: string | undefined) => {
  if (!authorization) return false;

  const apiKey = process.env.SERVER_WARMER_KEY;
  if (!apiKey) return;

  return authorization === apiKey;
};

async function handleSendRequest(
  root: string,
  apiKey: string,
  baseURL: string
) {
  const totalEndpoint = `${baseURL}${root}`;

  try {
    const response = await fetch(totalEndpoint, {
      headers: {
        "Content-Type": "application/json",
        serverwarmerkey: apiKey,
      },
    });

    if (!response.ok) {
      console.error(
        `Error on warming path: ${totalEndpoint}`,
        await response.text()
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error on warming path: ${totalEndpoint}`, error);
    return false;
  }
}

async function executeRequests(roots: string[]) {
  const apiKey = process.env.SERVER_WARMER_KEY;
  if (!apiKey) {
    console.error("Error on getting server warmer key.");
    return false;
  }

  const baseURL = process.env.NEXT_PUBLIC_USER_PANEL_BASE_URL;
  if (!baseURL) {
    console.error("Error on getting user panel base url.");
    return false;
  }

  const results = await Promise.all(
    roots.map((root) => handleSendRequest(root, apiKey, baseURL))
  );

  if (results.includes(false)) {
    console.error("One or more result is not okay in results.");
    return false;
  }

  console.log(results);

  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;

  const isAuthorized = handleAuthorization(authorization as string);
  if (!isAuthorized) return res.status(401).send("Unauthorized");

  const userPanelBaseURL = process.env.NEXT_PUBLIC_USER_PANEL_BASE_URL;
  if (!userPanelBaseURL) {
    console.error("Error on getting user panel base url.");
    return res.status(500).send("Internal Server Error");
  }

  const rootes = [
    "/yunuskorkmaz",
    "/yunuskorkmaz/posts/150220069",
    "/api/feed/main/getPersonalizedMainFeed",
    "/api/feed/nft/getPersonalizedNftFeed",
    "/api/feed/user/getPersonalizedUserFeed",
    "/api/frenlet/createFrenlet",
    "/api/frenlet/createTag",
    "/api/frenlet/deleteFrenlet",
    "/api/frenlet/deleteReplet",
    "/api/frenlet/getFrenOptions",
    "/api/frenlet/getPersonData",
    "/api/frenlet/sendLike",
    "/api/frenlet/sendReply",
    "/api/nft/refreshNFT",
    "/api/nft/uploadNFT",
    "/api/postv2/postComment",
    "/api/postv2/postCommentDelete",
    "/api/postv2/postDelete",
    "/api/postv2/postLike",
    "/api/postv2/postUpload",
    "/api/provider/changeProvider",
    "/api/provider/chooseProvider",
    "/api/provider/getAvaliableProviderOptionsForChange",
    "/api/provider/getProviderInformation",
    "/api/provider/providePostInformation",
    "/api/provider/rateProvider",
    "/api/provider/skipWithdrawNow",
    "/api/provider/withdraw",
    "/api/read/getCollection",
    "/api/read/getDoc",
    "/api/social/follow",
    "/api/user/authentication/login/checkIsThereLinkedAccount",
    "/api/user/authentication/signup/signup",
    "/api/user/fullnameUpdate",
    "/api/user/profilePhotoChange",
  ];

  const executeReult = await executeRequests(rootes);
  if (!executeReult) return res.status(500).send("Internal Server Error");

  return res.status(200).send("OK");
}
