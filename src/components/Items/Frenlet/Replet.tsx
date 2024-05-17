import { UserInServer } from "@/components/types/User";
import { auth } from "@/firebase/clientApp";
import { Flex, Image, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";

type Props = {
  username: string;
  message: string;
  ts: number;
};

export default function Replet({ username, message, ts }: Props) {
  const [profilePhoto, setProfilePhoto] = useState("/og.ong");

  useEffect(() => {
    getUserProfilePhoto();
  }, []);

  const getUserProfilePhoto = async () => {
    const currentUserAuthObject = auth.currentUser;
    if (currentUserAuthObject === null) return;

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
          "Error on fetching getPersonData API: \n",
          await response.text()
        );
        return;
      }

      const result = await response.json();

      const personData = result.personData as UserInServer;

      return setProfilePhoto(personData.profilePhoto);
    } catch (error) {
      console.error("Error on fetching getPersonData API: \n", error);
      return;
    }
  };

  return (
    <Flex key={ts} align="center" gap="0.5em">
      <Image src={profilePhoto} width="3em" height="3em" rounded="full" />
      <Flex direction="column">
        <Text color="gray.500" fontSize="10pt" fontWeight="700">
          {username}
        </Text>
        <Text color="white" fontSize="12pt" fontWeight="700">
          {message}
        </Text>
      </Flex>
    </Flex>
  );
}
