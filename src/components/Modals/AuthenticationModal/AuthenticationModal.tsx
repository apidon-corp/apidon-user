import { authModalStateAtom } from "@/components/atoms/authModalAtom";
import useLogin from "@/hooks/authHooks/useLogin";
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
import { ChangeEvent, useRef, useState } from "react";
import { BiError } from "react-icons/bi";
import { useRecoilState } from "recoil";

export default function AuthenticationModal() {
  const [modalViewState, setModalViewState] = useState<
    "loginEU" | "verifyingEU" | "loginPassword" | "verifyingPassword"
  >("loginEU");

  //EU => Email-Username
  const [loginType, setLoginType] = useState<"email" | "username" | "initial">(
    "initial"
  );
  const loginEUInputRef = useRef<HTMLInputElement>(null);
  const [eu, setEu] = useState("");
  const [euValid, setEuValid] = useState(false);
  const [euError, setEuError] = useState("");
  const [euRequesterUsername, setEuRequesterUsername] = useState("");

  const loginPasswordInputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  /**
   * E-Mail that will be used for logging in.
   * For both username and email logins, we are using email of user.
   * Email information comes from our API's when user enters its username.
   */
  const [email, setEmail] = useState("");

  const { logUserIn } = useLogin();

  const [authenticationModalState, setAuthenticationModalState] =
    useRecoilState(authModalStateAtom);

  const handleEUChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;

    // Clear error text
    setEuError("");

    // Empty
    if (input.length === 0) {
      setLoginType("initial");
      setEu(input);
      setEuValid(false);
      return;
    }

    // Help to users for 'lowercasering'
    if (input !== input.toLowerCase()) {
      if (loginEUInputRef.current) {
        loginEUInputRef.current.value = input.toLowerCase();
      }
      setEu(input.toLowerCase());
      return;
    }

    // Email
    if (input.includes("@")) {
      // Change Login Type
      setLoginType("email");

      // spell-check
      const emailRegex =
        /^[A-Za-z0-9._%+-]+@(gmail|yahoo|outlook|aol|icloud|protonmail|yandex|mail|zoho)\.(com|net|org)$/i;
      const regexTestResult = emailRegex.test(input);
      setEuValid(regexTestResult);

      // update-other-states
      setEu(input);

      return;
    }

    // Username (at least to '@' sign)(there is no bad threat as usernames emails to '@' sign.)
    if (!input.includes("@")) {
      // Change Login Type
      setLoginType("username");

      // spell-check
      const usernameRegex = /^[a-z0-9]{4,20}$/;
      const regexTestResult = usernameRegex.test(input);
      setEuValid(regexTestResult);

      // update-other-state
      setEu(input);

      return;
    }
  };

  const handleContinueButtonOnLogin = async () => {
    setModalViewState("verifyingEU");

    // We need to check If there is an account linked with this email or username.
    try {
      const response = await fetch(
        "/api/user/authentication/login/checkIsThereLinkedAccount",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: "",
          },
          body: JSON.stringify({
            eu: eu.toString(),
          }),
        }
      );

      if (!response.ok) {
        // Set Error Messages
        const errorMessage = await response.text();
        setEuError(errorMessage);
        setEuValid(false);
        // Return back to loginEU page.
        setModalViewState("loginEU");

        // Focus again to eu input
        setTimeout(() => {
          if (loginEUInputRef.current) loginEUInputRef.current.focus();
        }, 0);

        return;
      }

      const { username, email: emailFetched } = await response.json();
      setEuRequesterUsername(username);
      setEmail(emailFetched);

      // Open the password page
      setModalViewState("loginPassword");

      // Focusing password input
      setTimeout(() => {
        if (loginPasswordInputRef.current)
          loginPasswordInputRef.current.focus();
      }, 0);

      return;
    } catch (error) {
      console.error(
        "Error on fetching to 'checkIsThereLinkedAccount' API: \n",
        error
      );
      // Set Error Messages
      setEuError("Unknown error happened.");
      setEuValid(false);
      // Return back to loginEU page.
      setModalViewState("loginEU");

      // Focus again to login input
      setTimeout(() => {
        if (loginEUInputRef.current) {
          loginEUInputRef.current.focus();
        }
      }, 0);

      return;
    }
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;

    // State Update
    setPassword(input);

    // Reset Error
    setPasswordError("");
  };

  const handleLoginButton = async () => {
    // Open, verifyingPassword page.
    setModalViewState("verifyingPassword");

    // If password is empty
    if (!password) {
      setPasswordError("Please provide a valid password.");
      setModalViewState("loginPassword");
      setTimeout(() => {
        if (loginPasswordInputRef.current) {
          loginPasswordInputRef.current.focus();
        }
      }, 0);
      return;
    }

    if (!email) {
      setPasswordError("Please provide a valid credantials.");
      setModalViewState("loginEU");
      setTimeout(() => {
        if (loginEUInputRef.current) {
          loginEUInputRef.current.focus();
        }
      }, 0);
      return;
    }

    const loginOperationResult = await logUserIn(email, password);

    if (!loginOperationResult) {
      setPasswordError("Incorrect password.");
      setModalViewState("loginPassword");
      setTimeout(() => {
        if (loginPasswordInputRef.current) {
          loginPasswordInputRef.current.focus();
        }
      }, 0);
      return;
    }

    // We logged in successfully, now other operations are managed by layout file.

    // Close this panel. And reset variables.
    setModalViewState("loginEU");
  };

  return (
    <Modal
      isOpen={authenticationModalState.open}
      onClose={() => {
        if (
          !(
            modalViewState === "verifyingEU" ||
            modalViewState === "verifyingPassword"
          )
        ) {
          setAuthenticationModalState((prev) => ({ ...prev, open: false }));
        }
      }}
      initialFocusRef={loginEUInputRef}
      size={{
        base: "full",
        sm: "full",
        md: "lg",
        lg: "lg",
      }}
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="auto" backdropBlur="10px" />
      <ModalContent
        bg="black"
        minHeight={{
          md: "500px",
          lg: "500px",
        }}
      >
        <ModalHeader color="white">Login</ModalHeader>

        {!(
          modalViewState === "verifyingEU" ||
          modalViewState === "verifyingPassword"
        ) && <ModalCloseButton color="white" />}

        <ModalBody display="flex">
          {modalViewState === "loginEU" && (
            <Flex
              id="login-flex"
              width="100%"
              align="center"
              justify="center"
              direction="column"
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
                  Welcome back to Apidon!
                </Text>
                <Text
                  color="gray.500"
                  fontWeight="600"
                  fontSize="10pt"
                  textAlign="center"
                >
                  To continue, please enter your email address or username.
                  You'll be prompted for your password on the next screen.
                </Text>
              </Flex>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleContinueButtonOnLogin();
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
                        ref={loginEUInputRef}
                        required
                        name="EU"
                        placeholder=" "
                        mb={2}
                        pr={"9"}
                        onChange={handleEUChange}
                        value={eu}
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
                        {loginType === "email"
                          ? "Email"
                          : loginType === "username"
                          ? "Username"
                          : "Email or Username"}
                      </FormLabel>
                    </FormControl>
                    <InputRightElement hidden={eu.length === 0}>
                      {!euValid && (
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
                      {euError}
                    </Text>
                  </Flex>
                </Flex>

                <Flex id="login-contuniue-button" justify="center">
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
                    isDisabled={!euValid}
                    type="submit"
                  >
                    Continue
                  </Button>
                </Flex>
              </form>
            </Flex>
          )}
          {modalViewState === "verifyingEU" && (
            <Flex
              id="verifyingEU-flex"
              width="100%"
              align="center"
              justify="center"
            >
              <Spinner width="75px" height="75px" color="white" />
            </Flex>
          )}
          {modalViewState === "loginPassword" && (
            <Flex
              id="loginPassword-flex"
              width="100%"
              align="center"
              justify="center"
              direction="column"
              gap="20px"
            >
              <Image src="/og.png" width="20%" />
              <Flex
                id="login-password-desc"
                direction="column"
                align="center"
                justify="center"
                gap="5px"
              >
                <Flex id="welcoming" gap="1" align="center" justify="center">
                  <Text
                    color="white"
                    fontWeight="500"
                    fontSize="20pt"
                    textAlign="center"
                  >
                    Hello again
                  </Text>

                  <Text
                    color="cyan.500"
                    fontWeight="500"
                    fontSize="20pt"
                    textAlign="center"
                  >
                    {euRequesterUsername}
                  </Text>
                  <Text
                    color="white"
                    fontWeight="500"
                    fontSize="20pt"
                    textAlign="center"
                  >
                    !
                  </Text>
                </Flex>

                <Text
                  color="gray.500"
                  fontWeight="600"
                  fontSize="10pt"
                  textAlign="center"
                >
                  Now, to securely access your Apidon account, please enter your
                  password.
                </Text>
              </Flex>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLoginButton();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <Flex
                  id="login-password-input-and-error"
                  direction="column"
                  width="100%"
                  align="center"
                  justify="center"
                >
                  <InputGroup>
                    <FormControl variant="floating">
                      <Input
                        ref={loginPasswordInputRef}
                        name="loginPassword"
                        placeholder=" "
                        mb={2}
                        pr={"9"}
                        onChange={handlePasswordChange}
                        value={password}
                        _hover={{
                          border: "1px solid",
                          borderColor: "blue.500",
                        }}
                        fontSize="16px"
                        textColor="white"
                        bg="black"
                        spellCheck={false}
                        isRequired
                        type="password"
                      />
                      <FormLabel
                        bg="rgba(0,0,0)"
                        textColor="gray.500"
                        fontSize="12pt"
                        my={2}
                      >
                        Password
                      </FormLabel>
                    </FormControl>
                    <InputRightElement hidden={password.length === 0}>
                      {passwordError && (
                        <Icon as={BiError} fontSize="20px" color="red" />
                      )}
                    </InputRightElement>
                  </InputGroup>
                  <Flex id="login-password-error-message">
                    <Text
                      color="red"
                      fontSize="10pt"
                      fontWeight="400"
                      textAlign="center"
                    >
                      {passwordError}
                    </Text>
                  </Flex>
                </Flex>

                <Flex id="login-password-login-button" justify="center">
                  <Button
                    variant="solid"
                    isDisabled={passwordError.length !== 0}
                    type="submit"
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
                  >
                    Log In
                  </Button>
                </Flex>
              </form>
            </Flex>
          )}
          {modalViewState === "verifyingPassword" && (
            <Flex
              id="verifying-password-flex"
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
