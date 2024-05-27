import Posts from "@/components/Post/Posts";
import { PostItemData, PostItemDataV2 } from "@/components/types/Post";
import { Flex } from "@chakra-ui/react";
import React from "react";

type Props = {
  postItemsDatas: PostItemDataV2[];
};

export default function UserContent({ postItemsDatas }: Props) {
  return (
    <Flex justify="center" width="100%">
      <Posts postsItemDatas={postItemsDatas} />
    </Flex>
  );
}
