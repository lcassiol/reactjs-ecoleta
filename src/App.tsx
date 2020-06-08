import React from "react";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Routes from "./routes";

function App() {
  return (
    <>
      <Routes />
      <ToastContainer autoClose={2500} />
    </>
  );
}

export default App;
