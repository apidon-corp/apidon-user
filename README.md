# apidon-user

[<img src="https://www.apidon.com/android-chrome-512x512.png" alt="Apidon Logo" width="200">](https://www.apidon.com/)

## Caution

For general information please look at [apidon-info](https://github.com/aboveStars/apidon-info) repo or directly to the [apidon.com](https://www.apidon.com/).

## Introduction

There are three technical repos for the Apidon project.

- apdion-user (this)
- [apidon-provider](https://github.com/aboveStars/apidon-provider)
- [apidon-smartcontracts](https://github.com/aboveStars/apidon-smartcontracts)

## Getting Started

To run this project locally or on your system, you should set three repos (apdion-user (this), [apidon-provider](https://github.com/aboveStars/apidon-provider) and [apidon-smartcontracts](https://github.com/aboveStars/apidon-smartcontracts))

- Make apidon-user ready:

  - Firebase:

    - Create new [Firebase](https://firebase.google.com/) project, and activate authentication, storage and firestore. Then find the enviroment variables in your firebase that corresspond with below varibales. (mostly in project settings)

      - NEXT_PUBLIC_FIREBASE_API_KEY=
      - NEXT PUBLIC_FIREBASE_AUTH_DOMAIN=
      - NEXT_PUBLIC_FIREBASE_PROJECT_ID=
      - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
      - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
      - NEXT_PUBLIC_FIREBASE_APP_ID=
      - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

    - Find your main "folder-path" in Firebase Storage section. It is something like: "gs://---.appspot.com". Then create new enviroment variable like below:
      - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_ID=gs://apidon-user.appspot.com
    - Generate new private key for "firebase-admin-account" from "firebase / project settings / service accounts"
      - Convert contents of "service account json file" to "Base64" like below:
        ```ts
        const jsonString = JSON.stringify(jsonData);
        const base64String = Buffer.from(jsonString).toString("base64");
        ```
      - Then create new enviroment variable like below:
        - NEXT_PUBLIC_GOOGLE_APPLICATION_CREDENTIALS_BASE64=

  - web3:

    - You need to have an web3 account / wallet on [mumbai](https://mumbai.polygonscan.com/) network. Then you need to add enviroment varibales like below:
      - NEXT_PUBLIC_OWNER_PUBLIC_ADDRESS=
      - NEXT_PUBLIC_PRIVATE_KEY=
    - You need to have API key for accessing to mumbai network.
      - Create new "app" from [alchemy](https://www.alchemy.com/) for "Polygon-Mumbai" network. (You don't have to use "alchemy". Use any service you want.)
      - Then add create new enviroment variable like below:
        - NEXT_PUBLIC_MUMBAI_API=

  - recoil:

    - At devlelopment enviroment for ignoring "false" errors on recoil we should disable duplicate checking.
      - Add this enviroment variable to ".env" or ".env.local" file:
        - RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED=false

  - status-page

    - Create new status page for your project from [Atlassian Status Page Service (free)](https://www.atlassian.com/software/statuspage).
    - Then find "embed code" for your status page on Atlassian and create new enviroment variable like below
      - NEXT_PUBLIC_STATUS_PAGE_CODE= https://---.statuspage.io/embed/script.js

  - Recaptcha
    - On sign-up, project uses "recaptcha" human verification.
      - Register new website on [Google Recaptcha V3](https://www.google.com/recaptcha) and create two enviroment varibles like below:
        - NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
        - NEXT_PUBLIC_RECAPTCHA_SECRET_KEY=
  - Anonymous-Validation:
    - To show contents to un-signed users, project (server) validates if request coming from main website. So project needs an key for validitaion. You can set any value.
      - Create new enviroment varibale like below:
        - NEXT_PUBLIC_ANONYMOUS_ENTERANCE_KEY= "your-preffered-password"
  - Inter-Project-Validation:

    - Because "apidon-user" depends "apidon-provider", project uses "common" key for validation if request came from "our" (apidon-user, apidon-provider) services.You can set any value you want.
      - Create new enviroment variable like below:
        - NEXT_PUBLIC_API_KEY_BETWEEN_SERVICES="your-preffered-password"

  - Inter-Project-API-Address:
    - Because "apidon-user" depends "apidon-provider" and they should communicate, we should tell to "apidon-user" where "apidon-provider" is.
      - Create new enviroment variable like below:
        - NEXT_PUBLIC_API_ENDPOINT_TO_APIDON_PROVIDER_SERVER= [paste here where apidon-provider url is]
          - Example: Because "apidon-provider" is running on "192.168.1.6:3000" on my machine, I added enviroment variable like below.
            - NEXT_PUBLIC_API_ENDPOINT_TO_APIDON_PROVIDER_SERVER=http://192.168.1.6:3000/api
