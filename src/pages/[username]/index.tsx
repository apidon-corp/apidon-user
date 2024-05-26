import { authModalStateAtom } from "@/components/atoms/authModalAtom";
import { currentUserStateAtom } from "@/components/atoms/currentUserAtom";
import { postsStatusAtom } from "@/components/atoms/postsStatusAtom";
import UserPageLayout from "@/components/Layout/UserPageLayout";
import { FrenletServerData } from "@/components/types/Frenlet";

import { PostItemData, PostItemDataV2 } from "@/components/types/Post";
import { IPagePreviewData, UserInServer } from "@/components/types/User";
import { firestore } from "@/firebase/adminApp";

import { auth } from "@/firebase/clientApp";
import { Flex, Text } from "@chakra-ui/react";

import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";

type Props = {
  userInformation: UserInServer | undefined;
  postItemDatas: PostItemDataV2[];
};

export default function UserPage({ userInformation }: Props) {
  const [innerHeight, setInnerHeight] = useState("");

  const setPostStatus = useSetRecoilState(postsStatusAtom);
  const currentUserState = useRecoilValue(currentUserStateAtom);

  const [postsDatasInServer, setPostDatasInServer] = useState<PostItemDataV2[]>(
    []
  );

  const [frenletServerDatas, setFrenletServerDatas] = useState<
    FrenletServerData[]
  >([]);
  const [tags, setTags] = useState<string[]>([]);

  const setAuthModalState = useSetRecoilState(authModalStateAtom);

  const router = useRouter();

  useEffect(() => {
    setInnerHeight(`${window.innerHeight}px`);
  }, []);

  useEffect(() => {
    if (currentUserState.isThereCurrentUser) {
      handlePersonalizedUserFeed();
    } else {
      /**
       * Disabling anonymous feed.
       */
      //handleAnonymousUserFeed();
      setAuthModalState({ open: true, view: "signUp" });
    }
  }, [currentUserState.isThereCurrentUser, router.asPath]);

  const handleAnonymousUserFeed = async () => {
    setPostStatus({ loading: true });
    let response;
    try {
      response = await fetch("/api/feed/user/getAnonymousUserFeed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: process.env
            .NEXT_PUBLIC_ANONYMOUS_ENTERANCE_KEY as string,
        },
        body: JSON.stringify({
          username: router.asPath.split("/")[1],
        }),
      });
    } catch (error) {
      return console.error(
        `Error while fetching 'getAnonymousUserFeed'-API`,
        error
      );
    }

    if (!response.ok) {
      return console.error(
        `Error from 'getAnonymousUserFeedAPI' for ${currentUserState.username} user.`,
        await response.text()
      );
    }

    const postsFromServer: PostItemDataV2[] = (await response.json())
      .postItemDatas;

    setPostDatasInServer(postsFromServer);

    setPostStatus({ loading: false });
  };

  const handlePersonalizedUserFeed = async () => {
    setPostStatus({ loading: true });

    let idToken = "";
    try {
      idToken = (await auth.currentUser?.getIdToken(true)) as string;
    } catch (error) {
      console.error("Error while getting 'idToken'", error);
      return false;
    }

    let response;
    try {
      response = await fetch("/api/feed/user/getPersonalizedUserFeed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          username: router.asPath.split("/")[1],
        }),
      });
    } catch (error) {
      return console.error(
        `Error while fetching 'getFeed'-API for ${currentUserState.username} user.`,
        error
      );
    }

    if (!response.ok) {
      return console.error(
        `Error from 'getFeedAPI' for ${currentUserState.username} user.`,
        await response.text()
      );
    }

    const result = await response.json();

    const postsFromServer = result.postItemDatas as PostItemDataV2[];
    const frenlets = result.frenlets as FrenletServerData[];
    const tags = result.tags as string[];

    postsFromServer.sort((a, b) => b.creationTime - a.creationTime);
    setPostDatasInServer(postsFromServer);

    frenlets.sort((a, b) => b.ts - a.ts);
    setFrenletServerDatas(frenlets);

    setTags(tags);

    setPostStatus({ loading: false });
  };

  if (!userInformation) {
    return (
      <Flex
        justify="center"
        align="center"
        width="100%"
        minHeight={innerHeight}
      >
        <Text as="b" textColor="white" fontSize="20pt">
          User couldn&apos;t be found.
        </Text>
      </Flex>
    );
  }

  return (
    <UserPageLayout
      userInformation={userInformation}
      postItemsDatas={postsDatasInServer}
      frenletServerDatas={frenletServerDatas}
      tags={tags}
    />
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const username = context.query.username;
  let userInformation: UserInServer | null = null;

  let userInformationDocResult;
  try {
    userInformationDocResult = await firestore.doc(`users/${username}`).get();
  } catch (error) {
    console.error(
      "Error while creating userpage. (We were getting userdoc)",
      error
    );
    return {
      props: {
        userInformation: null,
      },
    };
  }

  if (!userInformationDocResult.exists) {
    console.warn("User doesn't exist");
    return {
      props: {
        userInformation: null,
      },
    };
  }

  const tempUserInformation: UserInServer = {
    username: userInformationDocResult.data()?.username,
    fullname: userInformationDocResult.data()?.fullname,
    profilePhoto: userInformationDocResult.data()?.profilePhoto,

    followingCount: userInformationDocResult.data()?.followingCount,
    followerCount: userInformationDocResult.data()?.followerCount,
    frenScore: userInformationDocResult.data()?.frenScore,

    nftCount: userInformationDocResult.data()?.nftCount,

    email: userInformationDocResult.data()?.email,
    uid: userInformationDocResult.data()?.uid,
  };

  userInformation = tempUserInformation;

  const pagePreviewData: IPagePreviewData = {
    title: `${userInformation.username}'s Apidon`,
    description: `${userInformation.followerCount} followers, ${userInformation.nftCount} NFT's`,
    type: "website",
    url: `${process.env.NEXT_PUBLIC_USER_PANEL_BASE_URL}/${userInformation.username}`,
    image: userInformation.profilePhoto,
  };

  return {
    props: {
      userInformation: userInformation,
      pagePreviewData: pagePreviewData,
    },
  };
}
