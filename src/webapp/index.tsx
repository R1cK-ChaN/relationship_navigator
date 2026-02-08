import "core-js/stable";
import "regenerator-runtime/runtime";
import { createRoot } from "react-dom/client";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import WebApp from "./components/WebApp";
import "../taskpane/taskpane.css";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <FluentProvider theme={webLightTheme}>
      <WebApp />
    </FluentProvider>
  );
}
