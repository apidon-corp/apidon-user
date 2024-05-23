import { Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import PostItem from "../Items/Post/PostItem";
import { postsAtViewAtom } from "../atoms/postsAtViewAtom";
import { PostItemData, PostItemDataV2 } from "../types/Post";

type Props = {
  postInformation: PostItemDataV2;
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
