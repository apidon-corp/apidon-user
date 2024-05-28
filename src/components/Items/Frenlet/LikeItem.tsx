import { UserInServer } from "@/components/types/User";
import { auth } from "@/firebase/clientApp";
import { Flex, Image, SkeletonCircle, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";

type Props = {
  username: string;
};

export const LikeItem = ({ username }: Props) => {
  const [fullname, setFullname] = useState("");
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    handleGetUserData();
  }, [username]);

  const handleGetUserData = async () => {
    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) return;

    try {
      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch("/api/frenlet/getPersonData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          username: username,
        }),
      });

      if (!response.ok) {
        console.error(
          "Response from getPersonData is not okay: \n",
          await response.text()
        );
        return;
      }

      const result = await response.json();
      const userData: UserInServer = result.personData;

      setFullname(userData.fullname);
      setProfileImage(userData.profilePhoto);
      return;
    } catch (error) {
      console.error("Error on fetching to getPersonData API: \n", error);
      return;
    }
  };

  return (
    <Flex width="100%" align="center" gap="1em">
      {profileImage.length === 0 ? (
        <SkeletonCircle width="4em" height="4em" />
      ) : (
        <Image src={profileImage} width="4em" height="4em" rounded="full" />
      )}

      <Flex direction="column" gap="0.05em">
        <Text color="white" fontSize="14pt" fontWeight="700">
          {username}
        </Text>
        <Text color="white" fontSize="12pt" fontWeight="500">
          {fullname}
        </Text>
      </Flex>
    </Flex>
  );
};
