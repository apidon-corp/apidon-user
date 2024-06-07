import { Flex } from "@chakra-ui/react";

import Posts from "../Post/Posts";
import { PostServerDataV2 } from "../types/Post";

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
