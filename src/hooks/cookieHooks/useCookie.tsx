import Cookies from "js-cookie";
export default function useCookie() {
  const setCookie = (key: string, value: string) => {
    Cookies.set(key, value);
  };
  return { setCookie };
}
