import {
  GetCollectionBody,
  GetCollectionResponse,
  GetDocBody,
  GetDocResponse,
} from "@/components/types/API";
import { auth } from "@/firebase/clientApp";

export default function useGetFirebase() {
  const getDocServer = async (docPath: string) => {
    let idToken = "";
    try {
      idToken = (await auth.currentUser?.getIdToken()) as string;
    } catch (error) {
      console.error(
        "Error on read database. We were authenticating user...: ",
        error
      );
      return false;
    }

    let getDocResponse: GetDocResponse;
    const body: GetDocBody = {
      docPath: docPath,
    };

    try {
      const response = await fetch("/api/read/getDoc", {
        method: "POST",
        headers: {
          authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...body }),
      });
      if (!response.ok) {
        throw new Error(
          `Response from 'readDatbase' API is not OKAY: ${await response.text()}`
        );
      }
      getDocResponse = await response.json();
    } catch (error) {
      console.error("Erron on Fetching 'readDatabase' API ", error);
      return false;
    }

    return getDocResponse;
  };

  const getCollectionServer = async (collectionPath: string) => {
    let idToken = "";
    try {
      idToken = (await auth.currentUser?.getIdToken()) as string;
    } catch (error) {
      console.error(
        "Error on getCollectionDocDatas. We were authenticating user...: ",
        error
      );
      return false;
    }

    const getColletionBody: GetCollectionBody = {
      collectionPath: collectionPath,
    };

    let getCollectionResponse: GetCollectionResponse;
    try {
      const response = await fetch("/api/read/getCollection", {
        method: "POST",
        headers: {
          authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...getColletionBody }),
      });

      if (!response.ok)
        throw new Error(
          `Response from 'getCollectionDocs' is NOT ok. Error: ${await response.text()}`
        );
      getCollectionResponse = await response.json();
    } catch (error) {
      console.error("Error on fetch 'getCollectionDocs' API: ", error);
      return false;
    }

    return getCollectionResponse;
  };

  return { getDocServer, getCollectionServer };
}
