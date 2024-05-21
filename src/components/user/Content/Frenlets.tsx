import { CreateTagArea } from "@/components/Items/Frenlet/CreateTagArea";
import Frenlet from "@/components/Items/Frenlet/Frenlet";
import FrenletSendArea from "@/components/Items/Frenlet/FrenletSendArea";
import { FrenletServerData } from "@/components/types/Frenlet";
import { UserInServer } from "@/components/types/User";
import { auth } from "@/firebase/clientApp";
import {
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

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
  const [canSendFrenlet, setCanSendFrenlet] = useState(false);

  /**
   * To add frenlet realtime, we will use below hook.
   */
  const [frenletServerDataFinalLayer, setFrenletServerDataFinalLayer] =
    useState<FrenletServerData[]>([]);

  const [canCreateTag, setCanCreateTag] = useState(false);

  /**
   * To add tags realtime, we will use below hook.
   */
  const [tagsFinalLayer, setTagsFinalLayer] = useState<string[]>([]);

  useEffect(() => {
    checkCanSendFrenlet();
  }, [frenletServerDatas]);

  useEffect(() => {
    setFrenletServerDataFinalLayer(frenletServerDatas);
  }, [frenletServerDatas]);

  useEffect(() => {
    checkCanCreateTag();
  }, [auth, userInformation]);

  useEffect(() => {
    setTagsFinalLayer(tags);
  }, [tags]);

  const checkCanSendFrenlet = async () => {
    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) return setCanSendFrenlet(false);

    const displayName = currentUserAuthObject.displayName;
    if (!displayName) return setCanSendFrenlet(false);

    try {
      const idToken = await currentUserAuthObject.getIdToken();
      const response = await fetch("/api/frenlet/getFrenOptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        console.error(
          "Response from getFrenOptions API is not okay: \n",
          await response.text()
        );

        return setCanSendFrenlet(false);
      }

      const result = await response.json();
      const frensData = result.frensData as {
        username: string;
        fullname: string;
        image: string;
      }[];

      const frensOfCurrentUser = frensData.map((fren) => fren.username);

      if (!frensOfCurrentUser.includes(userInformation.username)) {
        return setCanSendFrenlet(false);
      }

      return setCanSendFrenlet(true);
    } catch (error) {
      console.error("Error on fetching to getFrenOptions API: \n", error);
      return setCanSendFrenlet(false);
    }
  };

  const checkCanCreateTag = () => {
    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) return setCanCreateTag(false);

    const displayName = currentUserAuthObject.displayName;
    if (!displayName) return setCanCreateTag(false);

    if (displayName !== userInformation.username) return setCanCreateTag(false);

    return setCanCreateTag(true);
  };

  return (
    <Tabs
      variant="soft-rounded"
      isFitted
      colorScheme="yellow"
      key={userInformation.username}
    >
      <TabList px="1em">
        {tagsFinalLayer.map((tag) => (
          <Tab color="white" key={tag}>
            {tag}
          </Tab>
        ))}
        {canCreateTag && (
          <CreateTagArea setTagsFinalLayer={setTagsFinalLayer} />
        )}
      </TabList>
      <TabPanels>
        {tagsFinalLayer.map((tag) => (
          <TabPanel key={tag}>
            {canSendFrenlet && (
              <FrenletSendArea
                frenProfilePhoto={userInformation.profilePhoto}
                frenUsername={userInformation.username}
                setFrenletServerDataFinalLayer={setFrenletServerDataFinalLayer}
                tag={tag}
              />
            )}

            <Flex
              justify="center"
              width="100%"
              direction="column"
              gap="2em"
              mt="1em"
            >
              {frenletServerDataFinalLayer
                .filter((frenletServerData) => frenletServerData.tag === tag)
                .sort((a, b) => b.ts - a.ts)
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
