import Frenlet from "@/components/Items/Frenlet/Frenlet";
import FrenletSendArea from "@/components/Items/Frenlet/FrenletSendArea";
import { FrenletServerData } from "@/components/types/Frenlet";
import { UserInServer } from "@/components/types/User";
import {
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import { useState } from "react";

type Props = {
  frenletServerDatas: FrenletServerData[];
  tags: string[];
  userInformation: UserInServer;
};

export default function Frenlets({
  frenletServerDatas,
  tags,
  userInformation,
}: Props) {
  const [currentTag, setCurrentTag] = useState(tags[0] || "");

  const handleTagChange = (index: number) => {
    setCurrentTag(tags[index]);
  };

  return (
    <Tabs
      variant="soft-rounded"
      isFitted
      colorScheme="yellow"
      onChange={handleTagChange}
    >
      <TabList px="1em">
        {tags.map((tag) => (
          <Tab color="white" key={tag}>
            {tag}
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {tags.map((tag) => (
          <TabPanel key={tag}>
            <FrenletSendArea
              frenProfilePhoto={userInformation.profilePhoto}
              frenUsername={userInformation.username}
            />
            <Flex
              justify="center"
              width="100%"
              direction="column"
              gap="2em"
              mt="1em"
            >
              {frenletServerDatas
                .filter((frenletServerData) => frenletServerData.tag === tag)
                .map((frenletData) => (
                  <Frenlet
                    frenletData={frenletData}
                    key={frenletData.frenletDocId}
                  />
                ))}
            </Flex>
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
}
