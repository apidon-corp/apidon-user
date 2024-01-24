import {
  PersonalDataInServer,
  SignUpRequestBody,
  UserInServer,
  country_list,
  genders_list,
} from "@/components/types/User";
import AsyncLock from "async-lock";
import { AuthError } from "firebase/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "../../firebase/adminApp";

const lock = new AsyncLock();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const requestBody: SignUpRequestBody = req.body;

  let response: Response;
  try {
    response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.NEXT_PUBLIC_RECAPTCHA_SECRET_KEY}&response=${requestBody.captchaToken}`,
      {
        method: "POST",
      }
    );
  } catch (error) {
    console.error(
      "Error on signUp.(We were fetching to 'googleRepactchaService'.)",
      error
    );
    return res.status(503).json({ error: "Recaptcha Server Error" });
  }

  if (!(await response.json()).success)
    return res
      .status(401)
      .json({ error: "reCaptcha human verification resulted false." });

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  await lock.acquire(`signupAPI-${requestBody.username}`, async () => {
    const emailRegex =
      /^[A-Za-z0-9._%+-]+@(gmail|yahoo|outlook|aol|icloud|protonmail|yandex|mail|zoho)\.(com|net|org)$/i;
    if (!emailRegex.test(requestBody.email)) {
      return res.status(422).json({ error: "Invalid Email" });
    }
    const fullnameRegex = /^[\p{L}_ ]{3,20}$/u;
    const consecutiveSpaceRegex = /\s\s/;
    if (
      !fullnameRegex.test(requestBody.fullname) ||
      consecutiveSpaceRegex.test(requestBody.fullname) ||
      requestBody.fullname[requestBody.fullname.length - 1] === " "
    ) {
      return res.status(422).json({ error: "Invalid Fullname" });
    }
    const usernameRegex = /^[a-z0-9]{3,20}$/;
    if (!usernameRegex.test(requestBody.username)) {
      return res.status(422).json({ error: "Invalid Username" });
    }

    let usernameDoc;
    try {
      usernameDoc = await firestore
        .doc(`usernames/${requestBody.username}`)
        .get();
    } catch (error) {
      console.error(
        "Error while signup.(We were checking if username is taken)",
        error
      );
      return res.status(503).json({ error: "Firebase error" });
    }

    if (usernameDoc.exists) {
      return res.status(409).json({ error: "Username taken" });
    }

    const passwordRegex =
      /^(?=.*?\p{Lu})(?=.*?\p{Ll})(?=.*?\d)(?=.*?[^\w\s]|[_]).{12,}$/u;
    if (!passwordRegex.test(requestBody.password)) {
      return res.status(400).json({ error: "Invalid Password" });
    }

    if (typeof requestBody.age !== "number") {
      return res.status(422).json({ error: "Invalid Age" });
    }
    if (requestBody.age < 0)
      return res.status(422).json({ error: "Invalid Age" });

    if (!genders_list.includes(requestBody.gender)) {
      return res.status(422).json({ error: "Invalid Gender" });
    }

    if (!country_list.includes(requestBody.country)) {
      return res.status(422).json({ error: "Invalid Country" });
    }

    let newUserData: UserInServer;
    let createdUid;
    let newUserPersonalData: PersonalDataInServer;
    try {
      const { uid } = await auth.createUser({
        email: requestBody.email,
        password: requestBody.password,
        displayName: requestBody.username,
      });
      createdUid = uid;
    } catch (error) {
      console.error("Error while signup. (We were creating user)", error);
      const err = error as AuthError;
      return res.status(503).json({ error: err.message });
    }

    try {
      const batch = firestore.batch();
      batch.set(firestore.doc(`usernames/${requestBody.username}`), {});
      newUserData = {
        username: requestBody.username,
        fullname: requestBody.fullname,
        profilePhoto: "",

        followingCount: 0,
        followerCount: 0,
        nftCount: 0,

        email: requestBody.fullname || "",
        uid: createdUid,
      };

      batch.set(firestore.doc(`users/${requestBody.username}`), newUserData);

      newUserPersonalData = {
        age: requestBody.age,
        gender: requestBody.gender,
        country: requestBody.country,
      };

      batch.set(
        firestore.doc(`users/${requestBody.username}/personal/profile`),
        newUserPersonalData
      );
      await batch.commit();
    } catch (error) {
      console.error("Error while signup. (We were creating docs)", error);
      return res.status(503).json({ error: error });
    }
    return res.status(200).json(newUserData);
  });
}
