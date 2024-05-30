import { FrenletServerData } from "@/components/types/Frenlet";
import { UserInServer } from "@/components/types/User";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import Frenlets from "./Frenlets";
import Posts from "./Posts";

type Props = {
  frenletServerDatas: FrenletServerData[];
  tags: string[];
  userInformation: UserInServer;
  postDocPaths: string[];
};

export default function Content({
  frenletServerDatas,
  tags,
  userInformation,
  postDocPaths,
}: Props) {
  return (
    <Tabs isFitted variant="solid-rounded" isLazy>
      <TabList px="1.5em" overflow="auto">
        <Tab color="white">Frenlets</Tab>
        <Tab color="white">Posts</Tab>
      </TabList>
      <TabPanels>
        <TabPanel id="frenlets-panel">
          <Frenlets
            frenletServerDatas={frenletServerDatas}
            tags={tags}
            userInformation={userInformation}
          />
        </TabPanel>
        <TabPanel id="posts-panel">
          <Posts postDocPaths={postDocPaths} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
