# apidon-user

[<img src="https://www.apidon.com/android-chrome-512x512.png" alt="Apidon Logo" width="200">](https://www.apidon.com/)

## Caution

> For comprehensive information, kindly refer to the [apidon-info](https://github.com/aboveStars/apidon-info) repository or access [apidon.com](https://www.apidon.com/) directly.

## Introduction

There are three technical repos for the Apidon project:

- **apdion-user (this)**
- [apidon-provider](https://github.com/aboveStars/apidon-provider)
- [apidon-smartcontracts](https://github.com/aboveStars/apidon-smartcontracts)

## Getting Started

To execute this project on your local machine or system, you are required to configure three repositories:

1.  **apdion-user (this)**
2.  [apidon-provider](https://github.com/aboveStars/apidon-provider)
3.  [apidon-smartcontracts](https://github.com/aboveStars/apidon-smartcontracts)

- Prepare **apidon-user**

  - **[Firebase](https://firebase.google.com/) Section**

    - Create a new _Firebase_ project, and activate **authentication** _(also activate email-password method in Authentication section)_, **storage** and **firestore**. Then find the _keys_ of the your Firebase project from _project settings_.

    - **Then add these enviroment variables to ".env" or ".env.local" file as below.**

      ```ts
        NEXT_PUBLIC_FIREBASE_API_KEY= "api-key"
        NEXT PUBLIC_FIREBASE_AUTH_DOMAIN= "auth-domain"
        NEXT_PUBLIC_FIREBASE_PROJECT_ID= "project-id"
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET= "storage-bucket"
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID= "messaging-sender-id"
        NEXT_PUBLIC_FIREBASE_APP_ID= "app-id"
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID= "measurement-id"
      ```

    - Find your **main "folder-path"** in **Firebase Storage** section. It is something like: _"gs://---.appspot.com"_.
      - **Then add these enviroment variables to ".env" or ".env.local" file as below.**

        ```ts
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_ID = "gs://...-...appspot.com";
        ```

    - You need to set "cors" policy from Google Cloud Console for **Firebase Storage**.

      - Please follow this [stackoverflow answer](https://stackoverflow.com/a/58613527).

    - Generate new **Firebase Service Account** key from _"firebase/project settings/service accounts"_ and download it.
      - Convert contents of **downloaded file** to "_Base64_" like below and copy final result (_base64string_).
        ```ts
        const jsonString = JSON.stringify(jsonData);
        const base64String = Buffer.from(jsonString).toString("base64");
        ```
      - **Then add an enviroment variable to ".env" or ".env.local" file as below.**
        ```ts
        NEXT_PUBLIC_GOOGLE_APPLICATION_CREDENTIALS_BASE64 =
          "base64-converted-service-account";
        ```

  - **Web3 Section**

    - You need to have an[ **web3 account/wallet**](https://metamask.io/) on [Polygon Mumbai](https://mumbai.polygonscan.com/) network.

      - You need to find your **public** address and your **private** key.
      - **Then add enviroment variables to ".env" or ".env.local" file as below.**

        ```ts
        NEXT_PUBLIC_OWNER_PUBLIC_ADDRESS = "your-web3-public-address";
        NEXT_PUBLIC_PRIVATE_KEY = "your-web3-private-key";
        ```

    - You need to have an API key for accessing to _Polygon Mumbai_ network.
      - Create new "app" from [alchemy](https://www.alchemy.com/) for **"Polygon-Mumbai"** network. (You don't have to use "alchemy". Use any service you want.). Then find your API key.
      - **Then add an enviroment variable to ".env" or ".env.local" file as below.**
        ```ts
        NEXT_PUBLIC_MUMBAI_API = "mumbai-api";
        ```

  - **Recoil Section**

    - "To ignore false duplication errors in Recoil when working in development environments, you can disable duplicate checking in the ".env" or ".env.local" file."

    - **Add below enviroment variable to ".env" or ".env.local" file**

      ```ts
      RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED = false;
      ```

  - **Status Page Section**

    - Create new status page for your project from [Atlassian Status Page Service (free)](https://www.atlassian.com/software/statuspage).
    - **Then find **"embed code"** for your status page on Atlassian and add the enviroment variable to ".env" or ".env.local" file as below.**
      ```ts
      NEXT_PUBLIC_STATUS_PAGE_CODE =
        "https://---.statuspage.io/embed/script.js";
      ```

  - **ReCaptcha Section**

    - Because project has **human verification** process on  **sign up** , we should set up **reCaptcha v3 with "challange v2" and "I am not robot checkbox" method.**
    - **Register new website on [Google Recaptcha V3](https://www.google.com/recaptcha) and add enviroment variables to ".env" or ".env.local" file as below.**

      ```ts
      NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "site-key";
      NEXT_PUBLIC_RECAPTCHA_SECRET_KEY = "secret-key";
      ```

  - **Anonymous Access Section**
    - To show contents to **unsigned** users, project (server) checks if the request comes from the verified website. So project needs a key for validitaion. You can set any value.
    - **Add an enviroment variable to ".env" or ".env.local" file as below.**
      ```ts
      NEXT_PUBLIC_ANONYMOUS_ENTERANCE_KEY = "your-preffered-key";
      ```
  - **Inter Projects Validation Section**

    - Because _"apidon-user"_ depends _"apidon-provider"_, project uses **"common"** key for validation if request comes from one of Apidon projects. **You can set any value you want.**
    - **Add an enviroment variable to ".env" or ".env.local" file as below.**
      ```ts
      NEXT_PUBLIC_API_KEY_BETWEEN_SERVICES = "your-preffered-key";
      ```

  - **apidon-provider-api-address Section**

    - Because _"apidon-user"_ depends _"apidon-provider"_ and they should communicate, we should tell to "apidon-user" where "apidon-provider" are running at.

    - **Example**: Because "apidon-provider" is running on **"192.168.1.6:3000" on my machine**, I added enviroment variable like below.

      > Don't forget to add **"/api"** addition.

      ```ts
      NEXT_PUBLIC_API_ENDPOINT_TO_APIDON_PROVIDER_SERVER =
        "http://192.168.1.6:3000/api";
      ```
