import { RepletServerData } from "@/components/types/Frenlet";
import { UserInServer } from "@/components/types/User";
import { auth } from "@/firebase/clientApp";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Flex,
  Icon,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SkeletonCircle,
  Text,
} from "@chakra-ui/react";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { GoDotFill } from "react-icons/go";
import { SlOptionsVertical } from "react-icons/sl";

type Props = {
  username: string;
  message: string;
  ts: number;
  frenletOwners: string[];
  frenletDocPath: string;
};

export default function Replet({
  username,
  message,
  ts,
  frenletOwners,
  frenletDocPath,
}: Props) {
  const [profilePhoto, setProfilePhoto] = useState("");

  const [canDeleteReplet, setCanDeleteReplet] = useState(false);
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteRepletLoading, setDeleteRepletLoading] = useState(false);
  const [isThisRepletDeleted, setIsThisRepletDeleted] = useState(false);

  useEffect(() => {
    getUserProfilePhoto();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    if (!auth.currentUser.displayName) return;
    const usersCanDeleteReplet = [...frenletOwners, username];
    setCanDeleteReplet(
      usersCanDeleteReplet.includes(auth.currentUser.displayName)
    );
  }, [username, frenletOwners]);

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

  const handleDeleteReplet = async () => {
    if (!canDeleteReplet) return;
    setDeleteRepletLoading(true);

    const currentUserAuthObject = auth.currentUser;
    if (currentUserAuthObject === null) return setDeleteRepletLoading(false);

    const repletData: RepletServerData = {
      message: message,
      sender: username,
      ts: ts,
    };

    try {
      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch("/api/frenlet/deleteReplet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          frenletDocPath: frenletDocPath,
          replet: repletData,
        }),
      });
      if (!response.ok) {
        console.error(
          "Response from deleteReplet is not okay: \n",
          await response.text()
        );
        return setDeleteRepletLoading(false);
      }

      setDeleteRepletLoading(false);
      setDeleteDialogOpen(false);
      return setIsThisRepletDeleted(true);
    } catch (error) {
      console.error("Error on fetching deleteReplet API: \n", error);
      return setDeleteRepletLoading(false);
    }
  };

  return (
    <>
      {!isThisRepletDeleted && (
        <Flex key={ts} align="center" justify="space-between">
          <Flex width="100%" align="center" gap="0.5em">
            {profilePhoto ? (
              <Image
                src={profilePhoto}
                width="3em"
                height="3em"
                rounded="full"
              />
            ) : (
              <SkeletonCircle width="3em" height="3em" />
            )}

            <Flex direction="column">
              <Flex align="center" gap="0.2em">
                <Text color="gray.500" fontSize="10pt" fontWeight="700">
                  {username}
                </Text>
                <Icon
                  as={GoDotFill}
                  width="0.5em"
                  height="0.5em"
                  color="gray.500"
                />
                <Text color="gray.500" fontSize="7pt" fontWeight="500">
                  {moment(new Date(ts)).fromNow()}
                </Text>
              </Flex>

              <Text color="white" fontSize="12pt" fontWeight="700">
                {message}
              </Text>
            </Flex>
          </Flex>
          {canDeleteReplet && (
            <>
              <Menu computePositionOnMount isLazy>
                <MenuButton
                  as={IconButton}
                  icon={<SlOptionsVertical />}
                  color="white"
                  bg="black"
                  _hover={{ bg: "gray.900" }}
                  _focus={{ bg: "black" }}
                  _active={{ bg: "black" }}
                />
                <MenuList>
                  <MenuItem
                    onClick={() => {
                      setDeleteDialogOpen(true);
                    }}
                  >
                    Delete
                  </MenuItem>
                </MenuList>
              </Menu>
              <AlertDialog
                motionPreset="slideInBottom"
                leastDestructiveRef={noButtonRef}
                onClose={() => {
                  setDeleteDialogOpen(false);
                }}
                isOpen={deleteDialogOpen}
                isCentered
              >
                <AlertDialogOverlay />
                <AlertDialogContent>
                  <AlertDialogHeader>Delete Replet?</AlertDialogHeader>
                  <AlertDialogBody>
                    Are you sure you want to delete this replet?
                  </AlertDialogBody>
                  <AlertDialogFooter>
                    <Button
                      ref={noButtonRef}
                      onClick={() => {
                        setDeleteDialogOpen(false);
                      }}
                      isDisabled={deleteRepletLoading}
                    >
                      No
                    </Button>
                    <Button
                      colorScheme="red"
                      ml={3}
                      isLoading={deleteRepletLoading}
                      onClick={handleDeleteReplet}
                    >
                      Yes
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </Flex>
      )}
    </>
  );
}
