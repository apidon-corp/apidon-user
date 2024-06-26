import { Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { FrenletServerData } from "../types/Frenlet";
import { UserInServer } from "../types/User";
import Content from "../user/Content/Content";
import Header from "../user/Header";

type Props = {
  userInformation: UserInServer;
  postDocPaths: string[];
  frenletServerDatas: FrenletServerData[];
  tags: string[];
};

export default function UserPageLayout({
  userInformation,
  postDocPaths,
  frenletServerDatas,
  tags,
}: Props) {
  const [innerHeight, setInnerHeight] = useState("");

  useEffect(() => {
    setInnerHeight(`${window.innerHeight}px`);
  }, []);

  return (
    <>
      <Flex width="100%">
        <Flex
          grow={1}
          display={{
            base: "none",
            sm: "none",
            md: "flex",
            lg: "flex",
          }}
        />

        <Flex
          direction="column"
          width={{
            base: "100%",
            sm: "100%",
            md: "550px",
            lg: "550px",
          }}
          minHeight={innerHeight}
          key={userInformation.username}
          gap="2em"
        >
          <Flex justify="center" align="center" width="100%">
            <Header userInformation={userInformation} />
          </Flex>
          <Content
            frenletServerDatas={frenletServerDatas}
            postDocPaths={postDocPaths}
            tags={tags}
            userInformation={userInformation}
          />
        </Flex>
        <Flex
          grow={1}
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
