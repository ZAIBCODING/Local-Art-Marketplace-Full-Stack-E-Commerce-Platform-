import "@/styles/globals.css";
import { Provider } from "jotai";

export default function App({ Component, pageProps }) {
  return (
    <Provider>
      <Component {...pageProps} />
    </Provider>
  );
}