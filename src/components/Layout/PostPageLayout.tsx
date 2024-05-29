import { Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import PostItem from "../Items/Post/PostItem";

import { PostItemDataV2 } from "../types/Post";

type Props = {
  postInformation: PostItemDataV2;
};
export default function PostPageLayout({ postInformation }: Props) {
  const [innerHeight, setInnerHeight] = useState("");

  useEffect(() => {
    setInnerHeight(`${window.innerHeight}px`);
  }, []);

  /**
   * Actually there will be only one post, but to make like and follow system work; these 'postAtView' stuff should be added. :(
   */

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
          minHeight={innerHeight}
          pt={10}
        >
          <PostItem postItemData={postInformation} />
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
