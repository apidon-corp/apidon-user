import { verificationModalAtom } from "@/components/atoms/verificationModalAtom";
import { auth } from "@/firebase/clientApp";
import {
  Button,
  Flex,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
} from "@chakra-ui/react";
import React, { ChangeEvent, createRef, useEffect, useState } from "react";
import { useRecoilState } from "recoil";

export default function VerifyModal() {
  const [modalViewState, setModalViewState] = useState<
    "enterVerificationCode" | "loading"
  >("loading");

  const templateArray = [0, 0, 0, 0, 0, 0];
  const [verificationCodeInputRefs, setVerificationCodeInputRefs] = useState<
    Array<React.RefObject<HTMLInputElement>>
  >([]);
  const [verificationCode, setVerificationCode] = useState(
    new Array(6).fill("")
  );
  const [verificationCodeError, setVerificationCodeError] = useState("");

  const [verificationModalState, setVerificationModalState] = useRecoilState(
    verificationModalAtom
  );

  /**
   * To create, multiple input element.
   */
  useEffect(() => {
    setVerificationCodeInputRefs((ref) =>
      Array(templateArray.length)
        .fill("0")
        .map((_, i) => verificationCodeInputRefs[i] || createRef())
    );
  }, [templateArray.length]);

  /**
   * To send verification code initially.
   */
  useEffect(() => {
    if (verificationModalState.isOpen) handleInitialLoading();
  }, []);

  const handleVerificationCodeChange = (
    event: ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const input = event.target.value;

    setVerificationCodeError("");

    if (input !== "") {
      const verificationCodeRegex = /^[0-9]$/;
      const regexTestResult = verificationCodeRegex.test(input);
      if (!regexTestResult) {
        return;
      }
    }

    const newCode = [...verificationCode];
    newCode[index] = input;

    setVerificationCode(newCode);

    // Focusing to the next.
    if (input !== "" && index < templateArray.length - 1) {
      setTimeout(() => {
        if (
          verificationCodeInputRefs[index + 1] &&
          verificationCodeInputRefs[index + 1].current
        )
          verificationCodeInputRefs[index + 1].current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && index > 0 && verificationCode[index] === "") {
      setTimeout(() => {
        if (
          verificationCodeInputRefs[index - 1] &&
          verificationCodeInputRefs[index - 1].current
        )
          verificationCodeInputRefs[index - 1].current?.focus();
      }, 0);
    }
  };

  const handleInitialLoading = async () => {
    /**
     * Sends verification email.
     * Opens enter verification code screen.
     */

    try {
      const currentUserAuthObject = auth.currentUser;

      if (!currentUserAuthObject)
        throw new Error("Auth object of user is null");
      const idToken = await currentUserAuthObject.getIdToken(true);

      const response = await fetch(
        "/api/user/authentication/login/sendVerificationCode",
        {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${idToken}`,
          },
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Response from 'sendVerificationCode' API is not okay: ${await response.text()}`
        );
      }

      // Everything is alright.
      setModalViewState("enterVerificationCode");
      return;
    } catch (error) {
      console.error(
        "Error on fetching to 'sendVerificationCode' API: \n",
        error
      );
      return setModalViewState("loading");
    }
  };

  const handleVerifyButton = async () => {
    // Open loading screen.
    setModalViewState("loading");

    // Check code If it is valid.
    const code = verificationCode.join("");
    const verificationCodeRegex = /^\d{6}$/;
    const regexTestResult = verificationCodeRegex.test(code);

    if (!regexTestResult) {
      console.error("Code is not valid.");
      return setModalViewState("enterVerificationCode");
    }

    // Verify Code
    try {
      const currentUserAuthObject = auth.currentUser;
      if (!currentUserAuthObject)
        throw new Error("Auth object of user is null");
      const idToken = await currentUserAuthObject.getIdToken(true);

      const response = await fetch(
        "/api/user/authentication/login/checkVerificationCode",
        {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${idToken}`,
          },
          method: "POST",
          body: JSON.stringify({
            verificationCode: code,
          }),
        }
      );

      if (!response.ok) {
        console.error(
          "Response forom checkVerificationCode API is not okay: \n",
          await response.text()
        );

        setVerificationCodeError("Invalid verification code.");
        return setModalViewState("enterVerificationCode");
      }

      // Everything is alright.
    } catch (error) {
      console.error(
        "Error while fethcing to 'checkVerificationCode' API: \n",
        error
      );
      setVerificationCodeError("Verification code is invalid.");
      return setModalViewState("enterVerificationCode");
    }

    // Close this window
    return setVerificationModalState({ isOpen: false });
  };

  return (
    <Modal
      isOpen={verificationModalState.isOpen}
      onClose={() => {}}
      size={{
        base: "full",
        sm: "full",
        md: "lg",
        lg: "lg",
      }}
      scrollBehavior="inside"
      allowPinchZoom={true}
    >
      <ModalOverlay backdropFilter="auto" backdropBlur="10px" />
      <ModalContent
        bg="black"
        minHeight={{
          md: "500px",
          lg: "500px",
        }}
      >
        <ModalHeader color="white">Verify Email</ModalHeader>

        <ModalBody display="flex">
          {modalViewState === "loading" && (
            <Flex
              id="loading-flex"
              width="100%"
              direction="column"
              justify="center"
              align="center"
            >
              <Spinner width="75px" height="75px" color="white" />
            </Flex>
          )}

          {modalViewState === "enterVerificationCode" && (
            <Flex
              id="verification-code-flex"
              width="100%"
              direction="column"
              justify="center"
              align="center"
            >
              <Flex
                id="enterEmailVerificationCode"
                width="100%"
                align="center"
                justify="center"
                direction="column"
                gap="20px"
              >
                <Image src="/og.png" width="20%" />
                <Flex
                  id="verification-code-desc"
                  direction="column"
                  align="center"
                  justify="center"
                  gap="5px"
                >
                  <Text color="white" fontWeight="600" fontSize="20pt">
                    Verify Your Account
                  </Text>
                  <Text
                    color="gray.500"
                    fontWeight="600"
                    fontSize="10pt"
                    textAlign="center"
                  >
                    To continue, please enter your verification code. We&apos;ve
                    sent it to{" "}
                    <span
                      style={{
                        color: "#3182CE",
                        fontSize: "10pt",
                        textAlign: "center",
                      }}
                    >
                      {auth.currentUser?.email}
                    </span>
                  </Text>
                </Flex>

                <Flex
                  id="verification-code-input-error"
                  direction="column"
                  width="100%"
                  align="center"
                  justify="center"
                  gap="20px"
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleVerifyButton();
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px",
                    }}
                  >
                    <Flex
                      id="digit-inputs"
                      width="100%"
                      align="center"
                      justify="space-between"
                    >
                      {templateArray.map((_, i) => (
                        <Input
                          key={i}
                          ref={verificationCodeInputRefs[i]}
                          color="white"
                          width="50px"
                          height="50px"
                          rounded="full"
                          textAlign="center"
                          fontSize="25px"
                          fontWeight="700"
                          value={verificationCode[i]}
                          onChange={(e) => {
                            handleVerificationCodeChange(e, i);
                          }}
                          onKeyDown={(e) => {
                            handleKeyDown(e, i);
                          }}
                        />
                      ))}
                    </Flex>

                    <Flex id="verification-code-error-message" justify="center">
                      <Text
                        color="red"
                        fontSize="10pt"
                        fontWeight="400"
                        textAlign="center"
                      >
                        {verificationCodeError}
                      </Text>
                    </Flex>
                    <Flex id="verify-button" justify="center">
                      <Button
                        bg="white"
                        color="black"
                        border="1px solid white"
                        _hover={{
                          bg: "black",
                          color: "white",
                          border: "1px solid white",
                        }}
                        _focus={{
                          bg: "#343434",
                          color: "white",
                          border: "1px solid #343434",
                        }}
                        isDisabled={!/^\d{6}$/.test(verificationCode.join(""))}
                        type="submit"
                      >
                        Verify
                      </Button>
                    </Flex>
                  </form>
                </Flex>
              </Flex>
            </Flex>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
