import MainPageLayout from "@/components/Layout/MainPageLayout";
import { postsStatusAtom } from "@/components/atoms/postsStatusAtom";
import { GetPersonalizedNftFeedResponse } from "@/components/types/API";
import { PostItemData } from "@/components/types/Post";
import { Flex, Text } from "@chakra-ui/react";
import { GetServerSidePropsContext } from "next";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";

type Props = {
  nftInformation: PostItemData[] | null;
};

export default function Home({ nftInformation }: Props) {
  const [innerHeight, setInnerHeight] = useState<string>("");

  const setPostStatus = useSetRecoilState(postsStatusAtom);

  useEffect(() => {
    setInnerHeight(`${window.innerHeight}px`);
  }, []);

  useEffect(() => {
    if (!nftInformation) return;
    console.log(nftInformation);
    setPostStatus({
      loading: false,
    });
  }, []);

  if (!nftInformation || nftInformation.length === 0) {
    return (
      <Flex
        justify="center"
        align="center"
        width="100%"
        minHeight={innerHeight}
      >
        <Text as="b" textColor="white" fontSize="20pt">
          No NFT&apos;s to show.
        </Text>
      </Flex>
    );
  }

  return <MainPageLayout postItemsDatas={nftInformation} />;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  /**
   * We need to get nft posts then return them.
   */

  let postItemDatasArray: PostItemData[] = [];
  try {
    const authSessionToken = context.req.cookies["firebase-auth.session-token"];
    if (authSessionToken === undefined) {
      throw new Error("There is no valid user to read database for nft's.");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_USER_PANEL_BASE_URL}/api/feed/nft/getPersonalizedNftFeed`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${authSessionToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error(
        `Response from getPersonalizedNftFeed is not okay: ${await response.text()}`
      );
    }
    const result = (await response.json()) as GetPersonalizedNftFeedResponse;
    postItemDatasArray = result.postItemDatasArray;
  } catch (error) {
    console.error(
      "Error while fetching to 'getPersonalizedNftFeed' API: \n ",
      error
    );
    return {
      props: {
        nftInformation: null,
      },
    };
  }

  return {
    props: {
      nftInformation: postItemDatasArray,
    },
  };
}
