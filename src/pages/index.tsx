import { authModalStateAtom } from "@/components/atoms/authModalAtom";
import { currentUserStateAtom } from "@/components/atoms/currentUserAtom";
import { postsStatusAtom } from "@/components/atoms/postsStatusAtom";
import MainPageLayout from "@/components/Layout/MainPageLayout";
import { PostItemDataV2 } from "@/components/types/Post";
import { IPagePreviewData } from "@/components/types/User";
import { auth } from "@/firebase/clientApp";
import { GetServerSidePropsContext } from "next";
import { useEffect, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";

export default function Home() {
  const currentUserState = useRecoilValue(currentUserStateAtom);
  const [postsDatasInServer, setPostDatasInServer] = useState<PostItemDataV2[]>(
    []
  );

  const setAuthModal = useSetRecoilState(authModalStateAtom);
  const setPostStatus = useSetRecoilState(postsStatusAtom);

  const [postDocPathArray, setPostDocPathArray] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUserState.isThereCurrentUser) {
      return setAuthModal({ open: true, view: "logIn" });
    }
    // Disabling main feed when there is no provider.
    if (!currentUserState.hasProvider) {
      return;
    }

    handlePersonalizedMainFeed();
  }, [currentUserState.isThereCurrentUser, currentUserState.hasProvider]);

  const handlePersonalizedMainFeed = async () => {
    setPostStatus({ loading: true });

    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) {
      console.error("Current user is null");
      return false;
    }

    try {
      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch("/api/feed/main/getPersonalizedMainFeed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        console.error(
          "Error from getPersonalizedMainFeed API is not okay: \n",
          await response.text()
        );
      }

      const result = await response.json();
      // const postItemDatas = result.postItemDatas as PostItemDataV2[];

      // setPostDatasInServer(postItemDatas);

      const postDocPathArrayFetched = result.postDocPathArray;

      setPostDocPathArray(postDocPathArrayFetched);

      setPostStatus({ loading: false });

      return true;
    } catch (error) {
      console.error(
        "Error while fetching to getPersonalizedMainFeed API: \n",
        error
      );
      return false;
    }
  };

  return (
    <>
      {postsDatasInServer && (
        <MainPageLayout postDocPathArray={postDocPathArray} />
      )}
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const pagePreviewData: IPagePreviewData = {
    title: "Apidon",
    description:
      "Socialize, choose your algorithm, earn rewards and create NFTs!",
    type: "website",
    url: "https://app.apidon.com",
    image: "https://app.apidon.com/og.png",
  };

  return {
    props: {
      pagePreviewData: pagePreviewData,
    },
  };
}
