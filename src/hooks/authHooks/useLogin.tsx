import { auth } from "@/firebase/clientApp";
import { UserCredential, signInWithEmailAndPassword } from "firebase/auth";

const useLogin = () => {
  /**
   *
   * This function is used by login and signup operations.
   * At signup, after creating user, we make user login.
   * After this login function, on layout page; we are getting additional data for user and updates states.
   * So this method is just for firebase sign.
   *
   * @param email
   * @param password
   */
  const logUserIn = async (email: string, password: string) => {
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
    logUserIn,
  };
};

export default useLogin;
