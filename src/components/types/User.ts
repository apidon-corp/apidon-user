export type UserInSearchbar = {
  username: string;
  fullname: string;
  profilePhoto: string;
};

export interface UserInServer {
  username: string;
  fullname: string;
  profilePhoto: string;

  followingCount: number;
  followerCount: number;

  nftCount: number;

  email: string;
  uid: string;
}

export const defaultUserInServer: UserInServer = {
  username: "",
  fullname: "",
  profilePhoto: "",

  followingCount: -1,
  followerCount: -1,

  nftCount: -1,

  email: "",
  uid: "",
};

export interface CurrentUser {
  isThereCurrentUser: boolean;

  username: string;
  fullname: string;
  profilePhoto: string;

  nftCount: number;

  email: string;
  uid: string;
}

export const defaultCurrentUserState: CurrentUser = {
  isThereCurrentUser: false,

  username: "",
  fullname: "",
  profilePhoto: "",

  nftCount: 0,

  email: "",
  uid: "",
};

export interface INotificationServerData {
  notificationTime: number;
  seen: boolean;
  sender: string;
  cause: "like" | "follow" | "comment";
  commentDocPath?: string;
}

/**
 * Interface for link previews in social medias.
 */
export interface IPagePreviewData {
  title: string;
  description: string;
  type: string;
  url: string;
  image: string;
}

export interface ICurrentProviderData {
  name: string;
  description: string;
  image: string;

  startTime: number;
  endTime: number;

  yield: number;

  score: number;
  currentUserScore: number;

  clientCount: number;

  progress: number;

  expired: boolean;
}

export interface IProviderShowcaseItem {
  name: string;
  description: string;
  image: string;

  score: number;
  clientCount: number;

  offer: number;
}

export interface InitialSignUpForm {
  email: string;
  fullname: string;
  username: string;
  password: string;
  age: number;
  gender: Genders;
  country: Countries;
}

export const country_list = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Anguilla",
  "Antigua &amp; Barbuda",
  "Argentina",
  "Armenia",
  "Aruba",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bermuda",
  "Bhutan",
  "Bolivia",
  "Bosnia &amp; Herzegovina",
  "Botswana",
  "Brazil",
  "British Virgin Islands",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Cape Verde",
  "Cayman Islands",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Congo",
  "Cook Islands",
  "Costa Rica",
  "Cote D Ivoire",
  "Croatia",
  "Cruise Ship",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Estonia",
  "Ethiopia",
  "Falkland Islands",
  "Faroe Islands",
  "Fiji",
  "Finland",
  "France",
  "French Polynesia",
  "French West Indies",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Gibraltar",
  "Greece",
  "Greenland",
  "Grenada",
  "Guam",
  "Guatemala",
  "Guernsey",
  "Guinea",
  "Guinea Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hong Kong",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Isle of Man",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jersey",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Kyrgyz Republic",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Macau",
  "Macedonia",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Montserrat",
  "Morocco",
  "Mozambique",
  "Namibia",
  "Nepal",
  "Netherlands",
  "Netherlands Antilles",
  "New Caledonia",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "Norway",
  "Oman",
  "Pakistan",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Puerto Rico",
  "Qatar",
  "Reunion",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Pierre &amp; Miquelon",
  "Samoa",
  "San Marino",
  "Satellite",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "St Kitts &amp; Nevis",
  "St Lucia",
  "St Vincent",
  "St. Lucia",
  "Sudan",
  "Suriname",
  "Swaziland",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor L'Este",
  "Togo",
  "Tonga",
  "Trinidad &amp; Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Turks &amp; Caicos",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "Uruguay",
  "Uzbekistan",
  "Venezuela",
  "Vietnam",
  "Virgin Islands (US)",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

