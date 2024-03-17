import { tradedNFTsModalAtom } from "@/components/atoms/tradedNFTsModalAtom";
import {
  BoughtNFTsArrayObject,
  SoldNFTsArrayObject,
} from "@/components/types/NFT";
import { auth } from "@/firebase/clientApp";
import useGetFirebase from "@/hooks/readHooks/useGetFirebase";
import {
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";

export default function TradedNFTsModal() {
  const [boughtNFTsArrayState, setBoughtNFTsArrayState] = useState<
    BoughtNFTsArrayObject[]
  >([]);
  const [soldNFTsArrayState, setSoldNFTsArrayState] = useState<
    SoldNFTsArrayObject[]
  >([]);

  const { getDocServer } = useGetFirebase();

  const [modalOpenState, setModalOpenState] =
    useRecoilState(tradedNFTsModalAtom);

  const [modalStatusState, setModalStatusState] = useState<
    "initalLoading" | "showContent"
  >("initalLoading");

  useEffect(() => {
    if (!modalOpenState.isOpen) return;
    handleInitialFetching();
  }, [modalOpenState]);

  const handleInitialFetching = async () => {
    setModalStatusState("initalLoading");

    if (!auth.currentUser) {
      console.error("There is no user in auth object.");
      return setModalStatusState("initalLoading");
    }

    const tradedDocResult = await getDocServer(
      `users/${auth.currentUser.displayName}/nftTrade/nftTrade`
    );

    if (!tradedDocResult || !tradedDocResult.isExists) {
      console.warn("Traded Doc Result is not okay or document doesnt exists");
      return setModalStatusState("initalLoading");
    }

    setBoughtNFTsArrayState(tradedDocResult.data.boughtNFTs);
    setSoldNFTsArrayState(tradedDocResult.data.soldNFTs);

    console.log(tradedDocResult.data);

    setModalStatusState("showContent");
  };

  return (
    <Modal
      id="TradedNFtsModal"
      size={{
        base: "full",
        sm: "full",
        md: "md",
        lg: "md",
      }}
      isOpen={modalOpenState.isOpen}
      autoFocus={false}
      onClose={() => {
        setModalOpenState({ isOpen: false });
      }}
    >
      <ModalOverlay backdropFilter="auto" backdropBlur="8px" />

      <ModalContent
        bg="black"
        minHeight={{
          md: "500px",
          lg: "500px",
        }}
      >
        <ModalHeader color="white">Traded NFTs</ModalHeader>

        {modalStatusState === "showContent" && (
          <ModalCloseButton color="white" />
        )}

        <ModalBody>
          {modalStatusState === "initalLoading" && (
            <Flex
              id="spinner-loading-flex"
              width="100%"
              align="center"
              justify="center"
            >
              <Spinner color="white" width="75px" height="75px" />
            </Flex>
          )}

          {modalStatusState === "showContent" && (
            <Flex
              id="traded-nfts-main-flex"
              direction="column"
              width="100%"
              gap="10px"
            >
              <Flex id="sold-nfts" direction="column" gap="2px">
                <Text color="white" fontSize="15pt">
                  Sold NFTs
                </Text>
                {soldNFTsArrayState.length === 0 && (
                  <Text color="white" fontSize="10pt">
                    When you sell an NFT, it will show in here.
                  </Text>
                )}
                {soldNFTsArrayState.length !== 0 &&
                  soldNFTsArrayState.map((a, i) => (
                    <a
                      href={`http://localhost:3001/${a.postDocPath
                        .split("/")
                        .slice(-3)
                        .join("/")}`}
                      key={i}
                    >
                      <Text key={i} fontSize="10pt" color="yellow">
                        {a.postDocPath}
                      </Text>
                    </a>
                  ))}
              </Flex>
              <Flex id="bought-nfts" direction="column" gap="2px">
                <Text color="white" fontSize="15pt">
                  Bought NFTs
                </Text>
                {boughtNFTsArrayState.length === 0 && (
                  <Text color="white" fontSize="10pt">
                    When you buy an NFT, it will show in here.
                  </Text>
                )}
                {boughtNFTsArrayState.length !== 0 &&
                  boughtNFTsArrayState.map((a, i) => (
                    <a
                      href={`http://localhost:3001/${a.postDocPath
                        .split("/")
                        .slice(-3)
                        .join("/")}`}
                      key={i}
                    >
                      <Text key={i} fontSize="10pt" color="yellow">
                        {a.postDocPath}
                      </Text>
                    </a>
                  ))}
              </Flex>
            </Flex>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
