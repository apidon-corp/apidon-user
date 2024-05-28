import { Stack } from "@chakra-ui/react";
import { useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import PostItem from "../Items/Post/PostItem";
import PostSkeleton from "../Skeletons/PostSkeleton";
import { postsAtViewAtom } from "../atoms/postsAtViewAtom";
import { postsStatusAtom } from "../atoms/postsStatusAtom";

import { PostItemDataV2 } from "../types/Post";

type Props = {
  postsItemDatas: PostItemDataV2[];
};

export default function Posts({ postsItemDatas }: Props) {
  const postsLoading = useRecoilValue(postsStatusAtom).loading;
  const [postsAtView, setPostsAtView] = useRecoilState(postsAtViewAtom);

  useEffect(() => {
    if (postsItemDatas) {
      setPostsAtView(postsItemDatas);
    }
  }, [postsItemDatas]);

  return (
    <Stack gap={3} mt="1em" width="100%">
      {postsLoading ? (
        Array.from({ length: 1 }, (_, index) => <PostSkeleton key={index} />)
      ) : (
        <>
          {postsAtView.map((postItemData) => (
            <PostItem
              key={`${postItemData.senderUsername}${postItemData.postDocId}`}
              postItemData={postItemData}
            />
          ))}
        </>
      )}
    </Stack>
  );
}
