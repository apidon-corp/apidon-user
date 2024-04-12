import { authModalStateAtom } from "@/components/atoms/authModalAtom";
import { auth } from "@/firebase/clientApp";
import {
  Button,
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
import { sendPasswordResetEmail } from "firebase/auth";
import { ChangeEvent, useRef, useState } from "react";
import { BiError } from "react-icons/bi";
import { useRecoilState } from "recoil";

export default function ResetPasswordModal() {
  const [modalViewState, setModalViewState] = useState<
    "email" | "sending" | "sent"
  >("email");

  const emailInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [authModalState, setAuthModalState] =
    useRecoilState(authModalStateAtom);

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmailError("");

    let input = event.target.value;

    // Help users lowercasing
    if (input !== input.toLowerCase()) {
      input = input.toLowerCase();
    }

    const emailRegex =
      /^[A-Za-z0-9._%+-]+@(gmail|yahoo|outlook|aol|icloud|protonmail|yandex|mail|zoho)\.(com|net|org)$/i;
    const regexTestResult = emailRegex.test(input);
    setIsEmailValid(regexTestResult);

    // Updating states
    setEmail(input);
  };

  const handleSendResetEmailButton = async () => {
    setModalViewState("sending");

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      // Error on sending.

      setIsEmailValid(false);
      setEmailError(error.message ? error.message : "Internal server error.");

      return setModalViewState("email");
    }

    // Successfully sent.
    return setModalViewState("sent");
  };

  return (
    <Modal
      isOpen={
        authModalState.open === true && authModalState.view === "resetPassword"
      }
      onClose={() => {
        if (modalViewState !== "sending")
          setAuthModalState({ view: "logIn", open: false });
      }}
      initialFocusRef={emailInputRef}
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
        <ModalHeader color="white">Reset</ModalHeader>

        {modalViewState !== "sending" && <ModalCloseButton color="white" />}

        <ModalBody display="flex">
          {modalViewState === "email" && (
            <Flex
              id="email-flex"
              width="100%"
              direction="column"
              align="center"
              justify="center"
              gap="20px"
            >
              <Image src="/og.png" width="20%" />
              <Flex
                id="login-desc"
                direction="column"
                align="center"
                justify="center"
                gap="5px"
              >
                <Text color="white" fontWeight="600" fontSize="20pt">
                  Forgot your password?
                </Text>
                <Text
                  color="gray.500"
                  fontWeight="600"
                  fontSize="10pt"
                  textAlign="center"
                >
                  Enter the email address for your Apidon account and we&apos;ll
                  send a password reset link.
                </Text>
              </Flex>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendResetEmailButton();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <Flex
                  id="login-input-and-error"
                  direction="column"
                  width="100%"
                  align="center"
                  justify="center"
                >
                  <InputGroup>
                    <FormControl variant="floating">
                      <Input
                        ref={emailInputRef}
                        required
                        name="EU"
                        placeholder=" "
                        mb={2}
                        pr={"9"}
                        onChange={handleEmailChange}
                        value={email}
                        _hover={{
                          border: "1px solid",
                          borderColor: "blue.500",
                        }}
                        textColor="white"
                        bg="black"
                        spellCheck={false}
                        isRequired
                        fontSize="16px"
                      />
                      <FormLabel
                        bg="rgba(0,0,0)"
                        textColor="gray.500"
                        fontSize="12pt"
                        my={2}
                      >
                        Email
                      </FormLabel>
                    </FormControl>
                    <InputRightElement hidden={email.length === 0}>
                      {!isEmailValid && (
                        <Icon as={BiError} fontSize="20px" color="red" />
                      )}
                    </InputRightElement>
                  </InputGroup>
                  <Flex id="login-error-message">
                    <Text
                      color="red"
                      fontSize="10pt"
                      fontWeight="400"
                      textAlign="center"
                    >
                      {emailError}
                    </Text>
                  </Flex>
                </Flex>

                <Flex id="reset-password-button" justify="center">
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
                    isDisabled={!isEmailValid}
                    type="submit"
                  >
                    Send Reset Email
                  </Button>
                </Flex>
              </form>
              <Flex
                id="remembered-your-password-flex"
                width="100%"
                align="center"
                justify="center"
              >
                <Text
                  color="blue.500"
                  fontSize="10pt"
                  as="b"
                  textDecor="underline"
                  cursor="pointer"
                  onClick={() => {
                    setAuthModalState({
                      open: true,
                      view: "logIn",
                    });
                  }}
                >
                  Remembered your password? Log In!
                </Text>
              </Flex>
            </Flex>
          )}
          {modalViewState === "sending" && (
            <Flex
              id="sending-flex"
              width="100%"
              align="center"
              justify="center"
            >
              <Spinner width="75px" height="75px" color="white" />
            </Flex>
          )}
          {modalViewState === "sent" && (
            <Flex
              id="sending-flex"
              width="100%"
              align="center"
              justify="center"
              direction="column"
              gap="20px"
            >
              <Image src="/og.png" width="20%" />
              <Flex
                id="sent-desc"
                direction="column"
                align="center"
                justify="center"
                gap="5px"
              >
                <Text color="white" fontWeight="600" fontSize="20pt">
                  Password Reset Link Sent
                </Text>
                <Text
                  color="gray.500"
                  fontWeight="600"
                  fontSize="10pt"
                  textAlign="center"
                >
                  A password reset link has been sent to your email address.
                  Follow the instructions there to regain access.
                </Text>
              </Flex>
              <Flex id="login-password-login-button" justify="center">
                <Button
                  variant="solid"
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
                  onClick={() => {
                    setAuthModalState({
                      view: "logIn",
                      open: true,
                    });
                  }}
                >
                  Log In
                </Button>
              </Flex>
            </Flex>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
