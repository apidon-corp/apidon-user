import useGetFirebase from "../readHooks/useGetFirebase";

export default function useGetFullname() {
  const { getDocServer } = useGetFirebase();

  /**
   * Give username and if exists, returns username.
   * Future, it will save (username => fullname (dataURL)) at atom
   * @param username
   */
  const getFullname = async (username: string): Promise<string> => {
    // userDocRef

    const userDocResult = await getDocServer(`users/${username}`);

    if (userDocResult && !userDocResult.isExists)
      return userDocResult.data.fullname;
    else {
      console.log("No user with this username to get full name");
      return "";
    }
  };
  return {
    getFullname,
  };
}
