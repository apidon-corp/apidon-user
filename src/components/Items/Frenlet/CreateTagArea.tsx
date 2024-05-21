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
import React, { useRef, useState } from "react";

type Props = {};

export const CreateTagArea = (props: Props) => {
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateButton = async () => {
    console.log("Created");
    return true;
  };

  const handlePlusButton = () => {
    setCreateTagDialogOpen((prev) => !prev);
  };
  return (
    <Flex align="center" justify="center">
      <Button
        size="sm"
        variant="outline"
        colorScheme="blue"
        fontWeight="600"
        onClick={handlePlusButton}
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
              <Text color="black">Tag Name</Text>
              <Input placeholder="Tag Name" />
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
            >
              Create
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Flex>
  );
};
