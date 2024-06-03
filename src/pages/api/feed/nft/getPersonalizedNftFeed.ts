import getDisplayName, { handleServerWarm } from "@/apiUtils";
import { NftDocDataInServer } from "@/components/types/NFT";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

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

async function getNFTCollection() {
  try {
    const nftsCollectionSnapshot = await firestore.collection("/nfts").get();
    return nftsCollectionSnapshot.docs.map(
      (doc) => doc.data() as NftDocDataInServer
    );
  } catch (error) {
    console.error("Error while getting 'nfts' collection: \n", error);
    return false;
  }
}

function createPostDocPathArray(nftDocDatas: NftDocDataInServer[]) {
  return nftDocDatas.map((nftDocData) => nftDocData.postDocPath);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  handleServerWarm(req, res);
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { authorization } = req.headers;

  const username = await handleAuthorization(authorization);
  if (!username) return res.status(401).send("Unauthorized");

  const nftDocsDatas = await getNFTCollection();
  if (!nftDocsDatas) return res.status(500).send("Internal Server Error");

  const postDocPaths = createPostDocPathArray(nftDocsDatas);

  return res.status(200).json({
    postDocPaths: postDocPaths,
  });
}
