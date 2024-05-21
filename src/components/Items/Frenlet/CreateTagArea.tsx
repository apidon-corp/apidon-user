import { auth } from "@/firebase/clientApp";
import {
  Flex,
  Button,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Text,
  Input,
} from "@chakra-ui/react";
import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useRef,
  useState,
} from "react";

type Props = {
  setTagsFinalLayer: Dispatch<SetStateAction<string[]>>;
};

export const CreateTagArea = ({ setTagsFinalLayer }: Props) => {
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);

  const [tag, setTag] = useState("");

  const handleCreateButton = async () => {
    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) return;

    if (tag.length === 0 || tag.length > 5) return;

    setLoading(true);

    try {
      const idToken = await currentUserAuthObject.getIdToken();
      const response = await fetch("/api/frenlet/createTag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          tag: tag,
        }),
      });

      if (!response.ok) {
        console.error(
          "Response from createTag API is not okay: \n",
          await response.text()
        );
        return setLoading(false);
      }

      // Everything is okay
      setLoading(false);
      setCreateTagDialogOpen(false);
      setTag("");
      return setTagsFinalLayer((prev) => [...prev, tag]);
    } catch (error) {
      console.error("Error on fetching to createTag API: \n", error);
      return setLoading(false);
    }
  };

  const handlePlusButton = () => {
    setCreateTagDialogOpen((prev) => !prev);
  };

  const handleTagChange = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;
    value = value.trim();
    if (value.length > 5) return;
    setTag(value);
  };

  return (
    <Flex align="center" justify="center">
      <Button
        size="sm"
        variant="outline"
        colorScheme="blue"
        fontWeight="600"
        onClick={handlePlusButton}
        ml="0.75em"
      >
        +
      </Button>
      <AlertDialog
        motionPreset={"slideInBottom"}
        leastDestructiveRef={cancelButtonRef}
        onClose={() => {
          if (!loading) setCreateTagDialogOpen(false);
        }}
        isOpen={createTagDialogOpen}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>Create Tag</AlertDialogHeader>
          <AlertDialogBody>
            <Flex direction="column" width="100%" gap="1em">
              <Text color="black" fontSize="12pt" fontWeight="600">
                Tag Name
              </Text>
              <Input
                placeholder="Type your new tag..."
                onChange={handleTagChange}
                value={tag}
                isDisabled={loading}
                size="md"
              />
            </Flex>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button
              ref={cancelButtonRef}
              onClick={() => {
                setCreateTagDialogOpen(false);
              }}
              isDisabled={loading}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              ml={3}
              isLoading={loading}
              onClick={handleCreateButton}
              isDisabled={tag.length === 0}
            >
              Create
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Flex>
  );
};
