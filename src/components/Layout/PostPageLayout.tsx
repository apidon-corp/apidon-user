import { Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import PostItem from "../Items/Post/PostItem";
import { PostServerDataV2 } from "../types/Post";
import Posts from "../Post/Posts";

type Props = {
  postDocServerData: PostServerDataV2;
};
export default function PostPageLayout({ postDocServerData }: Props) {
  return (
    <>
      <Flex width="100%">
        <Flex
          flexGrow={1}
          display={{
            base: "none",
            sm: "none",
            md: "flex",
            lg: "flex",
          }}
        />

        <Flex
          width={{
            base: "100%",
            sm: "100%",
            md: "550px",
            lg: "550px",
          }}
          height="100%"
        >
          <Posts
            postDocPathArray={[
              `/users/${postDocServerData.senderUsername}/posts/${postDocServerData.id}`,
            ]}
          />
        </Flex>

        <Flex
          flexGrow={1}
          display={{
            base: "none",
            sm: "none",
            md: "flex",
            lg: "flex",
          }}
        />
      </Flex>
    </>
  );
}
