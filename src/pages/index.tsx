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

  const shufflePosts = (postsDatasArray: PostItemDataV2[]) => {
    let currentIndex = postsDatasArray.length,
      randomIndex;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [postsDatasArray[currentIndex], postsDatasArray[randomIndex]] = [
        postsDatasArray[randomIndex],
        postsDatasArray[currentIndex],
      ];
    }

    postsDatasArray.sort((a, b) => b.creationTime - a.creationTime);

    return postsDatasArray;
  };

  /**
   * Shuffles posts.
   * @param postsDatasArray
   * @returns shuffled posts
   */
  const organizePosts = (postsDatasArray: PostItemDataV2[]) => {
    const initialPostsDatasArray = [...postsDatasArray];

    // shuffle with Fisher-Yates method
    const shuffledPostsDatasArray = shufflePosts(initialPostsDatasArray);

    return shuffledPostsDatasArray;
  };

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
      const postItemDatas = result.postItemDatas as PostItemDataV2[];

      setPostDatasInServer(postItemDatas);
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

  const handleAnonymousMainFeed = async () => {
    setPostStatus({ loading: true });
    let response;
    try {
      response = await fetch("/api/feed/main/getAnonymousMainFeed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: process.env
            .NEXT_PUBLIC_ANONYMOUS_ENTERANCE_KEY as string,
        },
      });
    } catch (error) {
      return console.error(
        `Error while fetching 'getAnonymousFeed'-API`,
        error
      );
    }

    if (!response.ok) {
      return console.error(
        `Error from 'getFeedAPI' for ${currentUserState.username} user.`,
        await response.text()
      );
    }

    const postsFromServer: PostItemDataV2[] = (await response.json())
      .postItemDatas;

    const organizedPosts: PostItemDataV2[] = organizePosts(postsFromServer);

    setPostDatasInServer(organizedPosts);

    setPostStatus({ loading: false });
  };

  return (
    <>
      {postsDatasInServer && (
        <MainPageLayout postItemsDatas={postsDatasInServer} />
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
