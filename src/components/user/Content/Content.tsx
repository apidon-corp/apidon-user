import { FrenletServerData } from "@/components/types/Frenlet";
import { PostItemDataV2 } from "@/components/types/Post";
import { UserInServer } from "@/components/types/User";
import {
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs
} from "@chakra-ui/react";
import Frenlets from "./Frenlets";
import Posts from "./Posts";

type Props = {
  postItemsDatas: PostItemDataV2[];
  frenletServerDatas: FrenletServerData[];
  tags: string[];
  userInformation: UserInServer;
};

export default function Content({
  frenletServerDatas,
  postItemsDatas,
  tags,
  userInformation,
}: Props) {
  return (
    <Tabs isFitted variant="solid-rounded">
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
          <Posts postItemsDatas={postItemsDatas} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
