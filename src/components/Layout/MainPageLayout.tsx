import { Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Posts from "../Post/Posts";

type Props = {
  //postItemsDatas: PostItemDataV2[];
  postDocPathArray: string[];
};

/**
 * This component are being used for both 'main page' and 'nft page'.
 */
export default function MainPageLayout({ postDocPathArray }: Props) {
  const [innerHeight, setInnerHeight] = useState("");

  useEffect(() => {
    setInnerHeight(`${window.innerHeight}px`);
  }, []);
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
        >
          <Posts postDocPathArray={postDocPathArray} />
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