export type Countries =
  | "Afghanistan"
  | "Albania"
  | "Algeria"
  | "Andorra"
  | "Angola"
  | "Anguilla"
  | "Antigua &amp; Barbuda"
  | "Argentina"
  | "Armenia"
  | "Aruba"
  | "Australia"
  | "Austria"
  | "Azerbaijan"
  | "Bahamas"
  | "Bahrain"
  | "Bangladesh"
  | "Barbados"
  | "Belarus"
  | "Belgium"
  | "Belize"
  | "Benin"
  | "Bermuda"
  | "Bhutan"
  | "Bolivia"
  | "Bosnia &amp; Herzegovina"
  | "Botswana"
  | "Brazil"
  | "British Virgin Islands"
  | "Brunei"
  | "Bulgaria"
  | "Burkina Faso"
  | "Burundi"
  | "Cambodia"
  | "Cameroon"
  | "Cape Verde"
  | "Cayman Islands"
  | "Chad"
  | "Chile"
  | "China"
  | "Colombia"
  | "Congo"
  | "Cook Islands"
  | "Costa Rica"
  | "Cote D Ivoire"
  | "Croatia"
  | "Cruise Ship"
  | "Cuba"
  | "Cyprus"
  | "Czech Republic"
  | "Denmark"
  | "Djibouti"
  | "Dominica"
  | "Dominican Republic"
  | "Ecuador"
  | "Egypt"
  | "El Salvador"
  | "Equatorial Guinea"
  | "Estonia"
  | "Ethiopia"
  | "Falkland Islands"
  | "Faroe Islands"
  | "Fiji"
  | "Finland"
  | "France"
  | "French Polynesia"
  | "French West Indies"
  | "Gabon"
  | "Gambia"
  | "Georgia"
  | "Germany"
  | "Ghana"
  | "Gibraltar"
  | "Greece"
  | "Greenland"
  | "Grenada"
  | "Guam"
  | "Guatemala"
  | "Guernsey"
  | "Guinea"
  | "Guinea Bissau"
  | "Guyana"
  | "Haiti"
  | "Honduras"
  | "Hong Kong"
  | "Hungary"
  | "Iceland"
  | "India"
  | "Indonesia"
  | "Iran"
  | "Iraq"
  | "Ireland"
  | "Isle of Man"
  | "Israel"
  | "Italy"
  | "Jamaica"
  | "Japan"
  | "Jersey"
  | "Jordan"
  | "Kazakhstan"
  | "Kenya"
  | "Kuwait"
  | "Kyrgyz Republic"
  | "Laos"
  | "Latvia"
  | "Lebanon"
  | "Lesotho"
  | "Liberia"
  | "Libya"
  | "Liechtenstein"
  | "Lithuania"
  | "Luxembourg"
  | "Macau"
  | "Macedonia"
  | "Madagascar"
  | "Malawi"
  | "Malaysia"
  | "Maldives"
  | "Mali"
  | "Malta"
  | "Mauritania"
  | "Mauritius"
  | "Mexico"
  | "Moldova"
  | "Monaco"
  | "Mongolia"
  | "Montenegro"
  | "Montserrat"
  | "Morocco"
  | "Mozambique"
  | "Namibia"
  | "Nepal"
  | "Netherlands"
  | "Netherlands Antilles"
  | "New Caledonia"
  | "New Zealand"
  | "Nicaragua"
  | "Niger"
  | "Nigeria"
  | "Norway"
  | "Oman"
  | "Pakistan"
  | "Palestine"
  | "Panama"
  | "Papua New Guinea"
  | "Paraguay"
  | "Peru"
  | "Philippines"
  | "Poland"
  | "Portugal"
  | "Puerto Rico"
  | "Qatar"
  | "Reunion"
  | "Romania"
  | "Russia"
  | "Rwanda"
  | "Saint Pierre &amp; Miquelon"
  | "Samoa"
  | "San Marino"
  | "Satellite"
  | "Saudi Arabia"
  | "Senegal"
  | "Serbia"
  | "Seychelles"
  | "Sierra Leone"
  | "Singapore"
  | "Slovakia"
  | "Slovenia"
  | "South Africa"
  | "South Korea"
  | "Spain"
  | "Sri Lanka"
  | "St Kitts &amp; Nevis"
  | "St Lucia"
  | "St Vincent"
  | "St. Lucia"
  | "Sudan"
  | "Suriname"
  | "Swaziland"
  | "Sweden"
  | "Switzerland"
  | "Syria"
  | "Taiwan"
  | "Tajikistan"
  | "Tanzania"
  | "Thailand"
  | "Timor L'Este"
  | "Togo"
  | "Tonga"
  | "Trinidad &amp; Tobago"
  | "Tunisia"
  | "Turkey"
  | "Turkmenistan"
  | "Turks &amp; Caicos"
  | "Uganda"
  | "Ukraine"
  | "United Arab Emirates"
  | "United Kingdom"
  | "Uruguay"
  | "Uzbekistan"
  | "Venezuela"
  | "Vietnam"
  | "Virgin Islands (US)"
  | "Yemen"
  | "Zambia"
  | "Zimbabwe";

export type Genders = "male" | "female";
export const genders_list = ["male", "female"];

export type SignUpRequestBody = {
  email: string;
  fullname: string;
  username: string;
  password: string;
  age: number;
  gender: Genders;
  country: Countries;
  captchaToken: string;
};

export type PersonalDataInServer = {
  age: number;
  gender: Genders;
  country: Countries;
};

export type DataAnalysisPreferencesInServer = {
  likeAnalysis: boolean;
  commentAnalysis: boolean;
};

/**
 * For State Management in DataAnalysisSettingsModal
 */
export type DataAnalysisPreferencesState = {
  likeAnalysis: boolean;
  commentAnalysis: boolean;
};

/**
 * This Type can be used for both in database (Firebase) and state management.
 */
export type LikeDataForUsersPersonal = {
  postPath: string;
  ts: number;
};

/**
 * To show user what he/she liked.
 */
export type LikedItemData = {
  timestamp: number;
  postSenderUsername: string;
  postURL: string;
  postDocPath: string;
};

/**
 * To show user what he/she commented.
 */
export type CommentedItemData = {
  timestamp: number;
  postSenderUsername: string;
  postURL: string;
  commentDocPathOnPost: string;
  comment: string;
};

export type PostClassifyBody = {
  postDocPath: string;
  imageURL: string;
  username: string;
  providerId: string;
  startTime: number;
};
