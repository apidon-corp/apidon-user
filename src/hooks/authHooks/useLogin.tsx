import { auth } from "@/firebase/clientApp";
import { UserCredential, signInWithEmailAndPassword } from "firebase/auth";

import useGetFirebase from "../readHooks/useGetFirebase";

const useLogin = () => {
  const { getDocServer } = useGetFirebase();

  /**
   * @param emailOrUsername
   * @param password
   */
  const logSignedOutUserIn = async (
    emailOrUsername: string,
    password: string
  ) => {
    let email: string = "";

    const emailRegex = /\S+@\S+\.\S+/;
    const isEmail = emailRegex.test(emailOrUsername);

    if (isEmail) {
      email = emailOrUsername;
    } else {
      const username = emailOrUsername;

      const userDocResult = await getDocServer(`users/${username}`);
      if (!userDocResult) return;

      if (!userDocResult.isExists) {
        email = "";
      } else {
        email = userDocResult.data.email;
      }
    }

    if (!email) return false;

    let userCred: UserCredential;
    try {
      userCred = await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error while logging provider.", error);
      return false;
    }

    return true;
  };

  return {
    logSignedOutUserIn,
  };
};

export default useLogin;
