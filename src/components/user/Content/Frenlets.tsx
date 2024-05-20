import Frenlet from "@/components/Items/Frenlet/Frenlet";
import { FrenletServerData } from "@/components/types/Frenlet";
import {
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";

type Props = {
  frenletServerDatas: FrenletServerData[];
  tags: string[];
};

export default function Frenlets({ frenletServerDatas, tags }: Props) {
  return (
    <Tabs variant="soft-rounded" isFitted colorScheme="yellow">
      <TabList px="1em">
        {tags.map((tag) => (
          <Tab color="white" key={tag}>
            {tag}
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {tags.map((tag) => (
          <TabPanel id={tag}>
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
        <TabPanel></TabPanel>
        <TabPanel></TabPanel>
      </TabPanels>
    </Tabs>
  );
}
