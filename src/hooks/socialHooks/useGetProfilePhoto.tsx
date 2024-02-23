import useGetFirebase from "../readHooks/useGetFirebase";

export default function useGetProfilePhoto() {
  const { getDocServer } = useGetFirebase();

  /**
   * Give username and if exists, returns downloadable URL.
   * If there is user, but no pp then returns empty string
   * Future, it will save (username => profilePhoto (dataURL)) at atom
   * @param username
   */
  const getProfilePhotoURL = async (username: string): Promise<string> => {
    // userDocRef

    const userDocResult = await getDocServer(`users/${username}`);

    if (userDocResult && userDocResult.isExists)
      return userDocResult.data.profilePhoto;
    else {
      console.log("No user with this username to get pp");
      return "";
    }
  };

  return {
    getProfilePhotoURL,
  };
}
