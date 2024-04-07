import { authModalStateAtom } from "@/components/atoms/authModalAtom";
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Text,
} from "@chakra-ui/react";

import React, { useRef, useState } from "react";

import { useSetRecoilState } from "recoil";

import { AiOutlineCheckCircle } from "react-icons/ai";
import { BiError, BiErrorCircle } from "react-icons/bi";

import {
  Countries,
  Genders,
  InitialSignUpForm,
  country_list,
  genders_list,
} from "@/components/types/User";
import useSignUp from "@/hooks/authHooks/useSignUp";
import useGetFirebase from "@/hooks/readHooks/useGetFirebase";
import ReCAPTCHA from "react-google-recaptcha";

export default function SignUp() {
  const age_input = useRef<HTMLInputElement>(null);
  const [age, setAge] = useState(18); // To fix negative integer problem.....

  const [signUpForm, setSignUpForm] = useState<InitialSignUpForm>({
    email: "",
    fullname: "",
    password: "",
    username: "",
    age: 18,
    gender: "male",
    country: "Turkey",
  });

  const setAuthModalState = useSetRecoilState(authModalStateAtom);

  const [userNameLowerCaseValue, setUsernameLowercaseValue] = useState("");

  const [userNameRight, setUserNameRight] = useState(true);

  const [passwordStrong, setPassordStrong] = useState(true);
  const [passwordStatus, setPasswordStatus] = useState({
    digit: false,
    lowercase: false,
    uppercase: false,
    eightCharacter: false,
    special: false,
  });

  const [fullnameRight, setFullnameRight] = useState(true);

  const [emailRight, setEmailRight] = useState(true);

  const [signUpLoading, setSignUpLoading] = useState(false);
  const [error, setError] = useState("");

  const captchaRef = useRef<ReCAPTCHA>(null);

  const { initiateSignUp } = useSignUp();

  const { getDocServer } = useGetFirebase();

  const handleCaptcha = async () => {
    if (!captchaRef.current) {
      return;
    }

    const token = captchaRef.current.getValue();
    captchaRef.current.reset();

    return token;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignUpLoading(true);
    setError("");

    console.log(signUpForm);

    const captchaToken = await handleCaptcha();

    if (!captchaToken) {
      setSignUpLoading(false);
      setError("Complete Captcha Please");
      return;
    }

    const emailRegex =
      /^[A-Za-z0-9._%+-]+@(gmail|yahoo|outlook|aol|icloud|protonmail|yandex|mail|zoho)\.(com|net|org)$/i;
    if (!emailRegex.test(signUpForm.email)) {
      setEmailRight(false);
      setSignUpLoading(false);
      setError("Email is invalid");
      return;
    }
    const fullnameRegex = /^[\p{L}_ ]{3,20}$/u;

    const consecutiveSpaceRegex = /\s\s/;
    if (
      !fullnameRegex.test(signUpForm.fullname) ||
      consecutiveSpaceRegex.test(signUpForm.fullname) ||
      signUpForm.fullname[signUpForm.fullname.length - 1] === " "
    ) {
      setFullnameRight(false);
      setSignUpLoading(false);
      setError("Fullname is invalid");
      return;
    }
    const usernameRegex = /^[a-z0-9]{4,20}$/;
    if (!usernameRegex.test(signUpForm.username)) {
      setUserNameRight(false);
      setSignUpLoading(false);
      setError("Username is invalid");
      return;
    }

    const passwordRegex =
      /^(?=.*?\p{Lu})(?=.*?\p{Ll})(?=.*?\d)(?=.*?[^\w\s]|[_]).{12,}$/u;
    if (!passwordRegex.test(signUpForm.password)) {
      setPassordStrong(false);
      setSignUpLoading(false);
      setError("Invalid Password");
      return;
    }

    if (typeof signUpForm.age !== "number") {
      setSignUpLoading(false);
      return setError("Invalid Age");
    }
    if (signUpForm.age < 0) return setError("Invalid Age");

    if (!genders_list.includes(signUpForm.gender)) {
      return setError("Invalid Gender");
    }

    if (!country_list.includes(signUpForm.country)) {
      return setError("Invalid Country");
    }

    const operationResult = await initiateSignUp(signUpForm, captchaToken);
    if (!operationResult) {
      setError("Error on Sign-Up.");
      console.error("Error while signing-up.");
      return setSignUpLoading(false);
    }
  };

  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    let zeroFlag = false;

    if (event.target.name === "email") {
      if (event.target.value.length === 0) {
        // To prevent bad ui
        setEmailRight(true);
        zeroFlag = true;
      }
      if (!zeroFlag) {
        const emailRegex =
          /^[A-Za-z0-9._%+-]+@(gmail|yahoo|outlook|aol|icloud|protonmail|yandex|mail|zoho)\.(com|net|org)$/i;

        if (!emailRegex.test(event.target.value)) {
          setEmailRight(false);
        } else {
          setEmailRight(true);
        }
      }
    }

    if (event.target.name === "username") {
      if (event.target.value.length === 0) {
        // To prevent bad ui
        setUserNameRight(true);
        setUsernameLowercaseValue("");

        zeroFlag = true;
      }

      if (!zeroFlag) {
        setUsernameLowercaseValue(event.target.value.toLowerCase());
        let regexFailFlag = false;
        const usernameRegex = /^[a-z0-9]{4,20}$/;

        if (!usernameRegex.test(event.target.value.toLowerCase())) {
          setUserNameRight(false);
          regexFailFlag = true;
        }
        if (!regexFailFlag) {
          setUserNameRight(true);
        }
      }
    }

    if (event.target.name === "fullname") {
      if (event.target.value.length === 0) {
        // To prevent bad ui
        setFullnameRight(true);
        zeroFlag = true;
      }

      if (!zeroFlag) {
        const fullnameRegex = /^[\p{L}_ ]{3,20}$/u;
        const consecutiveSpaceRegex = /\s\s/;
        if (
          !fullnameRegex.test(event.target.value) ||
          consecutiveSpaceRegex.test(event.target.value) ||
          event.target.value[event.target.value.length - 1] === " "
        ) {
          setFullnameRight(false);
        } else {
          setFullnameRight(true);
        }
      }
    }

    if (event.target.name === "password") {
      if (event.target.value.length === 0) {
        // To prevent bad ui
        setPassordStrong(true);
        zeroFlag = true;
      }
      if (!zeroFlag) {
        const susPassword = event.target.value;

        setPasswordStatus({
          digit: /^(?=.*?\d)/u.test(susPassword),
          lowercase: /^(?=.*?\p{Ll})/u.test(susPassword),
          uppercase: /^(?=.*?\p{Lu})/u.test(susPassword),
          eightCharacter: /^.{12,}$/u.test(susPassword),
          special: /^(?=.*?[^\w\s]|[_])/u.test(susPassword),
        });

        const regex =
          /^(?=.*?\p{Lu})(?=.*?\p{Ll})(?=.*?\d)(?=.*?[^\w\s]).{12,}$/u;

        if (!regex.test(event.target.value)) {
          setPassordStrong(false);
        } else setPassordStrong(true);
      }
    }

    if (event.target.name === "age") {
      const inputValueNumber = Number(event.target.value);
      const flooredNumber = Math.floor(inputValueNumber);

      if (age_input.current) age_input.current.value = flooredNumber.toString();

      setAge(flooredNumber);

      return setSignUpForm((prev) => ({
        ...prev,
        [event.target.name]: flooredNumber,
      }));
    }

    setSignUpForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  return (
    <>
      <form onSubmit={onSubmit}>
        <Flex gap={1} direction="column">
          <InputGroup>
            <FormControl variant="floating">
              <Input
                required
                name="email"
                type="email"
                autoComplete="new-password"
                pr={!emailRight ? "9" : "2"}
                mb={2}
                onChange={onChange}
                _hover={{
                  border: "1px solid",
                  borderColor: "blue.500",
                }}
                borderColor={emailRight ? "gray.200" : "red"}
                bg="gray.50"
                placeholder=" "
              />
              <FormLabel
                bg="rgba(248,250,252,1)"
                textColor="gray.500"
                fontSize="10pt"
                my="2.5"
              >
                Email
              </FormLabel>
            </FormControl>
            <InputRightElement
              pointerEvents={signUpForm.email ? "unset" : "none"}
            >
              {!emailRight && <Icon as={BiError} fontSize="20px" color="red" />}
            </InputRightElement>
          </InputGroup>

          <InputGroup>
            <FormControl variant="floating">
              <Input
                required
                name="fullname"
                type="text"
                autoComplete="new-password"
                pr={!fullnameRight ? "9" : "2"}
                mb={2}
                onChange={onChange}
                _hover={{
                  border: "1px solid",
                  borderColor: "blue.500",
                }}
                borderColor={fullnameRight ? "gray.200" : "red"}
                bg="gray.50"
                placeholder=" "
              />
              <FormLabel
                bg="rgba(248,250,252,1)"
                textColor="gray.500"
                fontSize="10pt"
                my="2.5"
              >
                Full Name
              </FormLabel>
            </FormControl>

            <InputRightElement
              pointerEvents={signUpForm.fullname ? "unset" : "none"}
            >
              {!fullnameRight && (
                <Icon as={BiError} fontSize="20px" color="red" />
              )}
            </InputRightElement>
          </InputGroup>

          <InputGroup>
            <FormControl variant="floating">
              <Input
                required
                name="username"
                type="text"
                autoComplete="new-password"
                mb={2}
                pr={signUpForm.username ? "9" : "2"}
                value={userNameLowerCaseValue}
                onChange={onChange}
                borderColor={!userNameRight ? "red" : "gray.200"}
                _hover={{
                  border: "1px solid",
                  borderColor: "blue.500",
                }}
                bg="gray.50"
                placeholder=" "
              />
              <FormLabel
                bg="rgba(248,250,252,1)"
                textColor="gray.500"
                fontSize="10pt"
                my="2.5"
              >
                Username
              </FormLabel>
            </FormControl>
          </InputGroup>

          <InputGroup>
            <FormControl variant="floating">
              <Input
                required
                name="password"
                type="password"
                autoComplete="new-password"
                mb={1}
                pr={signUpForm.password ? "9" : "2"}
                onChange={onChange}
                borderColor={!passwordStrong ? "red" : "gray.200"}
                _hover={{
                  border: "1px solid",
                  borderColor: "blue.500",
                }}
                bg="gray.50"
                placeholder=" "
              />
              <FormLabel
                bg="rgba(248,250,252,1)"
                textColor="gray.500"
                fontSize="10pt"
                my="2.5"
              >
                Password
              </FormLabel>
            </FormControl>
            <InputRightElement
              pointerEvents={signUpForm.password ? "unset" : "none"}
            >
              <Flex hidden={signUpForm.password.length === 0}>
                <Icon
                  as={passwordStrong ? AiOutlineCheckCircle : BiError}
                  fontSize="20px"
                  color={passwordStrong ? "green" : "red"}
                />
              </Flex>
            </InputRightElement>
          </InputGroup>

          <InputGroup>
            <FormControl variant="floating">
              <Input
                ref={age_input}
                required
                name="age"
                type="number"
                autoComplete="new-password"
                mb={2}
                onChange={onChange}
                _hover={{
                  border: "1px solid",
                  borderColor: "blue.500",
                }}
                bg="gray.50"
                placeholder=" "
                value={age}
              />
              <FormLabel
                bg="rgba(248,250,252,1)"
                textColor="gray.500"
                fontSize="10pt"
                my="2.5"
              >
                Age
              </FormLabel>
            </FormControl>
          </InputGroup>

          <InputGroup>
            <FormControl variant="floating">
              <Select
                bg="gray.50"
                onChange={(e) => {
                  console.log(e.target.value);
                  setSignUpForm((prev) => ({
                    ...prev,
                    gender: e.target.value as Genders,
                  }));
                }}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
              <FormLabel
                bg="rgba(248,250,252,1)"
                textColor="gray.500"
                fontSize="10pt"
                my="2.5"
              >
                Gender
              </FormLabel>
            </FormControl>
          </InputGroup>

          <InputGroup mt={2}>
            <FormControl variant="floating">
              <Select
                bg="gray.50"
                onChange={(e) => {
                  setSignUpForm((prev) => ({
                    ...prev,
                    country: e.target.value as Countries,
                  }));
                }}
                defaultValue={"Turkey" as Countries}
              >
                {country_list.map((value, i) => (
                  <option key={i}>{value}</option>
                ))}
              </Select>
              <FormLabel
                bg="rgba(248,250,252,1)"
                textColor="gray.500"
                fontSize="10pt"
                my="2.5"
              >
                Country
              </FormLabel>
            </FormControl>
          </InputGroup>

          <Flex
            id="password-requirements"
            direction="column"
            hidden={passwordStrong}
          >
            <Flex
              id="digit"
              align="center"
              gap={1}
              hidden={passwordStatus.digit}
            >
              <Icon fontSize="17px" color={"red"} as={BiErrorCircle} />
              <Text fontSize="10pt" color={"red"} as="b">
                Numbers (0-9)
              </Text>
            </Flex>
            <Flex
              id="lowercase"
              align="center"
              gap={1}
              hidden={passwordStatus.lowercase}
            >
              <Icon fontSize="17px" color={"red"} as={BiErrorCircle} />
              <Text fontSize="10pt" color={"red"} as="b">
                Lower case letters (aa)
              </Text>
            </Flex>
            <Flex
              id="uppercase"
              align="center"
              gap={1}
              hidden={passwordStatus.uppercase}
            >
              <Icon fontSize="17px" color={"red"} as={BiErrorCircle} />
              <Text fontSize="10pt" color={"red"} as="b">
                Upper case letters (AA)
              </Text>
            </Flex>
            <Flex
              id="special"
              align="center"
              gap={1}
              hidden={passwordStatus.special}
            >
              <Icon fontSize="17px" color={"red"} as={BiErrorCircle} />
              <Text fontSize="10pt" color={"red"} as="b">
                Special characters (&*%)
              </Text>
            </Flex>
            <Flex
              id="eightCharacter"
              align="center"
              gap={1}
              hidden={passwordStatus.eightCharacter}
            >
              <Icon fontSize="17px" color={"red"} as={BiErrorCircle} />
              <Text fontSize="10pt" color={"red"} as="b">
                At least 12 characters
              </Text>
            </Flex>
          </Flex>
        </Flex>
        <Button
          width="100%"
          height="36px"
          mt={2}
          mb={2}
          bg="black"
          textColor="white"
          type="submit"
          isLoading={signUpLoading}
          isDisabled={
            !userNameRight || !passwordStrong || !fullnameRight || !emailRight
          }
          _hover={{
            bg: "black",
            textColor: "white",
          }}
        >
          Sign Up
        </Button>

        <Flex justify="center" hidden={signUpLoading}>
          <ReCAPTCHA
            size="normal"
            ref={captchaRef}
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string}
          />
        </Flex>

        <Text color="red" textAlign="center" fontSize="10pt">
          {error}
        </Text>

        <Flex fontSize="9pt" justify="center">
          <Text mr={1}>Have an account?</Text>
          <Text
            color="blue.500"
            fontWeight={700}
            cursor="pointer"
            onClick={() =>
              setAuthModalState((prev) => ({
                ...prev,
                view: "logIn",
              }))
            }
          >
            Log In
          </Text>
        </Flex>
      </form>
    </>
  );
}
