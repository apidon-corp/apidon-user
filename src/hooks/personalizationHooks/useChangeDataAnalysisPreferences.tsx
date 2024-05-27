import {
  DataAnalysisPreferencesInServer,
  DataAnalysisPreferencesState,
} from "@/components/types/User";
import { auth } from "@/firebase/clientApp";

export default function useChangeDataAnalysisPreferences() {
  const changeDataAnalysisPreferences = async (
    dataAnalysisPreferences: DataAnalysisPreferencesState
  ) => {
    let idToken = "";
    try {
      idToken = (await auth.currentUser?.getIdToken()) as string;
    } catch (error) {
      console.error(
        "Error on data analysis settings changing. IdToken couldn't be taken.",
        error
      );
      return false;
    }

    let response;

    try {
      response = await fetch("/api/user/changeDataAnalysisSettings", {
        method: "POST",
        headers: {
          authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          dataAnalysisPreferences as DataAnalysisPreferencesInServer
        ),
      });
    } catch (error) {
      console.error(
        "Error while fetching 'changeDataAnalysisSettings' API",
        error
      );
      return false;
    }

    if (!response.ok) {
      console.error(
        "Error while changing data preferences from changeDataAnalysisSettings API",
        await response.text()
      );
      return false;
    }

    return true;
  };

  return { changeDataAnalysisPreferences };
}
