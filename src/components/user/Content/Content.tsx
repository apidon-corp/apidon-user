import { FrenletServerData } from "@/components/types/Frenlet";
import { PostItemData } from "@/components/types/Post";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import Frenlets from "./Frenlets";
import Posts from "./Posts";

type Props = {
  postItemsDatas: PostItemData[];
  frenletServerDatas: FrenletServerData[];
  tags: string[];
};

export default function Content({ frenletServerDatas, postItemsDatas, tags}: Props) {
  return (
    <Tabs isLazy isFitted variant="solid-rounded">
      <TabList px="1.5em">
        <Tab color="white">Frenlets</Tab>
        <Tab color="white">Posts</Tab>
      </TabList>
      <TabPanels>
        <TabPanel id="frenlets-panel">
          <Frenlets frenletServerDatas={frenletServerDatas} tags={tags} />
        </TabPanel>
        <TabPanel id="posts-panel">
          <Posts postItemsDatas={postItemsDatas} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
