import React, { useEffect, useState } from "react";
import PostItem from "../Items/Post/PostItem";
import { Flex } from "@chakra-ui/react";
import { PostItemData } from "../types/Post";
import { useRecoilState, useSetRecoilState } from "recoil";
import { postsAtViewAtom } from "../atoms/postsAtViewAtom";
import Posts from "../Post/Posts";

type Props = {
  postInformation: PostItemData;
};
export default function PostPageLayout({ postInformation }: Props) {
  const [innerHeight, setInnerHeight] = useState("");
  const [postsAtview, setPostsAtView] = useRecoilState(postsAtViewAtom);

  useEffect(() => {
    setInnerHeight(`${window.innerHeight}px`);
  }, []);

  /**
   * Actually there will be only one post, but to make like and follow system work; these 'postAtView' stuff should be added. :(
   */
  useEffect(() => {
    setPostsAtView([postInformation]);
  }, [postInformation]);

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
          {postsAtview.map((a, i) => (
            <PostItem postItemData={a} key={i} />
          ))}
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
