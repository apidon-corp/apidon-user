import { Stack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import PostItem from "../Items/Post/PostItem";
import PostSkeleton from "../Skeletons/PostSkeleton";
import { postsStatusAtom } from "../atoms/postsStatusAtom";

import { auth, firestore } from "@/firebase/clientApp";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { PostItemDataV2, PostServerDataV2 } from "../types/Post";

type Props = {
  postDocPathArray: string[];
};

export default function Posts({ postDocPathArray }: Props) {
  const postsLoading = useRecoilValue(postsStatusAtom).loading;

  const [fetchMorePost, setFetchMorePost] = useState(false);

  const [givenPosts, setGivenPosts] = useState<PostItemDataV2[]>([]);

  const [finalPostDocPathArray, setFinalPostDocPathArray] =
    useState(postDocPathArray);

  useEffect(() => {
    setFinalPostDocPathArray(postDocPathArray);
  }, [postDocPathArray]);

  // Initial post request.
  useEffect(() => {
    handleGetInitialPosts();
  }, [postDocPathArray]);

  // Scroll Catch Mechanism.
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get more posts.
  useEffect(() => {
    if (fetchMorePost) handleGetMorePosts();
  }, [fetchMorePost]);

  // Show post that created by this user.
  useEffect(() => {
    const currentUserDisplayName = auth.currentUser?.displayName;
    if (!currentUserDisplayName) return;

    const currentUserPostsCollectionRef = collection(
      firestore,
      `/users/${currentUserDisplayName}/posts`
    );

    const q = query(
      currentUserPostsCollectionRef,
      where("creationTime", ">=", Date.now())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          console.log(change.doc.data());

          const newPostDocPath = `/users/${currentUserDisplayName}/posts/${change.doc.id}`;

          const newPostItemData = await createPostItemData(newPostDocPath);
          if (newPostItemData.result === false) return;

          setGivenPosts((prev) => [
            newPostItemData.createdPostItemData,
            ...prev,
          ]);
        }
      });
    });

    return () => unsubscribe();
  }, [postDocPathArray]);

  const handleGetInitialPosts = async () => {
    const newPostsDocPaths = finalPostDocPathArray.slice(0, 1);

    const newPostItemDatas = await Promise.all(
      newPostsDocPaths.map((p) => createPostItemData(p))
    );

    const newPostItemDatasFiltered: PostItemDataV2[] = [];
    for (const newPostItemData of newPostItemDatas) {
      if (newPostItemData.result === false) {
        setFinalPostDocPathArray((prev) =>
          prev.filter((p) => p !== newPostItemData.postDocPath)
        );
      } else {
        newPostItemDatasFiltered.push(newPostItemData.createdPostItemData);
      }
    }

    setGivenPosts(newPostItemDatasFiltered);
  };

  // Following if we reached to the bottom of the page.
  const handleScroll = () => {
    if (fetchMorePost) return;

    const totalArea = document.documentElement.offsetHeight;
    const scrolledArea =
      window.innerHeight + document.documentElement.scrollTop;

    const reachedToBottom = scrolledArea === totalArea;

    setFetchMorePost(reachedToBottom);
  };

  const handleGetMorePosts = async () => {
    if (!fetchMorePost) return;

    const newPostsDocPaths = finalPostDocPathArray.slice(
      givenPosts.length,
      givenPosts.length + 1
    );

    const newPostItemDatas = await Promise.all(
      newPostsDocPaths.map((p) => createPostItemData(p))
    );

    const newPostItemDatasFiltered: PostItemDataV2[] = [];
    for (const newPostItemData of newPostItemDatas) {
      if (!newPostItemData.result) {
        setFinalPostDocPathArray((prev) =>
          prev.filter((p) => p !== newPostItemData.postDocPath)
        );
      } else {
        newPostItemDatasFiltered.push(newPostItemData.createdPostItemData);
      }
    }

    setGivenPosts((prev) => [...prev, ...newPostItemDatasFiltered]);

    setFetchMorePost(false);
  };

  const createPostItemData = async (
    postDocPath: string
  ): Promise<
    | { result: false; postDocPath: string }
    | { result: true; createdPostItemData: PostItemDataV2 }
  > => {
    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) {
      console.error("Current user auth object is undefined.");
      return {
        result: false,
        postDocPath: postDocPath,
      };
    }

    const displayName = currentUserAuthObject.displayName;
    if (!displayName) {
      console.error("Current user display name is undefined.");
      return {
        result: false,
        postDocPath: postDocPath,
      };
    }

    try {
      const postDocRef = doc(firestore, postDocPath);
      const postDocSnapshot = await getDoc(postDocRef);

      if (!postDocSnapshot.exists()) {
        console.error("Post doc does not exist.");
        return {
          result: false,
          postDocPath: postDocPath,
        };
      }

      const postDocSnapshotData = postDocSnapshot.data() as PostServerDataV2;
      if (!postDocSnapshotData) {
        console.error("Post doc data is undefined.");
        return {
          result: false,
          postDocPath: postDocPath,
        };
      }

      const likeStatus = postDocSnapshotData.likes
        .map((l) => l.sender)
        .includes(displayName);

      const createdPostItemData: PostItemDataV2 = {
        ...postDocSnapshotData,
        currentUserLikedThisPost: likeStatus,
        currentUserFollowThisSender: true,
      };

      return {
        result: true,
        createdPostItemData: createdPostItemData,
      };
    } catch (error) {
      console.error(
        "Error while creating postItemData with postDocPath: \n",
        error
      );
      return {
        result: false,
        postDocPath: postDocPath,
      };
    }
  };

  return (
    <Stack gap={3} mt="1em" width="100%">
      {postsLoading ? (
        Array.from({ length: 1 }, (_, index) => <PostSkeleton key={index} />)
      ) : (
        <>
          {givenPosts.map((postItemData) => (
            <PostItem
              key={`${postItemData.senderUsername}${postItemData.id}`}
              postItemData={postItemData}
            />
          ))}
        </>
      )}
    </Stack>
  );
}
