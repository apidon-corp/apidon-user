import ProviderCardItem from "@/components/Items/Provider/ProviderCardItem";
import ProviderScoreStarItem from "@/components/Items/Provider/ProviderScoreStarItem";
import ProviderUserStarRateItem from "@/components/Items/Provider/ProviderUserStarRateItem";
import { currentUserStateAtom } from "@/components/atoms/currentUserAtom";
import { providerModalStateAtom } from "@/components/atoms/providerModalAtom";
import {
  ActiveProviderInformation,
  IProviderShowcaseItem,
  activeProviderInformationPlaceholder,
} from "@/components/types/User";
import { auth } from "@/firebase/clientApp";
import useWithdraw from "@/hooks/providerHooks/useWithdraw";
import {
  AspectRatio,
  Button,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { format } from "date-fns";
import { ethers } from "ethers";
import { useEffect, useRef, useState } from "react";
import { AiOutlineCheckCircle } from "react-icons/ai";
import { BiError } from "react-icons/bi";
import { BsCalendar4, BsCalendarCheckFill } from "react-icons/bs";
import { FaGift } from "react-icons/fa6";
import { useRecoilState, useSetRecoilState } from "recoil";

export default function ProviderModal() {
  const [modalViewState, setModalViewState] = useState<
    | "initialLoading"
    | "activeProvider"
    | "withdraw"
    | "withdrawing"
    | "skippingWithdraw"
    | "chooseProvider"
    | "choosingProvider"
    | "changeProviderLoading"
    | "changeProvider"
    | "changingProvider"
  >("initialLoading");

  const [activeProviderData, setActiveProviderData] =
    useState<ActiveProviderInformation>(activeProviderInformationPlaceholder);

  const [progressRate, setProgressRate] = useState(0);

  const [selectedProvider, setSelectedProvider] = useState("");
  const setCurrentUserState = useSetRecoilState(currentUserStateAtom);

  const [providerModalState, setProviderModalState] = useRecoilState(
    providerModalStateAtom
  );

  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [isWithdrawAddressValid, setIsWithdrawAddressValid] = useState(true);
  const withdrawAddressInputRef = useRef<HTMLInputElement>(null);
  const { withdraw } = useWithdraw();

  const [providerOptionsForChange, setProviderOptionsForChange] =
    useState<ActiveProviderInformation["providerOptions"]>(undefined);

  useEffect(() => {
    if (modalViewState === "initialLoading" && providerModalState.isOpen)
      getInitialProviderData();
  }, [providerModalState.isOpen, modalViewState]);

  useEffect(() => {
    if (providerModalState.isOpen) setModalViewState("initialLoading");
  }, [providerModalState.isOpen]);

  const getInitialProviderData = async () => {
    setModalViewState("initialLoading");

    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) {
      console.error("There is no auth object.");
      return setModalViewState("initialLoading");
    }

    let activeProviderInformation: ActiveProviderInformation;

    try {
      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch("/api/provider/getProviderInformation", {
        method: "POST",
        headers: {
          authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Response from getProviderInformation API is not okay: ${await response.text()}`
        );
      }

      const result = (await response.json()) as ActiveProviderInformation;

      activeProviderInformation = result;
    } catch (error) {
      console.error(
        "Error while getting providerInformation from getProviderInformation API: \n",
        error
      );
      return setModalViewState("initialLoading");
    }

    setActiveProviderData(activeProviderInformation);

    if (
      !activeProviderInformation.isThereActiveProvider &&
      activeProviderInformation.providerOptions !== undefined
    ) {
      setProviderModalState({ isOpen: true });
      return setModalViewState("chooseProvider");
    }

    if (
      !activeProviderInformation.isThereActiveProvider &&
      activeProviderInformation.providerOptions === undefined
    )
      return setModalViewState("initialLoading");

    if (!activeProviderInformation.providerData)
      return setModalViewState("initialLoading");

    if (!activeProviderInformation.providerData.dueDatePassed) {
      const startTime =
        activeProviderInformation.providerData.additionalProviderData.duration
          .startTime;
      const endTime =
        activeProviderInformation.providerData.additionalProviderData.duration
          .endTime;
      const currentTime = Date.now();
      const denominator = endTime - startTime;
      const nominator = currentTime - startTime;
      const ratio = denominator === 0 ? 0 : nominator / denominator;
      setProgressRate(ratio * 100);

      return setModalViewState("activeProvider");
    }

    if (
      activeProviderInformation.providerData.dueDatePassed &&
      activeProviderInformation.providerData.withdrawn
    ) {
      setProviderModalState({ isOpen: true });
      return setModalViewState("chooseProvider");
    }

    if (
      activeProviderInformation.providerData.dueDatePassed &&
      !activeProviderInformation.providerData.withdrawn
    ) {
      setProviderModalState({ isOpen: true });
      return setModalViewState("withdraw");
    }

    return setModalViewState("initialLoading");
  };

  const handleChooseProvider = async () => {
    setModalViewState("choosingProvider");

    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) {
      console.error("currentUsersAuthObject is null");
      return setModalViewState("initialLoading");
    }

    try {
      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch("/api/provider/chooseProvider", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          providerName: selectedProvider,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Response from 'chooseProvider' API is not okay: ${await response.text()}`
        );
      }

      // We need to close this modal.
      setModalViewState("initialLoading");
      setProviderModalState({ isOpen: false });
      setCurrentUserState((prev) => ({ ...prev, hasProvider: true }));
    } catch (error) {
      console.error("Error while choosing provider: \n", error);
      return setModalViewState("initialLoading");
    }
  };

  const handleWithdrawAddressChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const susAddress = event.target.value;
    if (susAddress.length === 0) {
      setIsWithdrawAddressValid(true);
      return setWithdrawAddress(susAddress);
    }
    const validationStatus = ethers.isAddress(susAddress);
    setIsWithdrawAddressValid(validationStatus);
    if (validationStatus) {
      if (withdrawAddressInputRef.current) {
        withdrawAddressInputRef.current.blur();
      }
    }
    if (validationStatus && !susAddress.startsWith("0x")) {
      return setWithdrawAddress(`0x${susAddress}`);
    }
    return setWithdrawAddress(susAddress);
  };

  const handleWithdrawButton = async () => {
    const withdrawAddressValidationStatus = ethers.isAddress(withdrawAddress);
    if (!withdrawAddressValidationStatus) {
      return setIsWithdrawAddressValid(false);
    }

    setModalViewState("withdrawing");

    await withdraw(withdrawAddress);

    setModalViewState("initialLoading");
  };

  const handleChangeYourProviderButton = async () => {
    // Set Loading Panel Active
    setModalViewState("changeProviderLoading");

    // Get Avaliable Provider Options and show it to user.
    try {
      const currentUserAuthObject = auth.currentUser;
      if (!currentUserAuthObject) {
        console.error("Current Auth Object is null or undefined");
        return setModalViewState("activeProvider");
      }

      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch(
        "/api/provider/getAvaliableProviderOptionsForChange",
        {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${idToken}`,
          },
          method: "POST",
        }
      );

      if (!response.ok) {
        console.error(
          "Response from 'getAvaliableProviderOptionsForChange' is not okay: ",
          await response.text()
        );
        return setModalViewState("activeProvider");
      }

      const result = await response.json();
      const providersShowcaseDatas =
        result.providersShowcaseDatas as IProviderShowcaseItem[];

      // Update States
      setProviderOptionsForChange(providersShowcaseDatas);
      return setModalViewState("changeProvider");
    } catch (error) {
      console.error("Error while getting provider options: \n", error);
      return setModalViewState("activeProvider");
    }
  };

  const handleChangeProvider = async () => {
    // Change state to "changeingProvider"
    setModalViewState("changingProvider");

    // Choose new provider backend.
    try {
      const currentUserAuthObject = auth.currentUser;
      if (!currentUserAuthObject) {
        console.error("Current Auth Object is null or undefined");
        return setModalViewState("changeProvider");
      }

      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch("/api/provider/changeProvider", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          providerName: selectedProvider,
        }),
      });

      if (!response.ok) {
        console.error(
          "Reponse from 'changeProvider' API is not okay: \n",
          await response.text()
        );
        return setModalViewState("changeProvider");
      }

      // Everthing alright
      // Refresh modal.
      return setModalViewState("initialLoading");
    } catch (error) {
      console.error("Error on fethcing to 'changeProvider' API: \n", error);
      return setModalViewState("changeProvider");
    }
  };

  const handleSkipForNowButton = async () => {
    setModalViewState("skippingWithdraw");
    // Make operations....

    try {
      const currentUserAuthObject = auth.currentUser;
      if (!currentUserAuthObject) {
        console.error("There is no auth object.");
        return setModalViewState("initialLoading");
      }

      const idtoken = await currentUserAuthObject.getIdToken();

      const response = await fetch("api/provider/skipWithdrawNow", {
        headers: {
          authorization: `Bearer ${idtoken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        console.error(
          "Error on fetching to 'skipWithdrawNow' API: \n",
          await response.text()
        );
        return setModalViewState("initialLoading");
      }

      // Everything alright
      return setModalViewState("initialLoading");
    } catch (error) {
      console.error("Error on fetching to 'skipWithdrawNow' API: \n", error);
      return setModalViewState("initialLoading");
    }
  };

  return (
    <Modal
      isOpen={providerModalState.isOpen}
      onClose={() => {
        if (
          !(
            modalViewState === "initialLoading" ||
            modalViewState === "chooseProvider" ||
            modalViewState === "choosingProvider" ||
            modalViewState === "withdraw" ||
            modalViewState === "withdrawing" ||
            modalViewState === "changeProviderLoading" ||
            modalViewState === "changingProvider" ||
            modalViewState === "skippingWithdraw"
          )
        )
          setProviderModalState({
            isOpen: false,
          });
      }}
      autoFocus={false}
      size={{
        base: "full",
        sm: "full",
        md: "lg",
        lg: "lg",
      }}
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="auto" backdropBlur="8px" />
      <ModalContent
        bg="black"
        minHeight={{
          md: "500px",
          lg: "500px",
        }}
      >
        {modalViewState === "initialLoading" && (
          <ModalHeader color="white">Provider</ModalHeader>
        )}
        {modalViewState === "activeProvider" && (
          <ModalHeader color="white">Active Provider</ModalHeader>
        )}
        {modalViewState === "chooseProvider" && (
          <ModalHeader color="white">Choose Provider</ModalHeader>
        )}
        {modalViewState === "choosingProvider" && (
          <ModalHeader color="white">Choose Provider</ModalHeader>
        )}

        {modalViewState === "withdraw" && (
          <ModalHeader color="white">Withdraw Reward</ModalHeader>
        )}
        {modalViewState === "withdrawing" && (
          <ModalHeader color="white">Withdraw Reward</ModalHeader>
        )}

        {modalViewState === "changeProviderLoading" && (
          <ModalHeader color="white">Change Your Provider</ModalHeader>
        )}
        {modalViewState === "changeProvider" && (
          <ModalHeader color="white">Change Your Provider</ModalHeader>
        )}
        {modalViewState === "changingProvider" && (
          <ModalHeader color="white">Change Your Provider</ModalHeader>
        )}

        {!(
          modalViewState === "initialLoading" ||
          modalViewState === "chooseProvider" ||
          modalViewState === "choosingProvider" ||
          modalViewState === "withdraw" ||
          modalViewState === "withdrawing" ||
          modalViewState === "changeProviderLoading" ||
          modalViewState === "changingProvider" ||
          modalViewState === "skippingWithdraw"
        ) && <ModalCloseButton color="white" />}

        <ModalBody display="flex">
          {modalViewState === "initialLoading" && (
            <Flex
              id="initial-loading-flex"
              width="100%"
              align="center"
              justify="center"
            >
              <Spinner width="75px" height="75px" color="white" />
            </Flex>
          )}
          {modalViewState === "activeProvider" && (
            <Flex
              id="activeProvider-flex"
              width="100%"
              direction="column"
              gap="5"
              pb={5}
            >
              <Flex id="active-provider-upper-part" width="100%" gap="2">
                <Flex
                  id="name-description-area"
                  direction="column"
                  width="60%"
                  gap="2"
                >
                  <Flex id="name" direction="column">
                    <Text color="gray.500" fontSize="10pt" fontWeight="600">
                      Name
                    </Text>
                    <Text color="white" fontSize="12pt" fontWeight="600">
                      {
                        activeProviderData.providerData?.additionalProviderData
                          .name
                      }
                    </Text>
                  </Flex>
                  <Flex id="description" direction="column">
                    <Text color="gray.500" fontSize="10pt" fontWeight="600">
                      Description
                    </Text>
                    <Text color="white" fontSize="12pt" fontWeight="600">
                      {
                        activeProviderData.providerData?.additionalProviderData
                          .description
                      }
                    </Text>
                  </Flex>
                  <Flex id="client-count" direction="column">
                    <Text color="gray.500" fontSize="10pt" fontWeight="600">
                      Client Count
                    </Text>
                    <Text color="white" fontSize="12pt" fontWeight="600">
                      {
                        activeProviderData.providerData?.additionalProviderData
                          .clientCount
                      }
                    </Text>
                  </Flex>
                </Flex>
                <Flex id="image-area" direction="column" width="30%" gap="2">
                  <AspectRatio ratio={1}>
                    <Image
                      src={
                        activeProviderData.providerData?.additionalProviderData
                          .image
                      }
                      fallbackSrc="/og.png"
                      borderRadius="10px"
                    />
                  </AspectRatio>
                </Flex>
              </Flex>
              <Flex id="active-provider-lower-part" direction="column" gap="5">
                <Flex id="rating-part" direction="column" gap="2">
                  <Flex id="providers score" direction="column" gap="1">
                    <Text color="gray.500" fontSize="10pt" fontWeight="600">
                      Score
                    </Text>

                    <ProviderScoreStarItem
                      value={
                        activeProviderData.providerData?.additionalProviderData
                          .score as number
                      }
                      fontSize="20pt"
                    />
                  </Flex>
                  <Flex id="client-score" direction="column" gap="1">
                    <Text color="gray.500" fontSize="10pt" fontWeight="600">
                      Your Score
                    </Text>
                    <ProviderUserStarRateItem
                      value={
                        activeProviderData.providerData?.additionalProviderData
                          .userScore as number
                      }
                      fontSize="20pt"
                    />
                  </Flex>
                </Flex>
                <Flex id="yield-part" direction="column">
                  <Text color="gray.500" fontSize="10pt" fontWeight="600">
                    Yield
                  </Text>
                  <Flex gap="1">
                    <Text color="white" fontSize="12pt" fontWeight="500">
                      {
                        activeProviderData.providerData?.additionalProviderData
                          .yield
                      }
                    </Text>
                    <Text color="white" fontSize="12pt" fontWeight="600">
                      ETH
                    </Text>
                  </Flex>
                </Flex>
                <Flex id="duration-part" direction="column" width="100%">
                  <Text color="gray.500" fontSize="10pt" fontWeight="600">
                    Duration
                  </Text>
                  <Flex align="center" gap="3" pl="0.5" width="100%">
                    <Flex direction="column" gap="1">
                      <Flex align="center" gap="1">
                        <Icon as={BsCalendar4} color="white" />
                        <Text fontSize="12pt" fontWeight="600" color="white">
                          {format(
                            new Date(
                              activeProviderData.providerData
                                ?.additionalProviderData.duration
                                .startTime as number
                            ),
                            "dd MMM yyyy"
                          )}
                        </Text>
                      </Flex>
                      <Flex align="center" gap="1">
                        <Icon as={BsCalendarCheckFill} color="white" />
                        <Text fontSize="12pt" fontWeight="600" color="white">
                          {format(
                            new Date(
                              activeProviderData.providerData
                                ?.additionalProviderData.duration
                                .endTime as number
                            ),
                            "dd MMM yyyy"
                          )}
                        </Text>
                      </Flex>
                    </Flex>
                    <Flex>
                      <CircularProgress
                        value={progressRate}
                        color={
                          progressRate <= 25
                            ? "red"
                            : progressRate <= 50
                            ? "yellow"
                            : progressRate <= 75
                            ? "blue"
                            : "green"
                        }
                        size="59px"
                      >
                        <CircularProgressLabel color="white" fontWeight="600">
                          {progressRate.toString().split(".")[0]}%
                        </CircularProgressLabel>
                      </CircularProgress>
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
              <Flex id="change-provider-button" align="center" justify="center">
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  onClick={handleChangeYourProviderButton}
                >
                  Change Your Provider
                </Button>
              </Flex>
            </Flex>
          )}
          {modalViewState === "chooseProvider" && (
            <Flex
              id="choose-provider-flex"
              width="100%"
              direction="column"
              gap="5"
            >
              {activeProviderData.providerOptions?.map((psi, i) => (
                <ProviderCardItem
                  key={i}
                  chooseIsDone={false}
                  clientCount={psi.clientCount}
                  description={psi.description}
                  image={psi.image}
                  name={psi.name}
                  offer={psi.offer}
                  score={psi.score}
                  selectedProviderValue={selectedProvider}
                  setSelectedProviderValue={setSelectedProvider}
                />
              ))}
              <Flex align="center" justify="center">
                <Button
                  variant="outline"
                  colorScheme="blue"
                  onClick={handleChooseProvider}
                  isLoading={false}
                  mb="5"
                  size="sm"
                  isDisabled={!selectedProvider}
                >
                  {selectedProvider
                    ? `Continue with ${selectedProvider}`
                    : "Please choose a provider"}
                </Button>
              </Flex>
            </Flex>
          )}
          {modalViewState === "choosingProvider" && (
            <Flex
              id="choosing-provider-flex"
              width="100%"
              align="center"
              justify="center"
              direction="column"
              gap="15px"
            >
              <Spinner width="75px" height="75px" color="pink" />
              <Text fontSize="10pt" fontWeight="600" color="gray.500">
                Provider is being integrated.
              </Text>
            </Flex>
          )}
          {modalViewState === "withdraw" && (
            <Flex
              id="withdraw-flex"
              width="100%"
              direction="column"
              justify="center"
              align="center"
              gap="24px"
              p="10"
            >
              <Flex align="center" justify="center" direction="column">
                <Flex
                  align="center"
                  justify="center"
                  gap="24px"
                  direction="column"
                >
                  <Icon as={FaGift} color="white" fontSize="75pt" />
                  <Text
                    color="white"
                    fontSize="10pt"
                    textAlign="center"
                    fontWeight="600"
                  >
                    You&apos;ve earned a reward for contributing your valuable
                    data to the Apidon system. We highly appreciate your
                    participation and want to make sure you get what you
                    deserve.
                  </Text>
                  <Text
                    color="yellow.500"
                    fontSize="10pt"
                    textAlign="center"
                    fontWeight="600"
                  >
                    Once you withdraw your reward, you&apos;ll need to select a
                    new provider to keep enjoying the benefits of data
                    contribution.
                  </Text>

                  <Flex gap="5px" align="center" justify="center">
                    <Text color="gray.500" fontSize="10pt" fontWeight="600">
                      Reward:
                    </Text>
                    <Text color="white" fontSize="12pt" fontWeight="600">
                      {
                        activeProviderData.providerData?.additionalProviderData
                          .yield
                      }{" "}
                      ETH
                    </Text>
                  </Flex>
                </Flex>
              </Flex>

              <Flex direction="column" width="100%" gap="5px">
                <InputGroup>
                  <FormControl variant="floating">
                    <Input
                      ref={withdrawAddressInputRef}
                      required
                      name="withdraw_address"
                      placeholder=" "
                      mb={2}
                      pr={"9"}
                      onChange={handleWithdrawAddressChange}
                      value={withdrawAddress}
                      _hover={{
                        border: "1px solid",
                        borderColor: "blue.500",
                      }}
                      textColor="white"
                      bg="black"
                      spellCheck={false}
                      isRequired
                      fontSize="10pt"
                    />
                    <FormLabel
                      bg="rgba(0,0,0)"
                      textColor="gray.500"
                      fontSize="12pt"
                      my={2}
                    >
                      Web3 Wallet Address
                    </FormLabel>
                  </FormControl>
                  <InputRightElement hidden={withdrawAddress.length === 0}>
                    {!isWithdrawAddressValid ? (
                      <Icon as={BiError} fontSize="20px" color="red" />
                    ) : (
                      <Icon
                        as={AiOutlineCheckCircle}
                        fontSize="20px"
                        color="green"
                      />
                    )}
                  </InputRightElement>
                </InputGroup>
                <Flex align="center" justify="center">
                  <Button
                    variant="outline"
                    type="submit"
                    colorScheme="blue"
                    size="sm"
                    isDisabled={!isWithdrawAddressValid || !withdrawAddress}
                    onClick={handleWithdrawButton}
                  >
                    Get Your Reward!
                  </Button>
                </Flex>
              </Flex>
              <Flex align="center" justify="center">
                <Button
                  variant="outline"
                  type="submit"
                  colorScheme="yellow"
                  size="sm"
                  onClick={handleSkipForNowButton}
                >
                  Skip For Now
                </Button>
              </Flex>
            </Flex>
          )}
          {modalViewState === "withdrawing" && (
            <Flex
              id="withdrawing-flex"
              width="100%"
              align="center"
              justify="center"
              direction="column"
              gap="15px"
            >
              <Spinner width="75px" height="75px" color="green.500" />
              <Text fontSize="10pt" fontWeight="600" color="gray.500">
                Reward is being withdrawn.
              </Text>
            </Flex>
          )}
          {modalViewState === "skippingWithdraw" && (
            <Flex
              id="skipping-flex"
              width="100%"
              align="center"
              justify="center"
              direction="column"
              gap="15px"
            >
              <Spinner width="75px" height="75px" color="yellow.500" />
              <Text fontSize="10pt" fontWeight="600" color="gray.500">
                You can still withdraw your reward at a later time.
              </Text>
            </Flex>
          )}
          {modalViewState === "changeProviderLoading" && (
            <Flex
              id="changeProviderLoading-flex"
              width="100%"
              align="center"
              justify="center"
            >
              <Spinner width="75px" height="75px" color="white" />
            </Flex>
          )}
          {modalViewState === "changeProvider" && (
            <Flex
              id="change-provider-flex"
              width="100%"
              gap="5"
              direction="column"
            >
              {providerOptionsForChange?.map((psi, i) => (
                <ProviderCardItem
                  key={i}
                  chooseIsDone={false}
                  clientCount={psi.clientCount}
                  description={psi.description}
                  image={psi.image}
                  name={psi.name}
                  offer={psi.offer}
                  score={psi.score}
                  selectedProviderValue={selectedProvider}
                  setSelectedProviderValue={setSelectedProvider}
                />
              ))}
              <Flex align="center" justify="center">
                <Button
                  variant="outline"
                  colorScheme="blue"
                  onClick={handleChangeProvider}
                  isLoading={false}
                  mb="5"
                  size="sm"
                  isDisabled={
                    !selectedProvider ||
                    selectedProvider ===
                      activeProviderData.providerData?.additionalProviderData
                        .name
                  }
                >
                  {selectedProvider ===
                  activeProviderData.providerData?.additionalProviderData.name
                    ? `You are already using ${selectedProvider}`
                    : selectedProvider
                    ? `Continue with ${selectedProvider}`
                    : "Please choose a provider"}
                </Button>
              </Flex>
            </Flex>
          )}
          {modalViewState === "changingProvider" && (
            <Flex
              id="changeProviderLoading-flex"
              width="100%"
              align="center"
              justify="center"
            >
              <Spinner width="75px" height="75px" color="white" />
            </Flex>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
