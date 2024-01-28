import { dataAnalysisPreferencesModalAtom } from "@/components/atoms/dataAnalysisPreferencesModalAtom";
import {
  DataAnalysisPreferencesInServer,
  DataAnalysisPreferencesState,
} from "@/components/types/User";
import { auth, firestore } from "@/firebase/clientApp";
import useChangeDataAnalysisPreferences from "@/hooks/personalizationHooks/useChangeDataAnalysisPreferences";

import {
  Button,
  Flex,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Spinner,
  Switch,
  Text,
} from "@chakra-ui/react";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { useRecoilState } from "recoil";

export default function DataAnalysisPreferencesModal() {
  const { changeDataAnalysisPreferences } = useChangeDataAnalysisPreferences();

  const [saveLoading, setSaveLoading] = useState(false);
  const [getLoading, setGetLoading] = useState(true);

  const [modalOpenState, setModalOpenState] = useRecoilState(
    dataAnalysisPreferencesModalAtom
  );

  const [dataAnalysisPreferencesState, setDataAnalysisPreferencesState] =
    useState<DataAnalysisPreferencesState>({
      likeAnalysis: false,
      commentAnalysis: false,
    });

  const [
    originalDataAnalysisPreferencesState,
    setOriginallDataAnalysisPreferencesState,
  ] = useState<DataAnalysisPreferencesInServer>({
    commentAnalysis: false,
    likeAnalysis: false,
  });

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDataAnalysisPreferencesState((prev) => ({
      ...prev,
      [event.target.name]: event.target.checked,
    }));
  };

  const handleSaveButton = async () => {
    setSaveLoading(true);
    const opResult = await changeDataAnalysisPreferences(
      dataAnalysisPreferencesState
    );
    setSaveLoading(false);

    if (opResult) setModalOpenState(false);
    else {
      console.error("Error on Preference Changing...");
    }
  };

  const handleGetPreferencesFromServer = async () => {
    setGetLoading(true);
    try {
      const docSnapshot = await getDoc(
        doc(
          firestore,
          `/users/${auth.currentUser?.displayName}/personal/settings/dataAnalysisSettings/postAnalysisSettings`
        )
      );
      if (!docSnapshot.exists) {
        console.log("There is no Analysis Settings Doc in Firestore.");
        return setGetLoading(false);
      }

      if (!docSnapshot.data()) {
        console.log("There is no Analysis Settings Data in Firestore.");
        return setGetLoading(false);
      }

      const prefData = docSnapshot.data() as DataAnalysisPreferencesInServer;

      setDataAnalysisPreferencesState(prefData);
      setOriginallDataAnalysisPreferencesState(prefData);

      return setGetLoading(false);
    } catch (error) {
      console.error("Error while getting data analysis pref doc...", error);
      return setGetLoading(false);
    }
  };

  useEffect(() => {
    if (modalOpenState) handleGetPreferencesFromServer();
  }, [modalOpenState]);

  return (
    <>
      <Modal
        id="dataAnalysisPreferencesModal"
        size={{
          base: "full",
          sm: "full",
          md: "md",
          lg: "md",
        }}
        isOpen={modalOpenState}
        onClose={() => {
          setModalOpenState(false);
        }}
        autoFocus={false}
      >
        <ModalOverlay backdropFilter="auto" backdropBlur="8px" />

        <ModalContent
          bg="black"
          minHeight={{
            md: "500px",
            large: "500px",
          }}
        >
          <Flex
            position="sticky"
            top="0"
            px={6}
            align="center"
            justify="space-between"
            height="50px"
            bg="black"
          >
            <Flex textColor="white" fontSize="17pt" fontWeight="700" gap={2}>
              Data Analysis Preferences
            </Flex>
            <Icon
              as={AiOutlineClose}
              color="white"
              fontSize="15pt"
              cursor="pointer"
              onClick={() => {
                setModalOpenState(false);
              }}
            />
          </Flex>
          <ModalBody>
            <Spinner
              width="50px"
              height="50px"
              color="white"
              hidden={!getLoading}
            />

            <Flex direction="column" gap="20px" hidden={getLoading}>
              <Text
                id="disclaimer"
                color="gray.300"
                fontSize="10pt"
                fontWeight="600"
              >
                Your privacy matters here. Choose what information you share
                with us, understanding exactly how it's used to improve your
                experience. Your trust and choices are our top priority.
              </Text>
              <Flex direction="column" gap="15px">
                <Flex gap="5px" direction="column">
                  <Text color="gray.500" fontSize="10pt" fontWeight="600">
                    Like Analysis
                  </Text>
                  <Text color="yellow.600" fontSize="8pt" fontWeight="600">
                    Your likes are collected for record-keeping, even if you opt
                    not to share them. However, this data remains private and is
                    neither shared nor analyzed.
                  </Text>
                  <Switch
                    name="likeAnalysis"
                    colorScheme="blue"
                    size="sm"
                    onChange={(e) => handleSwitchChange(e)}
                    isChecked={dataAnalysisPreferencesState.likeAnalysis}
                  />
                </Flex>
                <Flex gap="5px" direction="column">
                  <Text color="gray.500" fontSize="10pt" fontWeight="600">
                    Comment Analysis
                  </Text>
                  <Text color="yellow.600" fontSize="8pt" fontWeight="600">
                    Your comments are collected for record-keeping, even if you
                    opt not to share them. However, this data remains private
                    and is neither shared nor analyzed.
                  </Text>
                  <Switch
                    name="commentAnalysis"
                    colorScheme="blue"
                    size="sm"
                    onChange={(e) => handleSwitchChange(e)}
                    isChecked={dataAnalysisPreferencesState.commentAnalysis}
                  />
                </Flex>
              </Flex>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              colorScheme="blue"
              mr="3"
              onClick={() => {
                setModalOpenState(false);
              }}
              isDisabled={saveLoading}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => {
                handleSaveButton();
              }}
              isLoading={saveLoading}
              isDisabled={
                originalDataAnalysisPreferencesState.likeAnalysis ===
                  dataAnalysisPreferencesState.likeAnalysis &&
                originalDataAnalysisPreferencesState.commentAnalysis ===
                  dataAnalysisPreferencesState.commentAnalysis
              }
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
