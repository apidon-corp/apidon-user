import getDisplayName from "@/apiUtils";
import { NFTMetadata, NftDocDataInServer } from "@/components/types/NFT";
import { PostServerData } from "@/components/types/Post";

import AsyncLock from "async-lock";
import { TransactionReceipt } from "ethers";
import { NextApiRequest, NextApiResponse } from "next";
import { bucket, fieldValue, firestore } from "../../../firebase/adminApp";
import {
  apidonNFT,
  apidonNFTSepoliaContractAddress,
} from "@/web3/NFT/ApidonNFTApp";
import { UploadNFTResponse } from "@/components/types/API";

const lock = new AsyncLock();

export const maxDuration = 60;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { postDocId, name, description } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  await lock.acquire(`uploadNFTAPI-${operationFromUsername}`, async () => {
    let postDocData;
    try {
      postDocData = (
        await firestore
          .doc(`users/${operationFromUsername}/posts/${postDocId}`)
          .get()
      ).data();

      if (!postDocData) throw new Error("postDoc is null");
    } catch (error) {
      console.error(
        "Error while uploading NFT. (We were getting postDocData)",
        error
      );
      return res.status(503).send("Firebase Error");
    }

    // check if we already minted or not

    if (postDocData.nftStatus.minted) {
      console.error("Error while uploading NFT. (Detected already minted.)");
      return res.status(422).send("Invalid Prop or Props");
    }

    const metadata: NFTMetadata = {
      name: name,
      description: description,

      image: postDocData.image,
      attributes: [
        {
          display_type: "date",
          trait_type: "Post Creation",
          value: postDocData.creationTime,
        },
        {
          display_type: "date",
          trait_type: "NFT Creation",
          value: Date.now(),
        },
        {
          trait_type: "Likes",
          value: postDocData.likeCount,
        },
        {
          trait_type: "Comments",
          value: postDocData.commentCount,
        },
        {
          trait_type: "SENDER",
          value: operationFromUsername,
        },
      ],
    };

    const buffer = Buffer.from(JSON.stringify(metadata));

    const newMetadataFile = bucket.file(
      `users/${operationFromUsername}/postsFiles/${postDocId}/nftMetadata`
    );

    try {
      await newMetadataFile.save(buffer, {
        metadata: {
          contentType: "application/json",
        },
      });
      await newMetadataFile.setMetadata({
        cacheControl: "public, max-age=1",
      });
    } catch (error) {
      console.error(
        "Error while refreshingNFT.(We were on saving new metadata).",
        error
      );
      return res.status(503).send("Firebase Error");
    }
    try {
      await newMetadataFile.makePublic();
    } catch (error) {
      console.error(
        "Error while refreshingNFT.(We were making new metadata public.)",
        error
      );
      return res.status(503).send("Firebase Error");
    }

    const newMetadataFilePublicURL = newMetadataFile.publicUrl();

    let txReceipt: TransactionReceipt | null = null;
    let nftMintTx;
    try {
      nftMintTx = await apidonNFT.mint(newMetadataFilePublicURL);
    } catch (error) {
      console.error(
        "Error while uploading NFT. (We started to mint process.)",
        error
      );
      return res.status(503).send("Chain Error");
    }

    try {
      txReceipt = await nftMintTx.wait(1);
    } catch (error) {
      console.error(
        "Error while uploading NFT.(We were verifying transaction.)",
        error
      );
      return res.status(503).send("Chain Error");
    }

    if (!txReceipt) {
      console.error("Error while uploading NFT. (TX is null)", txReceipt);
      return res.status(503).send("Chain Error");
    }

    const tokenId = parseInt(txReceipt.logs[0].topics[3], 16);
    const openSeaLinkCreated = `https://testnets.opensea.io/assets/sepolia/${apidonNFTSepoliaContractAddress}/${tokenId}`;

    try {
      await firestore.doc(`users/${operationFromUsername}`).update({
        nftCount: fieldValue.increment(1),
      });
    } catch (error) {
      console.error(
        "Error while uploading NFT. (We are updating NFT Count of user.",
        error
      );
      return res.status(503).send("Firebase Error");
    }

    const nftData: NftDocDataInServer = {
      metadataLink: newMetadataFilePublicURL,
      mintTime: Date.now(),
      name: metadata.name,
      description: metadata.description,
      tokenId: tokenId,
      contractAddress: apidonNFTSepoliaContractAddress,
      openseaUrl: openSeaLinkCreated,
      transferStatus: {
        isTransferred: false,
      },
      postDocPath: `/users/${operationFromUsername}/posts/${postDocId}`,
      listStatus: {
        isListed: false,
      },
    };

    let createdNftDoc;
    try {
      createdNftDoc = await firestore.collection(`/nfts`).add({ ...nftData });
    } catch (error) {
      console.error(
        "Error while creating nft doc for newly created nft: \n",
        error
      );
      return res.status(500).send("Internal Server Error");
    }

    const postDocNftStatusPart: PostServerData["nftStatus"] = {
      convertedToNft: true,
      nftDocPath: createdNftDoc.path,
    };

    try {
      await firestore
        .doc(`users/${operationFromUsername}/posts/${postDocId}`)
        .update({
          nftStatus: {
            ...postDocNftStatusPart,
          },
        });
    } catch (error) {
      console.error("Error uploading NFT. (We were updating post doc.", error);
      return res.status(503).send("Firebase Error");
    }

    const response: UploadNFTResponse = {
      nftDocPath: createdNftDoc.path,
    };
    return res.status(200).json({ ...response });
  });
}
