import Posts from "@/components/Post/Posts";
import { PostItemData } from "@/components/types/Post";
import { Flex } from "@chakra-ui/react";
import React from "react";

type Props = {
  postItemsDatas: PostItemData[];
};

export default function UserContent({ postItemsDatas }: Props) {
  return (
    <Flex justify="center" width="100%">
      <Posts postsItemDatas={postItemsDatas} />
    </Flex>
  );
}
